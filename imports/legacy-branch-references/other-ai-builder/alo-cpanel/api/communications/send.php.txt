<?php
/**
 * API — Communications send (POST)
 *
 * POST JSON or form-encoded:
 *   {
 *     "channel":   "WHATSAPP"|"EMAIL"|"SMS"|"INTERNAL_NOTE",
 *     "student_id": 123,
 *     "message":   "...",
 *     "subject":   "..."    (optional)
 *   }
 *
 * Inserts a communications row, attempts delivery if configured, returns
 *   { success: bool, id: int, status: string, error?: string }
 */
declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    json_response(['error' => 'Authentication required'], 401);
}
if (!has_permission('communications.create')) {
    json_response(['error' => 'Forbidden'], 403);
}

/* Accept JSON or form-encoded body */
$raw = file_get_contents('php://input');
$jsonBody = null;
if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $jsonBody = $decoded;
    }
}
$src = is_array($jsonBody) ? $jsonBody : $_POST;

$channel   = strtoupper(trim((string) ($src['channel'] ?? '')));
$studentId = (int) ($src['student_id'] ?? 0);
$leadId    = (int) ($src['lead_id'] ?? 0);
$subject   = trim((string) ($src['subject'] ?? ''));
$message   = trim((string) ($src['message'] ?? ''));

$allowedChannels = ['WHATSAPP','EMAIL','SMS','MESSENGER','PHONE','INTERNAL_NOTE'];
if (!in_array($channel, $allowedChannels, true)) {
    json_response(['success' => false, 'error' => 'Invalid channel'], 422);
}
if ($studentId <= 0 && $leadId <= 0) {
    json_response(['success' => false, 'error' => 'student_id or lead_id required'], 422);
}
if ($message === '') {
    json_response(['success' => false, 'error' => 'message required'], 422);
}

$pdo = db();
$crmId = generate_crm_id('ALO-CRM');
$studentVal = $studentId > 0 ? $studentId : null;
$leadVal = $leadId > 0 ? $leadId : null;
$userId = (int) ($_SESSION['user_id'] ?? 0);

/* Determine initial status */
$status = $channel === 'INTERNAL_NOTE' ? 'SENT' : 'PENDING';
$sentAt = $channel === 'INTERNAL_NOTE' ? date('Y-m-d H:i:s') : null;
$externalId = null;

/* Attempt delivery for outbound */
if ($channel !== 'INTERNAL_NOTE') {
    $recipient = null;
    if ($studentVal > 0) {
        $stmt = $pdo->prepare('SELECT email, phone FROM students WHERE id = :id');
        $stmt->execute([':id' => $studentVal]);
        $recipient = $stmt->fetch() ?: null;
    } elseif ($leadVal > 0) {
        $stmt = $pdo->prepare('SELECT email, phone FROM leads WHERE id = :id');
        $stmt->execute([':id' => $leadVal]);
        $recipient = $stmt->fetch() ?: null;
    }
    if (is_array($recipient)) {
        if ($channel === 'WHATSAPP' && defined('WA_API_URL') && WA_API_URL !== '' && !empty($recipient['phone'])) {
            $delivered = alo_api_wa($recipient['phone'], $message);
        } elseif ($channel === 'EMAIL' && defined('MAIL_HOST') && MAIL_HOST !== 'smtp.example.com' && !empty($recipient['email'])) {
            $delivered = @mail($recipient['email'], $subject ?: '(No Subject)', $message,
                'From: ' . (defined('MAIL_FROM') ? MAIL_FROM : 'noreply@example.com') . "\r\n"
              . 'Content-Type: text/plain; charset=UTF-8');
        } elseif ($channel === 'SMS' && defined('SMS_API_URL') && SMS_API_URL !== '' && !empty($recipient['phone'])) {
            $delivered = alo_api_sms($recipient['phone'], $message);
        } else {
            $delivered = false;
        }
        if (!empty($delivered)) {
            $status = 'SENT';
            $sentAt = date('Y-m-d H:i:s');
            $externalId = bin2hex(random_bytes(8));
        } else {
            $status = 'FAILED';
        }
    } else {
        $status = 'FAILED';
    }
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO communications
            (crm_id, student_id, lead_id, user_id, channel, direction,
             subject, message, attachment, status, external_id, sent_at,
             created_at, updated_at)
         VALUES
            (:crm_id, :student_id, :lead_id, :user_id, :channel, "OUTBOUND",
             :subject, :message, NULL, :status, :external_id, :sent_at,
             NOW(), NOW())'
    );
    $stmt->bindParam(':crm_id',       $crmId);
    $stmt->bindParam(':student_id',    $studentVal, $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':lead_id',       $leadVal,    $leadVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':user_id',       $userId, PDO::PARAM_INT);
    $stmt->bindParam(':channel',        $channel);
    $stmt->bindParam(':subject',        $subject !== '' ? $subject : null);
    $stmt->bindParam(':message',        $message);
    $stmt->bindParam(':status',         $status);
    $stmt->bindParam(':external_id',    $externalId);
    $stmt->bindParam(':sent_at',        $sentAt);
    $stmt->execute();
    $commId = (int) $pdo->lastInsertId();

    log_audit('create', 'communications', $commId, null, [
        'crm_id' => $crmId, 'channel' => $channel, 'status' => $status,
        'student_id' => $studentVal, 'lead_id' => $leadVal,
    ]);

    json_response([
        'success'   => $status === 'SENT' || $channel === 'INTERNAL_NOTE',
        'id'        => $commId,
        'crm_id'    => $crmId,
        'status'    => $status,
        'error'     => $status === 'FAILED' ? 'Delivery failed — provider not configured or rejected.' : null,
    ], 200);
} catch (Throwable $ex) {
    json_response(['success' => false, 'error' => $ex->getMessage()], 500);
}

/* Helpers */
function alo_api_wa(string $phone, string $message): bool
{
    $url = defined('WA_API_URL') ? WA_API_URL : '';
    $token = defined('WA_API_TOKEN') ? WA_API_TOKEN : '';
    if (!$url || !$token) return false;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => json_encode(['phone' => $phone, 'message' => $message]),
        CURLOPT_TIMEOUT => 15,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $resp !== false && $code >= 200 && $code < 300;
}

function alo_api_sms(string $phone, string $message): bool
{
    $url = defined('SMS_API_URL') ? SMS_API_URL : '';
    $token = defined('SMS_API_TOKEN') ? SMS_API_TOKEN : '';
    if (!$url || !$token) return false;
    $ch = curl_init($url . '?' . http_build_query(['phone' => $phone, 'message' => $message, 'token' => $token]));
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $resp !== false && $code >= 200 && $code < 300;
}
