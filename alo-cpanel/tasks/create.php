<?php
/**
 * Tasks — Create endpoint (POST)
 *
 * Validates input, inserts a task row, logs audit + activity, redirects back.
 * Supports ?student_id=, ?lead_id= for context-aware creation.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('tasks.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('tasks/index.php');
}

$title       = trim((string) ($_POST['title'] ?? ''));
$description = trim((string) ($_POST['description'] ?? ''));
$assignedTo  = trim((string) ($_POST['assigned_to'] ?? ''));
$studentId   = (int) ($_POST['student_id'] ?? 0);
$leadId      = (int) ($_POST['lead_id'] ?? 0);
$priority    = trim((string) ($_POST['priority'] ?? 'MEDIUM'));
$status      = trim((string) ($_POST['status'] ?? 'PENDING'));
$dueDate     = trim((string) ($_POST['due_date'] ?? ''));

$errors = [];
if (!validate_required($title)) $errors[] = 'Title is required.';
elseif (!validate_max($title, 190)) $errors[] = 'Title must be 190 characters or fewer.';
if (!in_array($priority, ['LOW','MEDIUM','HIGH','URGENT'], true)) $errors[] = 'Invalid priority.';
if (!in_array($status, ['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'], true)) $errors[] = 'Invalid status.';
if ($assignedTo !== '' && !ctype_digit($assignedTo)) $errors[] = 'Invalid assignee.';
if ($studentId < 0) $errors[] = 'Invalid student.';
if ($leadId < 0)    $errors[] = 'Invalid lead.';
if ($dueDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?$/', $dueDate)) {
    $errors[] = 'Due date format is invalid.';
}

if ($errors) {
    flash('error', implode(' ', $errors));
    $back = $_SERVER['HTTP_REFERER'] ?? url('tasks/index.php');
    redirect($back);
}

$nullable = static fn($v) => $v !== '' ? $v : null;
$intNull  = static fn($v) => ($v !== '' && ctype_digit($v)) ? (int) $v : null;
$assignedToVal = $intNull($assignedTo);
$studentVal = $studentId > 0 ? $studentId : null;
$leadVal    = $leadId > 0 ? $leadId : null;

/* Normalise due_date to datetime Y-m-d H:i:s */
$dueVal = null;
if ($dueDate !== '') {
    if (strlen($dueDate) === 10) {
        $dueVal = $dueDate . ' 23:59:00';
    } else {
        $dueVal = date('Y-m-d H:i:s', strtotime($dueDate));
    }
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO tasks
            (title, description, assigned_to, student_id, lead_id,
             priority, status, due_date, created_by, created_at, updated_at)
         VALUES
            (:title, :description, :assigned_to, :student_id, :lead_id,
             :priority, :status, :due_date, :created_by, NOW(), NOW())'
    );
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $stmt->bindParam(':title',        $title);
    $stmt->bindParam(':description',  $nullable($description));
    $stmt->bindParam(':assigned_to',  $assignedToVal, $assignedToVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':student_id',    $studentVal,   $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':lead_id',       $leadVal,      $leadVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':priority',     $priority);
    $stmt->bindParam(':status',       $status);
    $stmt->bindParam(':due_date',     $dueVal);
    $stmt->bindParam(':created_by',   $userId, PDO::PARAM_INT);
    $stmt->execute();
    $newId = (int) $pdo->lastInsertId();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, student_id, lead_id, type, description, created_at)
         VALUES (:uid, :sid, :lid, :type, :desc, NOW())'
    );
    $type = 'task_created';
    $desc = 'Task created: ' . $title;
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':sid',  $studentVal, $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $act->bindParam(':lid',  $leadVal,    $leadVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

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
            'You have been assigned: ' . $title . ($dueVal ? ' (due ' . format_date($dueVal, 'M d, Y') . ')' : ''),
            'info',
            'tasks/index.php'
        );
    }

    flash('success', 'Task created.');
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to create task: ' . $ex->getMessage());
}

/* Redirect back to referrer or tasks index */
$back = $_SERVER['HTTP_REFERER'] ?? url('tasks/index.php');
redirect($back);
