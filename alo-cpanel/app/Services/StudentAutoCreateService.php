<?php
declare(strict_types=1);

/**
 * StudentAutoCreateService — Auto-creates Student portal user on WhatsApp first contact
 *
 * Spec §7: AE-2023xxxx (or AE-YYYYxxxx), student_code unique, portal_token invite, welcome message from 01805020100
 */
class StudentAutoCreateService
{
    /**
     * Ensure a student exists for a whatsapp contact. Creates if missing.
     *
     * @param string $phone Normalized or raw
     * @param string $profileName WhatsApp profile name
     * @param int|null $branchId
     * @param string|null $sourceNumber Official sender (01805020100)
     * @return array{student_id:int, is_new:bool, student_code:string, portal_token:?string}
     */
    public static function ensureStudent(string $phone, string $profileName = '', ?int $branchId = null, ?string $sourceNumber = null): array
    {
        $normalized = AloWhatsAppNumberService::normalizePhone($phone);
        if ($normalized === null) {
            throw new InvalidArgumentException('Invalid phone: ' . $phone);
        }
        $displayPhone = '0' . substr($normalized, 3); // 880... -> 018...
        $official = $sourceNumber ?? AloWhatsAppNumberService::DEFAULT_SENDER;

        try {
            $pdo = db();
            // Try by whatsapp_phone or phone
            $stmt = $pdo->prepare('SELECT id, student_code, portal_token FROM students WHERE whatsapp_phone = :wp OR phone = :p LIMIT 1');
            $stmt->execute([':wp' => $displayPhone, ':p' => $displayPhone]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                return ['student_id' => (int)$existing['id'], 'is_new' => false, 'student_code' => $existing['student_code'] ?? '', 'portal_token' => $existing['portal_token'] ?? null];
            }
            // Also check by normalized in contacts -> lead mapping? For now create.

            // Generate AE-YYYYxxxx (year = current, seq = max+1 for that year)
            $year = date('Y');
            $prefix = 'AE-' . $year;
            $pdo->beginTransaction();
            // Lock students for sequence
            $stmt = $pdo->prepare("SELECT student_code FROM students WHERE student_code LIKE :pat ORDER BY student_code DESC LIMIT 1 FOR UPDATE");
            $stmt->execute([':pat' => $prefix . '%']);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $seq = 1;
            if ($row && preg_match('/(\d+)\s*$/', $row['student_code'], $m)) {
                $seq = ((int)$m[1]) + 1;
            }
            $studentCode = $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
            // Ensure unique (race) — if duplicate, increment
            $attempts = 0;
            while ($attempts < 5) {
                $check = $pdo->prepare('SELECT id FROM students WHERE student_code = :sc LIMIT 1');
                $check->execute([':sc' => $studentCode]);
                if (!$check->fetchColumn()) break;
                $seq++;
                $studentCode = $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
                $attempts++;
            }
            $portalToken = bin2hex(random_bytes(16));
            $crmId = generate_crm_id('ALO-CRM');
            $name = $profileName !== '' ? $profileName : 'WhatsApp Lead ' . substr($displayPhone, -4);
            // Insert minimal student — respect existing students schema (has crm_id, name, phone, email nullable etc.)
            // Schema has: crm_id, lead_id, branch_id, name, email, phone, whatsapp_phone, student_code, portal_token, status etc.
            // We use prepared and ignore extra columns not present.
            // First inspect columns
            $colsStmt = $pdo->query('SHOW COLUMNS FROM students');
            $cols = [];
            while ($c = $colsStmt->fetch(PDO::FETCH_ASSOC)) { $cols[] = $c['Field']; }
            $data = [
                'crm_id'          => $crmId,
                'name'            => $name,
                'phone'           => $displayPhone,
                'whatsapp_phone'  => $displayPhone,
                'student_code'    => $studentCode,
                'portal_token'    => $portalToken,
                'official_whatsapp_number' => $official,
                'status'          => 'pending',
                'branch_id'       => $branchId,
            ];
            // Filter to existing columns
            $data = array_filter($data, fn($k) => in_array($k, $cols, true), ARRAY_FILTER_USE_KEY);
            // Add defaults for required NOT NULL without default
            // Try insert
            $fields = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            $sql = 'INSERT INTO students (' . $fields . ', created_at, updated_at) VALUES (' . $placeholders . ', NOW(), NOW())';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($data);
            $studentId = (int)$pdo->lastInsertId();

            // Add columns that may be missing but we set after if column exists: portal_invited_at, welcome_sent_at
            if (in_array('portal_invited_at', $cols, true)) {
                $pdo->prepare('UPDATE students SET portal_invited_at = NOW() WHERE id = :id')->execute([':id' => $studentId]);
            }
            if (in_array('welcome_sent_at', $cols, true)) {
                // Will be set after welcome message sent
            }

            // Create whatsapp_contact if not exists
            try {
                $pdo->prepare('INSERT IGNORE INTO whatsapp_contacts (phone, normalized_phone, profile_name, student_id, source, first_contact_channel, official_whatsapp_number) VALUES (:p, :n, :pn, :sid, "WhatsApp AI", "WhatsApp", :off)')
                    ->execute([':p' => $displayPhone, ':n' => $normalized, ':pn' => $profileName, ':sid' => $studentId, ':off' => $official]);
            } catch (\Throwable $e) { /* contacts table may not exist yet */ }

            // Log activity maybe
            try {
                $pdo->prepare('INSERT INTO activities (user_id, student_id, type, description) VALUES (NULL, :sid, "student_auto_created", :desc)')
                    ->execute([':sid' => $studentId, ':desc' => 'Student auto-created via WhatsApp from ' . $displayPhone . ' code ' . $studentCode]);
            } catch (\Throwable $e) {}

            $pdo->commit();

            // Send portal invite via WhatsApp (async but we do inline with best effort)
            self::sendWelcome($displayPhone, $name, $studentCode, $portalToken, $official);

            return ['student_id' => $studentId, 'is_new' => true, 'student_code' => $studentCode, 'portal_token' => $portalToken];
        } catch (\Throwable $e) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            error_log('StudentAutoCreateService error: ' . $e->getMessage());
            throw $e;
        }
    }

    private static function sendWelcome(string $phone, string $name, string $code, string $token, string $official): void
    {
        try {
            $appUrl = defined('APP_URL') ? APP_URL : (getenv('APP_URL') ?: 'https://crm.aloeducation.com');
            $portalLink = rtrim($appUrl, '/') . '/portal/activate?token=' . $token;
            $body = "Assalamualaikum {$name},\n\n"
                . "Welcome to ALO Education! Your student ID is {$code}.\n"
                . "Activate your portal here: {$portalLink}\n\n"
                . "Our counselor will contact you shortly from {$official}. Save this number.\n"
                . "Reply HELP anytime.\n\n-ALO Education";
            $svc = WhatsAppCloudService::fromEnv();
            $res = $svc->sendText($phone, $body);
            if ($res['success']) {
                try {
                    $pdo = db();
                    $pdo->prepare('UPDATE students SET welcome_sent_at = NOW() WHERE student_code = :sc')->execute([':sc' => $code]);
                } catch (\Throwable $e) {}
            }
        } catch (\Throwable $e) {
            error_log('sendWelcome error: ' . $e->getMessage());
        }
    }

    /**
     * Generate next AE-YYYYxxxx without creating (for tests).
     */
    public static function nextStudentCode(): string
    {
        try {
            $pdo = db();
            $year = date('Y');
            $prefix = 'AE-' . $year;
            $stmt = $pdo->prepare("SELECT student_code FROM students WHERE student_code LIKE :pat ORDER BY student_code DESC LIMIT 1");
            $stmt->execute([':pat' => $prefix . '%']);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $seq = 1;
            if ($row && preg_match('/(\d+)\s*$/', $row['student_code'], $m)) $seq = ((int)$m[1]) + 1;
            return $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
        } catch (\Throwable $e) {
            return 'AE-' . date('Y') . '0001';
        }
    }
}
