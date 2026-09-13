<?php
declare(strict_types=1);
/**
 * API: conversation notes — immutable, versioned
 * POST   /api/conversation-notes.php { conversation_id, note }
 * PUT    /api/conversation-notes.php { id, note, change_reason } — creates version, keeps original locked
 * DELETE /api/conversation-notes.php?id= — requests delete via crm_delete_requests (not immediate)
 * GET    /api/conversation-notes.php?conversation_id=1
 */
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
if (!is_logged_in()) { http_response_code(401); echo json_encode(['success'=>false]); exit; }
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = db();
$userId = (int)($_SESSION['user_id'] ?? 0);

if ($method === 'GET') {
    $cid = (int)($_GET['conversation_id'] ?? 0);
    if ($cid < 1) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'conversation_id required']); exit; }
    $stmt = $pdo->prepare('SELECT cn.*, u.name as author_name FROM conversation_notes cn JOIN users u ON u.id=cn.user_id WHERE cn.conversation_id=:cid ORDER BY cn.created_at DESC');
    $stmt->execute([':cid'=>$cid]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Fetch versions
    foreach ($notes as &$n) {
        $vstmt = $pdo->prepare('SELECT * FROM conversation_note_versions WHERE note_id=:nid ORDER BY created_at DESC');
        $vstmt->execute([':nid'=>$n['id']]);
        $n['versions'] = $vstmt->fetchAll(PDO::FETCH_ASSOC);
    }
    echo json_encode(['success'=>true,'data'=>$notes]);
    exit;
}
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $cid = (int)($input['conversation_id'] ?? 0);
    $note = trim((string)($input['note'] ?? ''));
    if ($cid < 1 || $note === '') { http_response_code(400); echo json_encode(['success'=>false,'error'=>'conversation_id and note required']); exit; }
    $stmt = $pdo->prepare('INSERT INTO conversation_notes (conversation_id, user_id, note, is_locked) VALUES (:cid, :uid, :note, 1)');
    $stmt->execute([':cid'=>$cid, ':uid'=>$userId, ':note'=>$note]);
    $id = (int)$pdo->lastInsertId();
    echo json_encode(['success'=>true,'id'=>$id]);
    exit;
}
if ($method === 'PUT' || $method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;
    $id = (int)($input['id'] ?? 0);
    $newNote = trim((string)($input['note'] ?? ''));
    $reason = trim((string)($input['change_reason'] ?? ''));
    if ($id < 1 || $newNote === '') { http_response_code(400); echo json_encode(['success'=>false]); exit; }
    $stmt = $pdo->prepare('SELECT * FROM conversation_notes WHERE id=:id LIMIT 1');
    $stmt->execute([':id'=>$id]);
    $old = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$old) { http_response_code(404); echo json_encode(['success'=>false,'error'=>'Note not found']); exit; }
    // RBAC: only author or manager/admin can edit
    $role = $_SESSION['role'] ?? '';
    if ((int)$old['user_id'] !== $userId && !in_array($role, ['super_admin','admin','manager'], true)) { http_response_code(403); echo json_encode(['success'=>false,'error'=>'Forbidden']); exit; }
    // Version, then update
    $pdo->prepare('INSERT INTO conversation_note_versions (note_id, old_note, new_note, changed_by, change_reason) VALUES (:nid, :old, :new, :by, :reason)')->execute([':nid'=>$id, ':old'=>$old['note'], ':new'=>$newNote, ':by'=>$userId, ':reason'=>$reason]);
    $pdo->prepare('UPDATE conversation_notes SET note=:note, updated_at=NOW() WHERE id=:id')->execute([':note'=>$newNote, ':id'=>$id]);
    echo json_encode(['success'=>true]);
    exit;
}
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);
    if ($id < 1) { http_response_code(400); echo json_encode(['success'=>false]); exit; }
    $reason = trim((string)($_GET['reason'] ?? $_POST['reason'] ?? 'User requested delete'));
    // Do not delete — create delete request for approval
    $pdo->prepare('INSERT INTO crm_delete_requests (entity_type, entity_id, requested_by, reason) VALUES ("conversation_note", :eid, :by, :reason)')->execute([':eid'=>$id, ':by'=>$userId, ':reason'=>$reason]);
    $pdo->prepare('UPDATE conversation_notes SET delete_requested_by=:by, delete_request_status="pending", updated_at=NOW() WHERE id=:id')->execute([':by'=>$userId, ':id'=>$id]);
    echo json_encode(['success'=>true,'message'=>'Delete request submitted for approval (immutable storage)']);
    exit;
}
http_response_code(405);
echo json_encode(['success'=>false]);
