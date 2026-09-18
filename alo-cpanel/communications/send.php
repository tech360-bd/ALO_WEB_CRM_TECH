<?php
/**
 * Communications — Send endpoint (POST)
 *
 * Inserts a communications row, attempts to deliver via WhatsApp/Email if
 * configured, logs audit, and redirects back.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('communications.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('communications/index.php');
}

$channel   = trim((string) ($_POST['channel'] ?? ''));
$studentId = (int) ($_POST['student_id'] ?? 0);
$leadId    = (int) ($_POST['lead_id'] ?? 0);
$subject   = trim((string) ($_POST['subject'] ?? ''));
$message   = trim((string) ($_POST['message'] ?? ''));
$direction = strtoupper(trim((string) ($_POST['direction'] ?? 'OUTBOUND')));

$allowedChannels = ['WHATSAPP','EMAIL','SMS','MESSENGER','PHONE','INTERNAL_NOTE'];
$errors = [];

if (!in_array($channel, $allowedChannels, true)) $errors[] = 'Invalid channel.';
if ($studentId <= 0 && $leadId <= 0) $errors[] = 'A student or lead is required.';
if (!validate_required($message)) $errors[] = 'Message is required.';
if (!in_array($direction, ['INBOUND','OUTBOUND'], true)) $direction = 'OUTBOUND';

/* Handle optional attachment */
$attachmentPath = null;
if (isset($_FILES['attachment']) && is_array($_FILES['attachment']) && $_FILES['attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
    $check = validate_upload($_FILES['attachment']);
    if (!$check['success']) {
        $errors[] = 'Attachment: ' . $check['error'];
    } else {
        $info = $check['info'];
        $uploadDir = APP_ROOT . '/uploads/communications/';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            $errors[] = 'Failed to create communications upload dir.';
        } else {
            $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', pathinfo($info['name'], PATHINFO_FILENAME));
            $safeName = substr($safeName ?? 'file', 0, 40);
            $unique = $safeName . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $info['ext'];
            $dest = $uploadDir . $unique;
            if (move_uploaded_file($info['tmp_name'], $dest)) {
                $attachmentPath = 'uploads/communications/' . $unique;
            } else {
                $errors[] = 'Failed to save attachment.';
            }
        }
    }
}

