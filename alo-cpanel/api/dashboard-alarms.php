<?php
declare(strict_types=1);

/**
 * API: /api/dashboard-alarms.php — List active alarms for dashboard bell
 */

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) { http_response_code(401); echo json_encode(['success'=>false,'error'=>'Unauthorized']); exit; }

try {
    $pdo = db();
    $stmt = $pdo->query('SELECT da.*, wc.student_name, wc.student_phone FROM dashboard_alarms da LEFT JOIN whatsapp_conversations wc ON wc.id = da.conversation_id WHERE da.alarm_status = "active" ORDER BY da.created_at DESC LIMIT 50');
    $alarms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Also fetch SLA breaches
    $stmt2 = $pdo->query('SELECT * FROM dashboard_notifications WHERE is_read = 0 ORDER BY created_at DESC LIMIT 50');
    $notifs = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true, 'alarms'=>$alarms, 'notifications'=>$notifs, 'count'=>count($alarms)]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
