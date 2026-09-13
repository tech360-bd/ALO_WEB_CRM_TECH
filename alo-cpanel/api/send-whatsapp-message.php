<?php
declare(strict_types=1);

/**
 * API: POST /api/send-whatsapp-message.php
 * Body: { conversation_id, message, sender_role? }
 * Sends via MessageRouterService (handles sender number resolution + SLA resolve)
 */

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/AloWhatsAppNumberService.php';
require_once __DIR__ . '/../app/Services/WhatsAppCloudService.php';
require_once __DIR__ . '/../app/Services/WhatsAppSlaService.php';
require_once __DIR__ . '/../app/Services/MessageRouterService.php';

header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Unauthorized']); exit; }
if (!has_permission('communications.create')) { http_response_code(403); echo json_encode(['success'=>false,'error'=>'Forbidden']); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') { http_response_code(405); echo json_encode(['success'=>false,'error'=>'POST only']); exit; }

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$conversationId = (int)($input['conversation_id'] ?? 0);
$message = trim((string)($input['message'] ?? $input['body'] ?? ''));
$senderRole = $input['sender_role'] ?? ($_SESSION['role'] ?? 'counselor');

if ($conversationId < 1 || $message === '') { http_response_code(400); echo json_encode(['success'=>false,'error'=>'conversation_id and message required']); exit; }
if (mb_strlen($message) > 4000) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'Message too long']); exit; }

$userId = (int)($_SESSION['user_id'] ?? 0);
$result = MessageRouterService::routeOutbound($conversationId, $userId, $message, $senderRole);
echo json_encode(['success'=>$result['success'], 'data'=>$result]);
