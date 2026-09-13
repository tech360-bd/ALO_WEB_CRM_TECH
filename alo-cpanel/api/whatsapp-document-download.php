<?php
declare(strict_types=1);
/**
 * GET /api/whatsapp-document-download.php?id=123 — streams private file
 * Security: private storage only, RBAC, logs download in audit_logs
 */
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/WhatsAppDocumentIngestionService.php';
if (!is_logged_in()) { http_response_code(401); echo 'Unauthorized'; exit; }
$id = (int)($_GET['id'] ?? 0);
if ($id < 1) { http_response_code(400); echo 'Missing id'; exit; }
$userId = (int)($_SESSION['user_id'] ?? 0);
// Log attempt
try { db()->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES (:uid, "document_download", "student_documents", :eid, :ip, :ua)')->execute([':uid'=>$userId, ':eid'=>$id, ':ip'=>$_SERVER['REMOTE_ADDR']??'', ':ua'=>$_SERVER['HTTP_USER_AGENT']??'']); } catch (\Throwable $e) {}
WhatsAppDocumentIngestionService::serve($id, $userId);
