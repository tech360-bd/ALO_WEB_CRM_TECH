<?php
/**
 * API — Tasks create (POST)
 *
 * POST JSON or form-encoded:
 *   {
 *     "title":        "...",
 *     "assigned_to":  123,
 *     "student_id":   456,
 *     "priority":     "HIGH",
 *     "due_date":     "2026-01-15 17:00"
 *   }
 *
 * Returns { success, id, error? }
 */
declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    json_response(['error' => 'Authentication required'], 401);
}
if (!has_permission('tasks.create')) {
    json_response(['error' => 'Forbidden'], 403);
}

$raw = file_get_contents('php://input');
$jsonBody = null;
if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $jsonBody = $decoded;
    }
}
$src = is_array($jsonBody) ? $jsonBody : $_POST;

$title      = trim((string) ($src['title'] ?? ''));
$description = trim((string) ($src['description'] ?? ''));
$assignedTo = trim((string) ($src['assigned_to'] ?? ''));
$studentId  = (int) ($src['student_id'] ?? 0);
$leadId     = (int) ($src['lead_id'] ?? 0);
$priority   = strtoupper(trim((string) ($src['priority'] ?? 'MEDIUM')));
$dueDate    = trim((string) ($src['due_date'] ?? ''));

if ($title === '') {
    json_response(['success' => false, 'error' => 'title required'], 422);
}
if (!in_array($priority, ['LOW','MEDIUM','HIGH','URGENT'], true)) {
    json_response(['success' => false, 'error' => 'invalid priority'], 422);
}
if ($assignedTo !== '' && !ctype_digit($assignedTo)) {
    json_response(['success' => false, 'error' => 'invalid assigned_to'], 422);
}
if ($dueDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/', $dueDate)) {
    json_response(['success' => false, 'error' => 'invalid due_date'], 422);
}

$pdo = db();
$nullable = static fn($v) => $v !== '' ? $v : null;
$intNull  = static fn($v) => ($v !== '' && ctype_digit($v)) ? (int) $v : null;
$assignedToVal = $intNull($assignedTo);
$studentVal = $studentId > 0 ? $studentId : null;
$leadVal = $leadId > 0 ? $leadId : null;
$userId = (int) ($_SESSION['user_id'] ?? 0);

$dueVal = null;
if ($dueDate !== '') {
    if (strlen($dueDate) === 10) {
        $dueVal = $dueDate . ' 23:59:00';
    } else {
        $dueVal = date('Y-m-d H:i:s', strtotime($dueDate));
    }
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO tasks
            (title, description, assigned_to, student_id, lead_id,
             priority, status, due_date, created_by, created_at, updated_at)
         VALUES
            (:title, :description, :assigned_to, :student_id, :lead_id,
             :priority, "PENDING", :due_date, :created_by, NOW(), NOW())'
    );
    $stmt->bindParam(':title',        $title);
    $stmt->bindParam(':description',  $nullable($description));
    $stmt->bindParam(':assigned_to',  $assignedToVal, $assignedToVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':student_id',   $studentVal,    $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':lead_id',      $leadVal,       $leadVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':priority',     $priority);
    $stmt->bindParam(':due_date',     $dueVal);
    $stmt->bindParam(':created_by',   $userId, PDO::PARAM_INT);
    $stmt->execute();
    $newId = (int) $pdo->lastInsertId();

    log_audit('create', 'tasks', $newId, null, [
        'title' => $title, 'assigned_to' => $assignedToVal,
        'student_id' => $studentVal, 'lead_id' => $leadVal,
        'priority' => $priority, 'due_date' => $dueVal,
    ]);

    /* Notify the assigned user */
    if ($assignedToVal > 0 && $assignedToVal !== $userId) {
        send_notification(
            $assignedToVal,
            'New task assigned',
            'You have been assigned: ' . $title,
            'info',
            'tasks/index.php'
        );
    }

    json_response([
        'success'  => true,
        'id'       => $newId,
        'title'    => $title,
        'priority' => $priority,
        'due_date' => $dueVal,
    ], 201);
} catch (Throwable $ex) {
    json_response(['success' => false, 'error' => $ex->getMessage()], 500);
}
