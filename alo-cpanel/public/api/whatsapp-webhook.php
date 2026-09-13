<?php
declare(strict_types=1);

/**
 * WhatsApp Cloud API Webhook — GET verification + POST idempotent processing
 *
 * Route: GET  /api/whatsapp-webhook.php?hub.mode=subscribe&hub.verify_token=...&hub.challenge=... -> hub.challenge
 *        POST /api/whatsapp-webhook.php (JSON from Meta)
 *
 * Security: verifies X-Hub-Signature-256 if WHATSAPP_APP_SECRET is set; always checks verify_token for GET.
 * Idempotency: whatsapp_messages.whatsapp_message_id UNIQUE — duplicate WAMID is ignored (200 OK)
 *
 * Deploy: ensure this file is reachable at https://crm.aloeducation.com/api/whatsapp-webhook.php
 * Configure in Meta Developer Portal -> WhatsApp -> Configuration -> Webhook URL.
 */

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../../app/bootstrap.php';
require_once __DIR__ . '/../../app/Services/AloWhatsAppNumberService.php';
require_once __DIR__ . '/../../app/Services/WhatsAppCloudService.php';
require_once __DIR__ . '/../../app/Services/StudentAutoCreateService.php';
require_once __DIR__ . '/../../app/Services/WhatsAppFollowupService.php';
require_once __DIR__ . '/../../app/Services/WhatsAppSlaService.php';
require_once __DIR__ . '/../../app/Services/SupportEscalationService.php';
require_once __DIR__ . '/../../app/Services/WhatsAppDocumentIngestionService.php';
require_once __DIR__ . '/../../app/Services/MessageRouterService.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$cloud = WhatsAppCloudService::fromEnv();

// ---------- GET verification ----------
if ($method === 'GET') {
    $query = $_GET;
    // Support both hub.mode and hub_mode (some proxies)
    $challenge = $cloud->handleVerification($query);
    if ($challenge !== null) {
        header('Content-Type: text/plain; charset=utf-8');
        http_response_code(200);
        echo $challenge;
        exit;
    }
    // Also handle direct spec: hub_verify_token etc. fallback
    $mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? null;
    $token = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? null;
    $chal = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? null;
    $expected = $_ENV['WHATSAPP_VERIFY_TOKEN'] ?? (defined('WHATSAPP_VERIFY_TOKEN') ? WHATSAPP_VERIFY_TOKEN : '');
    if ($expected === '') $expected = getenv('WHATSAPP_VERIFY_TOKEN') ?: '';
    if ($mode === 'subscribe' && $token !== null && hash_equals((string)$expected, (string)$token) && $chal !== null) {
        header('Content-Type: text/plain; charset=utf-8');
        http_response_code(200);
        echo $chal;
        exit;
    }
    http_response_code(403);
    echo json_encode(['error' => 'Verification failed']);
    exit;
}

// ---------- POST processing ----------
if ($method !== 'POST') {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
if ($raw === false) $raw = '';
// Verify signature if configured
$sig = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? null;
if (!$cloud->verifySignature($raw, $sig)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    // Some Meta test pings send empty; treat as ok
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'note' => 'empty payload']);
    exit;
}

// Log raw for debugging (without PII trimming? Keep minimal)
try {
    error_log('WA webhook raw: ' . substr($raw, 0, 4000));
} catch (\Throwable $e) {}

$processed = 0;
$errors = [];

