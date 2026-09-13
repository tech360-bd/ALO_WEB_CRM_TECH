<?php
declare(strict_types=1);
/**
 * API: GET /api/whatsapp-conversations.php?status=open&branch_id=1
 * RBAC: branch access scoped
 */
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
if (!is_logged_in()) { http_response_code(401); echo json_encode(['success'=>false]); exit; }

$branchId = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;
$status = $_GET['status'] ?? 'open';
$role = $_SESSION['role'] ?? '';
$userId = (int)($_SESSION['user_id'] ?? 0);
$pdo = db();
$sql = 'SELECT wc.*, s.student_code, s.name as student_full_name FROM whatsapp_conversations wc LEFT JOIN students s ON s.id=wc.student_id WHERE 1=1';
$params = [];
if ($status !== 'all') { $sql .= ' AND wc.status = :st'; $params[':st']=$status; }
// Branch scoping: non-super_admin sees only own branch
if (!in_array($role, ['super_admin','admin'], true)) {
    $userBranch = $_SESSION['branch_id'] ?? null;
    if ($userBranch) { $sql .= ' AND wc.branch_id = :bid'; $params[':bid']=(int)$userBranch; }
    elseif ($branchId) { $sql .= ' AND wc.branch_id = :bid'; $params[':bid']=$branchId; }
} elseif ($branchId) { $sql .= ' AND wc.branch_id = :bid'; $params[':bid']=$branchId; }
$sql .= ' ORDER BY wc.last_message_at DESC LIMIT 100';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['success'=>true,'data'=>$rows,'count'=>count($rows)]);
