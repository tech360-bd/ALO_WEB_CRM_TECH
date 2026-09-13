<?php
declare(strict_types=1);

/**
 * AloWhatsAppNumberService — Central registry for official number pools
 *
 * Pools (BD):
 *   Main/Complaint/Followup: 01805020100 -> 8801805020100
 *   COO/24x7 Support:        01805020101 -> 8801805020101
 *   Employee pool:           01805020102-01805020119 -> 8801805020102-19
 *
 * Responsibilities:
 *  - normalizePhone (BD-compliant, mirrors normalizeBdPhone slice fix)
 *  - CRUD + assignment + audit logging for alo_whatsapp_numbers
 *  - routing helpers used by webhook, SLAs, followups, dashboard
 *
 * Security: prepared statements only; never interpolate phone/names in SQL.
 */
class AloWhatsAppNumberService
{
    public const MAIN_NUMBER       = '01805020100';
    public const COO_NUMBER        = '01805020101';
    public const EMPLOYEE_START    = '01805020102';
    public const EMPLOYEE_END      = '01805020119';
    public const DEFAULT_SENDER    = '01805020100';

    public const NORMALIZED_MAIN   = '8801805020100';
    public const NORMALIZED_COO    = '8801805020101';

    /**
     * Normalize any BD phone to E.164 without "+" (8801XXXXXXXXX).
     * Mirrors TS fix: raw 880 + 01... must slice '880' + last 10 digits, not naive 880+digits.
     *
     * @param string $phone Raw input (may contain spaces, dashes, +, 0 prefix, 880...)
     * @return string|null 8801... or null if unparseable
     */
    public static function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return null;
        }

        // If user sent 8801805... already, ensure it's 13 digits starting 8801
        if (str_starts_with($digits, '880')) {
            // FIX: use slice, not blind prefix — 880 + 880180... would be 16 digits otherwise
            // Example bug: normalizeBdPhone('8801805020100') previously = 8808801805020100 (WRONG)
            // Correct: strip leading 880, take last 10, re-add 880
            $withoutCountry = substr($digits, 3);
            // Keep only last 10 if they sent with extra leading 0 or repeated country
            if (strlen($withoutCountry) > 10) {
                $withoutCountry = substr($withoutCountry, -10);
            }
            // Pad if somehow 9 digits (malformed 1xxx...), but expect 10
            if (strlen($withoutCountry) === 10 && str_starts_with($withoutCountry, '0')) {
                // 018... after stripping 880 -> 180... (without leading 0)
                // If they somehow sent 880+018... = 880018..., we trimmed to 018..., need to strip that 0
                $withoutCountry = ltrim($withoutCountry, '0');
                // But then it'd be 9 digits; prepend 1? Better leave as is for validation below
                // Actually BD mobiles are 1xxx with leading 1, so after stripping 0 we want 1xxx (10->9 truncated?)
                // Safer: if it still starts with 0, it was double-zero; just drop it
                if (strlen($withoutCountry) === 10) {
                    $withoutCountry = substr($withoutCountry, 1);
                }
            }
            // After slicing we should have 10 digits like 1805020100
            if (strlen($withoutCountry) !== 10) {
                // Fallback: if digits already is 13 and starts 8801, trust it
                if (strlen($digits) === 13 && str_starts_with($digits, '8801')) {
                    return $digits;
                }
                // If digits is 11 starting 018..., treat as 0+10 case below
                if (strlen($digits) === 11 && str_starts_with($digits, '01')) {
                    return '880' . substr($digits, 1);
                }
                return null;
            }
            $normalized = '880' . $withoutCountry;
            // Validate pattern 8801xxx
            if (preg_match('/^8801\d{9}$/', $normalized)) {
                return $normalized;
            }
            return null;
        }

        // Domestic: 01805020100 (11 digits, starts 01)
        if (strlen($digits) === 11 && str_starts_with($digits, '01')) {
            return '880' . substr($digits, 1);
        }

        // Without leading 0: 1805020100 (10 digits, starts 1)
        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            return '880' . $digits;
        }

        // With plus but stripped: same as 880 case handled above, but if they sent +8801...
        // digits already stripped '+', so 880 case caught.

        return null;
    }

    /**
     * @param string $phone any format
     * @return string normalized without +
     */
    public static function toNormalized(string $phone): string
    {
        $n = self::normalizePhone($phone);
        return $n ?? $phone;
    }

    public static function isOfficialNumber(string $phone): bool
    {
        $n = self::normalizePhone($phone);
        if ($n === null) {
            return false;
        }
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT id FROM alo_whatsapp_numbers WHERE normalized_phone = :n LIMIT 1');
            $stmt->execute([':n' => $n]);
            return (bool) $stmt->fetchColumn();
        } catch (\Throwable $e) {
            error_log('AloWhatsAppNumberService::isOfficialNumber error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get main/complaint/followup sender record (01805020100).
     */
    public static function getMainNumber(): ?array
    {
        return self::getByPhone(self::MAIN_NUMBER);
    }

    public static function getCooNumber(): ?array
    {
        return self::getByPhone(self::COO_NUMBER);
    }

    public static function getComplaintNumber(): ?array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT * FROM alo_whatsapp_numbers WHERE is_complaint_number = 1 AND is_active = 1 LIMIT 1');
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: self::getMainNumber();
        } catch (\Throwable $e) {
            return self::getMainNumber();
        }
    }

    public static function getFollowupSender(): ?array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT * FROM alo_whatsapp_numbers WHERE is_followup_sender = 1 AND is_active = 1 LIMIT 1');
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: self::getMainNumber();
        } catch (\Throwable $e) {
            return self::getMainNumber();
        }
    }

    public static function getByPhone(string $phone): ?array
    {
        $n = self::normalizePhone($phone);
        if ($n === null) {
            return null;
        }
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT * FROM alo_whatsapp_numbers WHERE normalized_phone = :n LIMIT 1');
            $stmt->execute([':n' => $n]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (\Throwable $e) {
            error_log('getByPhone error: ' . $e->getMessage());
            return null;
        }
    }

    public static function getById(int $id): ?array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT * FROM alo_whatsapp_numbers WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public static function getEmployeeNumbers(): array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare("SELECT * FROM alo_whatsapp_numbers WHERE owner_type = 'employee' AND is_active = 1 ORDER BY phone_number ASC");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public static function getAllNumbers(): array
    {
        try {
            $pdo = db();
            $stmt = $pdo->query("SELECT * FROM alo_whatsapp_numbers ORDER BY phone_number ASC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Assign an employee number to a user (creates assignment + audit).
     *
     * @param int $numberId alo_whatsapp_numbers.id
     * @param int $userId
     * @param string $assignmentType
     * @return bool
     */
    public static function assignToUser(int $numberId, int $userId, string $assignmentType = 'owner'): bool
    {
        try {
            $pdo = db();
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('SELECT * FROM alo_whatsapp_numbers WHERE id = :id LIMIT 1 FOR UPDATE');
            $stmt->execute([':id' => $numberId]);
            $num = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$num) {
                $pdo->rollBack();
                return false;
            }
            // Update owner
            $upd = $pdo->prepare('UPDATE alo_whatsapp_numbers SET owner_user_id = :uid, owner_type = :type, updated_at = NOW() WHERE id = :id');
            $type = $assignmentType === 'support_24_7' ? 'coo' : 'employee';
            if ((int)$num['is_24_7_support_number'] === 1 || (int)$num['is_default_sender'] === 1) {
                // Do not change owner_type for main/coo numbers
                $type = $num['owner_type'];
            }
            $upd->execute([':uid' => $userId, ':type' => $type, ':id' => $numberId]);
            // Upsert assignment
            $as = $pdo->prepare('INSERT INTO whatsapp_number_assignments (whatsapp_number_id, user_id, assignment_type) VALUES (:nid, :uid, :atype) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), assignment_type = VALUES(assignment_type), is_active = 1, updated_at = NOW()');
            // Note: if no unique key on (whatsapp_number_id, user_id), INSERT will just add; we handle by selecting first
            // For safety, delete existing owner assignments for this number then insert
            $del = $pdo->prepare('DELETE FROM whatsapp_number_assignments WHERE whatsapp_number_id = :nid AND assignment_type = :atype');
            // Instead just INSERT without duplicate handling for now (table has no unique constraint on pair, so just INSERT)
            $pdo->prepare('INSERT INTO whatsapp_number_assignments (whatsapp_number_id, user_id, assignment_type, is_active) VALUES (:nid, :uid, :atype, 1)')->execute([':nid' => $numberId, ':uid' => $userId, ':atype' => $assignmentType]);
            // Audit
            $curUser = $_SESSION['user_id'] ?? $userId;
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $pdo->prepare('INSERT INTO whatsapp_number_audit_logs (whatsapp_number_id, user_id, action, old_values, new_values, ip_address, user_agent) VALUES (:nid, :uid, :act, :old, :new, :ip, :ua)')
                ->execute([
                    ':nid' => $numberId,
                    ':uid' => $curUser,
                    ':act' => 'assign',
                    ':old' => json_encode($num),
                    ':new' => json_encode(['owner_user_id' => $userId, 'assignment_type' => $assignmentType]),
                    ':ip' => $ip,
                    ':ua' => $ua,
                ]);
            $pdo->commit();
            return true;
        } catch (\Throwable $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('assignToUser error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Resolve outbound sender number id per routing rule.
     * Priority: branch-specific > role-specific > default (main 01805020100)
     *
     * @param string $sourceType new_lead|complaint|followup|branch|...
     * @param int|null $branchId
     * @param int|null $userId
     * @return array|null alo_whatsapp_numbers row
     */
    public static function resolveSender(string $sourceType, ?int $branchId = null, ?int $userId = null): ?array
    {
        // Followup always uses 01805020100
        if ($sourceType === 'followup') {
            return self::getFollowupSender();
        }
        // Complaint always 01805020100
        if ($sourceType === 'complaint') {
            return self::getComplaintNumber();
        }
        // Support 24/7 uses COO number
        if ($sourceType === 'support_24_7' || $sourceType === 'urgent') {
            return self::getCooNumber();
        }

        try {
            $pdo = db();
            // Look up routing_rules
            $sql = 'SELECT * FROM whatsapp_routing_rules WHERE source_type = :src AND is_active = 1';
            $params = [':src' => $sourceType];
            if ($branchId !== null) {
                $sql .= ' AND (branch_id = :bid OR branch_id IS NULL)';
                $params[':bid'] = $branchId;
            }
            $sql .= ' ORDER BY priority ASC, branch_id DESC LIMIT 1';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rule = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($rule && !empty($rule['sender_number_id'])) {
                $num = self::getById((int)$rule['sender_number_id']);
                if ($num && (int)$num['is_active'] === 1) {
                    return $num;
                }
            }
            // If employee has assigned official number, use it for personal sends
            if ($userId !== null) {
                $stmt = $pdo->prepare('SELECT n.* FROM alo_whatsapp_numbers n JOIN whatsapp_number_assignments a ON a.whatsapp_number_id = n.id WHERE a.user_id = :uid AND a.is_active = 1 AND n.is_active = 1 AND n.owner_type = "employee" LIMIT 1');
                $stmt->execute([':uid' => $userId]);
                $emp = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($emp) {
                    // Only use employee number if source allows; otherwise fall through to main
                    // For direct employee outreach, allow it
                    if (in_array($sourceType, ['employee','branch','default','new_lead'], true)) {
                        return $emp;
                    }
                }
            }
        } catch (\Throwable $e) {
            error_log('resolveSender error: ' . $e->getMessage());
        }
        // Default sender
        return self::getMainNumber();
    }

    /**
     * Validate a number string is one of the 20 official pool numbers.
     */
    public static function isInOfficialPool(string $phone): bool
    {
        $n = self::normalizePhone($phone);
        if ($n === null) return false;
        // Check 01805020100-019 range
        $map = [
            '8801805020100','8801805020101','8801805020102','8801805020103','8801805020104',
            '8801805020105','8801805020106','8801805020107','8801805020108','8801805020109',
            '8801805020110','8801805020111','8801805020112','8801805020113','8801805020114',
            '8801805020115','8801805020116','8801805020117','8801805020118','8801805020119',
        ];
        return in_array($n, $map, true);
    }

    /**
     * Seed guard — ensures 20 numbers exist (idempotent).
     * Called from installer or admin tool.
     */
    public static function ensurePoolSeeded(): int
    {
        $count = 0;
        try {
            $pdo = db();
            $stmt = $pdo->query('SELECT COUNT(*) FROM alo_whatsapp_numbers');
            $count = (int)$stmt->fetchColumn();
            if ($count < 20) {
                // Attempt to run seed file
                $seedFile = dirname(__DIR__, 2) . '/database/seed_alo_whatsapp_numbers.sql';
                if (is_file($seedFile)) {
                    $sql = file_get_contents($seedFile);
                    if ($sql !== false) {
                        $pdo->exec($sql);
                        $stmt = $pdo->query('SELECT COUNT(*) FROM alo_whatsapp_numbers');
                        $count = (int)$stmt->fetchColumn();
                    }
                }
            }
        } catch (\Throwable $e) {
            error_log('ensurePoolSeeded error: ' . $e->getMessage());
        }
        return $count;
    }
}