// Meta structure: { object: "whatsapp_business_account", entry: [ { changes: [ { value: { messaging_product, metadata { phone_number_id }, contacts [...], messages [...] , statuses [...] } } ] } ] }
$entries = $data['entry'] ?? [];
foreach ($entries as $entry) {
    $changes = $entry['changes'] ?? [];
    foreach ($changes as $change) {
        $value = $change['value'] ?? [];
        $metadata = $value['metadata'] ?? [];
        $contacts = $value['contacts'] ?? [];
        $messages = $value['messages'] ?? [];
        $statuses = $value['statuses'] ?? [];

        // Handle statuses (delivery/read) — update whatsapp_messages.whatsapp_status
        foreach ($statuses as $st) {
            try {
                $wamid = $st['id'] ?? $st['message_id'] ?? null;
                $status = $st['status'] ?? null; // sent, delivered, read, failed
                if ($wamid && $status) {
                    $pdo = db();
                    $pdo->prepare('UPDATE whatsapp_messages SET whatsapp_status = :st, updated_at = NOW() WHERE whatsapp_message_id = :wamid')->execute([':st' => $status, ':wamid' => $wamid]);
                    if ($status === 'read') {
                        $pdo->prepare('UPDATE whatsapp_messages SET is_read = 1, read_at = NOW() WHERE whatsapp_message_id = :wamid')->execute([':wamid' => $wamid]);
                    }
                }
            } catch (\Throwable $e) { $errors[] = $e->getMessage(); }
        }

        foreach ($messages as $msg) {
            $type = $msg['type'] ?? 'text';
            $wamid = $msg['id'] ?? null;
            $from = $msg['from'] ?? null; // e.g. 8801805...
            $timestamp = $msg['timestamp'] ?? null;
            // Idempotency: if WAMID already exists, skip
            if ($wamid) {
                try {
                    $pdo = db();
                    $stmt = $pdo->prepare('SELECT id FROM whatsapp_messages WHERE whatsapp_message_id = :wamid LIMIT 1');
                    $stmt->execute([':wamid' => $wamid]);
                    if ($stmt->fetchColumn()) {
                        $processed++;
                        continue;
                    }
                } catch (\Throwable $e) {}
            }
            if (!$from || !$wamid) continue;

            // Resolve profile name from contacts array
            $profileName = '';
            foreach ($contacts as $c) {
                if (($c['wa_id'] ?? '') === $from || ($c['phone'] ?? '') === $from) {
                    $profileName = $c['profile']['name'] ?? '';
                    break;
                }
            }
            if ($profileName === '' && !empty($contacts[0]['profile']['name'])) $profileName = $contacts[0]['profile']['name'];

            try {
                if ($type === 'text') {
                    $body = $msg['text']['body'] ?? '';
                    if ($body === '') continue;
                    MessageRouterService::routeInbound($from, $profileName, $body, $wamid, $metadata);
                    $processed++;
                } elseif (in_array($type, ['image','document','audio','video'], true)) {
                    $mediaId = $msg[$type]['id'] ?? $msg['image']['id'] ?? $msg['document']['id'] ?? null;
                    $mime = $msg[$type]['mime_type'] ?? $msg['image']['mime_type'] ?? $msg['document']['mime_type'] ?? 'application/octet-stream';
                    $filename = $msg['document']['filename'] ?? ($type . '_' . substr($wamid, 0, 8) . '.' . ($type === 'image' ? 'jpg' : 'bin'));
                    $caption = $msg[$type]['caption'] ?? $msg['image']['caption'] ?? $msg['document']['caption'] ?? '';
                    // Ensure student/conversation exists even for media: create via caption or empty
                    $route = MessageRouterService::routeInbound($from, $profileName, $caption !== '' ? $caption : '[media: ' . $type . '] ' . $filename, $wamid, $metadata);
                    // Ingest document
                    if ($mediaId) {
                        // Find student_id from conversation
                        $pdo = db();
                        $stmt = $pdo->prepare('SELECT student_id FROM whatsapp_conversations WHERE id = :cid LIMIT 1');
                        $stmt->execute([':cid' => $route['conversation_id']]);
                        $studentId = (int)($stmt->fetchColumn() ?: $route['student_id']);
                        // Also insert the media message row explicitly if not already
                        // For non-text, the routeInbound inserted a placeholder text message; now ingest doc
                        WhatsAppDocumentIngestionService::ingestFromWebhook($route['conversation_id'], $studentId, $mediaId, $mime, $filename, $wamid);
                    }
                    $processed++;
                } else {
                    // Unknown type — store as text fallback
                    $body = json_encode($msg, JSON_UNESCAPED_UNICODE);
                    MessageRouterService::routeInbound($from, $profileName, $body, $wamid, $metadata);
                    $processed++;
                }
            } catch (\Throwable $e) {
                $errors[] = $e->getMessage();
                error_log('webhook routeInbound error: ' . $e->getMessage());
            }
        }
    }
}

http_response_code(200);
echo json_encode(['status' => 'ok', 'processed' => $processed, 'errors' => $errors]);