if (!$errors) {
    $crmId = generate_crm_id('ALO-CRM');
    $studentVal = $studentId > 0 ? $studentId : null;
    $leadVal = $leadId > 0 ? $leadId : null;
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $nullable = static fn($v) => $v !== '' ? $v : null;
    $subjectVal = $nullable($subject);

    /* Determine initial status: PENDING if we can attempt delivery, else SENT for INTERNAL_NOTE */
    $status = $channel === 'INTERNAL_NOTE' ? 'SENT' : 'PENDING';
    $sentAt = $channel === 'INTERNAL_NOTE' ? date('Y-m-d H:i:s') : null;
    $externalId = null;

    /* Attempt delivery for outbound messages */
    if ($direction === 'OUTBOUND' && $channel !== 'INTERNAL_NOTE') {
        $delivered = false;
        $recipient = null;

        /* Find recipient (student preferred) */
        if ($studentVal > 0) {
            $stmt = $pdo->prepare('SELECT email, phone FROM students WHERE id = :id');
            $stmt->execute([':id' => $studentVal]);
            $row = $stmt->fetch();
            if ($row) {
                $recipient = ['email' => $row['email'] ?? '', 'phone' => $row['phone'] ?? ''];
            }
        } elseif ($leadVal > 0) {
            $stmt = $pdo->prepare('SELECT email, phone FROM leads WHERE id = :id');
            $stmt->execute([':id' => $leadVal]);
            $row = $stmt->fetch();
            if ($row) {
                $recipient = ['email' => $row['email'] ?? '', 'phone' => $row['phone'] ?? ''];
            }
        }

        if ($recipient) {
            if ($channel === 'WHATSAPP' && defined('WA_API_URL') && WA_API_URL !== '' && !empty($recipient['phone'])) {
                $delivered = alo_attempt_whatsapp($recipient['phone'], $message);
            } elseif ($channel === 'EMAIL' && defined('MAIL_HOST') && MAIL_HOST !== 'smtp.example.com' && !empty($recipient['email'])) {
                $delivered = alo_attempt_email($recipient['email'], $subject ?: '(No Subject)', $message);
            } elseif ($channel === 'SMS' && defined('SMS_API_URL') && SMS_API_URL !== '' && !empty($recipient['phone'])) {
                $delivered = alo_attempt_sms($recipient['phone'], $message);
            }
        }

        if ($delivered) {
            $status = 'SENT';
            $sentAt = date('Y-m-d H:i:s');
            $externalId = bin2hex(random_bytes(8));
        } else {
            $status = 'FAILED';
        }
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'INSERT INTO communications
                (crm_id, student_id, lead_id, user_id, channel, direction,
                 subject, message, attachment, status, external_id, sent_at,
                 created_at, updated_at)
             VALUES
                (:crm_id, :student_id, :lead_id, :user_id, :channel, :direction,
                 :subject, :message, :attachment, :status, :external_id, :sent_at,
                 NOW(), NOW())'
        );
        $stmt->bindParam(':crm_id',       $crmId);
        $stmt->bindParam(':student_id',   $studentVal, $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindParam(':lead_id',       $leadVal,    $leadVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindParam(':user_id',       $userId, PDO::PARAM_INT);
        $stmt->bindParam(':channel',       $channel);
        $stmt->bindParam(':direction',     $direction);
        $stmt->bindParam(':subject',       $subjectVal);
        $stmt->bindParam(':message',       $message);
        $stmt->bindParam(':attachment',    $attachmentPath);
        $stmt->bindParam(':status',        $status);
        $stmt->bindParam(':external_id',   $externalId);
        $stmt->bindParam(':sent_at',       $sentAt);
        $stmt->execute();
        $commId = (int) $pdo->lastInsertId();

        /* Activity log */
        $act = $pdo->prepare(
            'INSERT INTO activities
                (user_id, student_id, lead_id, crm_id, type, description, created_at)
             VALUES (:uid, :sid, :lid, :crm, :type, :desc, NOW())'
        );
        $type = 'communication_sent';
        $desc = 'Communication sent via ' . $channel . ' (' . $status . '): '
              . ($subject !== '' ? $subject : mb_substr($message, 0, 60));
        $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
        $act->bindParam(':sid',  $studentVal, $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $act->bindParam(':lid',  $leadVal,    $leadVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $act->bindParam(':crm',  $crmId);
        $act->bindParam(':type', $type);
        $act->bindParam(':desc', $desc);
        $act->execute();

        $pdo->commit();

        log_audit('create', 'communications', $commId, null, [
            'crm_id' => $crmId, 'channel' => $channel, 'status' => $status,
            'student_id' => $studentVal, 'lead_id' => $leadVal,
        ]);

        if ($status === 'FAILED') {
            flash('warning', 'Communication recorded but delivery failed — please check provider config.');
        } elseif ($status === 'SENT') {
            flash('success', 'Communication sent successfully.');
        } else {
            flash('success', 'Communication recorded.');
        }
    } catch (Throwable $ex) {
        try { $pdo->rollBack(); } catch (Throwable $e) {}
        $errors[] = 'Failed to log communication: ' . $ex->getMessage();
    }
}

if ($errors) {
    flash('error', implode(' ', $errors));
}

$back = $_SERVER['HTTP_REFERER'] ?? url('communications/index.php');
redirect($back);

/* ----------------------------------------------------------------
 *  Local delivery helper functions (best-effort, no exceptions)
 * ---------------------------------------------------------------- */
function alo_attempt_whatsapp(string $phone, string $message): bool
{
    $url = defined('WA_API_URL') ? WA_API_URL : '';
    $token = defined('WA_API_TOKEN') ? WA_API_TOKEN : '';
    if (!$url || !$token) return false;
    $payload = json_encode([
        'phone' => $phone,
        'message' => $message,
    ]);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_TIMEOUT => 15,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $resp !== false && $code >= 200 && $code < 300;
}

function alo_attempt_email(string $to, string $subject, string $body): bool
{
    $headers = [
        'From: ' . (defined('MAIL_FROM') ? MAIL_FROM : 'noreply@example.com'),
        'Content-Type: text/plain; charset=UTF-8',
        'MIME-Version: 1.0',
    ];
    $sent = @mail($to, $subject, $body, implode("\r\n", $headers));
    return $sent === true;
}

function alo_attempt_sms(string $phone, string $message): bool
{
    $url = defined('SMS_API_URL') ? SMS_API_URL : '';
    $token = defined('SMS_API_TOKEN') ? SMS_API_TOKEN : '';
    if (!$url || !$token) return false;
    $ch = curl_init($url . '?' . http_build_query([
        'phone' => $phone,
        'message' => $message,
        'token' => $token,
    ]));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $resp !== false && $code >= 200 && $code < 300;
}
