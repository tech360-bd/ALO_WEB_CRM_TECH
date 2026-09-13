<?php
/**
 * Marketing — Approve / Reject Content endpoint (POST)
 *
 * Updates the status of a marketing_content row to APPROVED or REJECTED,
 * records who approved it and when, logs audit, and redirects back.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('marketing.approve');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('marketing/index.php');
}

$contentId = (int) ($_POST['content_id'] ?? 0);
$decision  = strtoupper(trim((string) ($_POST['decision'] ?? '')));
$notes     = trim((string) ($_POST['notes'] ?? ''));

if ($contentId <= 0) {
    flash('error', 'Invalid content ID.');
    redirect('marketing/index.php');
}

if (!in_array($decision, ['APPROVED','REJECTED'], true)) {
    flash('error', 'Decision must be APPROVED or REJECTED.');
    redirect('marketing/index.php');
}

/* Fetch current content */
$stmt = $pdo->prepare('SELECT * FROM marketing_content WHERE id = :id');
$stmt->execute([':id' => $contentId]);
$content = $stmt->fetch();
if (!$content) {
    flash('error', 'Marketing content not found.');
    redirect('marketing/index.php');
}
$content = is_array($content) ? $content : [];

$userId = (int) ($_SESSION['user_id'] ?? 0);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'UPDATE marketing_content
            SET status      = :status,
                approved_by = :approved_by,
                approved_at = NOW(),
                updated_at   = NOW()
          WHERE id = :id'
    );
    $stmt->bindParam(':status',       $decision);
    $stmt->bindParam(':approved_by',  $userId, PDO::PARAM_INT);
    $stmt->bindParam(':id',           $contentId, PDO::PARAM_INT);
    $stmt->execute();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, crm_id, type, description, created_at)
         VALUES (:uid, NULL, :type, :desc, NOW())'
    );
    $type = 'content_' . strtolower($decision);
    $desc = 'Marketing content ' . strtolower($decision) . ': ' . ($content['title'] ?? '#' . $contentId)
          . ($notes !== '' ? ' — ' . $notes : '');
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('update', 'marketing_content', $contentId, $content, [
        'status' => $decision, 'approved_by' => $userId, 'notes' => $notes,
    ]);

    flash('success', 'Content ' . strtolower($decision) . ' successfully.');
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to update content: ' . $ex->getMessage());
}

redirect('marketing/index.php');
