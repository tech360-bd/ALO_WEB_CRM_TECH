<?php
declare(strict_types=1);

/**
 * API: /api/whatsapp-numbers.php
 * Methods: GET (list), POST (assign), PATCH/PUT (update), DELETE (deactivate)
 * RBAC: super_admin, admin, manager can view; only super_admin/admin can assign
 */

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/AloWhatsAppNumberService.php';

header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
if (!has_permission('settings.view') && !has_permission('communications.view')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = db();

if ($method === 'GET') {
    $numbers = AloWhatsAppNumberService::getAllNumbers();
    // Enrich with owner name, assignments
    foreach ($numbers as &$n) {
        if (!empty($n['owner_user_id'])) {
            try {
                $stmt = $pdo->prepare('SELECT name, email FROM users WHERE id = :id LIMIT 1');
                $stmt->execute([':id' => $n['owner_user_id']]);
                $u = $stmt->fetch(PDO::FETCH_ASSOC);
                $n['owner_name'] = $u['name'] ?? null;
                $n['owner_email'] = $u['email'] ?? null;
            } catch (\Throwable $e) {}
        }
    }
    unset($n);
    echo json_encode(['success' => true, 'data' => $numbers, 'count' => count($numbers)]);
    exit;
}

if ($method === 'POST') {
    if (!has_permission('settings.edit') && !has_permission('users.edit')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden — admin only']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $numberId = (int)($input['whatsapp_number_id'] ?? $input['id'] ?? 0);
    $userId = (int)($input['user_id'] ?? $input['owner_user_id'] ?? 0);
    $type = $input['assignment_type'] ?? 'owner';
    if ($numberId < 1 || $userId < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'whatsapp_number_id and user_id required']);
        exit;
    }
    // Validate number not main/coo reassigned inadvertently? Allow but log warning
    $num = AloWhatsAppNumberService::getById($numberId);
    if (!$num) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Number not found']);
        exit;
    }
    if ((int)$num['is_default_sender'] === 1 && $type !== 'manager') {
        // Main number should stay with system; but allow assignment as manager fallback
    }
    $ok = AloWhatsAppNumberService::assignToUser($numberId, $userId, $type);
    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Assigned']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Assign failed']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
