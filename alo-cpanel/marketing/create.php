<?php
/**
 * Marketing — Create Campaign endpoint (POST)
 *
 * Inserts a marketing_campaigns row, logs audit, redirects back to marketing
 * index.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('marketing.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('marketing/index.php');
}

$name       = trim((string) ($_POST['name'] ?? ''));
$platform   = trim((string) ($_POST['platform'] ?? ''));
$startDate  = trim((string) ($_POST['start_date'] ?? ''));
$endDate    = trim((string) ($_POST['end_date'] ?? ''));
$budget     = trim((string) ($_POST['budget'] ?? ''));
$status     = trim((string) ($_POST['status'] ?? 'DRAFT'));

$allowedPlatforms = ['FACEBOOK','INSTAGRAM','WHATSAPP','MESSENGER','EMAIL','SMS'];
$allowedStatuses  = ['DRAFT','ACTIVE','PAUSED','COMPLETED'];

$errors = [];
if (!validate_required($name)) $errors[] = 'Campaign name is required.';
elseif (!validate_max($name, 190)) $errors[] = 'Name must be 190 characters or fewer.';
if (!in_array($platform, $allowedPlatforms, true)) $errors[] = 'Invalid platform.';
if (!in_array($status, $allowedStatuses, true)) $errors[] = 'Invalid status.';
if ($startDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) $errors[] = 'Start date must be YYYY-MM-DD.';
if ($endDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) $errors[] = 'End date must be YYYY-MM-DD.';
if ($budget !== '' && !is_numeric($budget)) $errors[] = 'Budget must be a number.';

if ($errors) {
    flash('error', implode(' ', $errors));
    redirect('marketing/index.php');
}

$nullable = static fn($v) => $v !== '' ? $v : null;
$budgetVal = ($budget !== '' && is_numeric($budget)) ? (float) $budget : null;
$userId = (int) ($_SESSION['user_id'] ?? 0);

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO marketing_campaigns
            (name, platform, status, start_date, end_date, budget,
             spent, reach, engagement, leads, conversions,
             created_by, created_at, updated_at)
         VALUES
            (:name, :platform, :status, :start_date, :end_date, :budget,
             0, 0, 0, 0, 0,
             :created_by, NOW(), NOW())'
    );
    $stmt->bindParam(':name',        $name);
    $stmt->bindParam(':platform',    $platform);
    $stmt->bindParam(':status',       $status);
    $stmt->bindParam(':start_date',  $nullable($startDate));
    $stmt->bindParam(':end_date',    $nullable($endDate));
    $stmt->bindParam(':budget',       $budgetVal);
    $stmt->bindParam(':created_by',  $userId, PDO::PARAM_INT);
    $stmt->execute();
    $newId = (int) $pdo->lastInsertId();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, crm_id, type, description, created_at)
         VALUES (:uid, NULL, :type, :desc, NOW())'
    );
    $type = 'campaign_created';
    $desc = 'Marketing campaign created: ' . $name . ' (' . $platform . ')';
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('create', 'marketing_campaigns', $newId, null, [
        'name' => $name, 'platform' => $platform, 'status' => $status,
        'budget' => $budgetVal, 'created_by' => $userId,
    ]);

    flash('success', 'Campaign created.');
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to create campaign: ' . $ex->getMessage());
}

redirect('marketing/index.php');
