<?php
/**
 * Courses — Create endpoint (POST)
 *
 * Inserts a course under a university, generates slug, logs audit,
 * redirects back.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('courses.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('courses/index.php');
}

$universityId      = (int) ($_POST['university_id'] ?? 0);
$name              = trim((string) ($_POST['name'] ?? ''));
$level             = trim((string) ($_POST['level'] ?? ''));
$duration          = trim((string) ($_POST['duration'] ?? ''));
$tuitionFee        = trim((string) ($_POST['tuition_fee'] ?? ''));
$currency          = trim((string) ($_POST['currency'] ?? 'USD'));
$intake            = trim((string) ($_POST['intake'] ?? ''));
$entryRequirement = trim((string) ($_POST['entry_requirement'] ?? ''));
$ieltsRequirement = trim((string) ($_POST['ielts_requirement'] ?? ''));
$description      = trim((string) ($_POST['description'] ?? ''));
$status            = trim((string) ($_POST['status'] ?? 'active'));

$allowedCurrencies = ['BDT','USD','GBP','EUR','CAD','AUD'];

$errors = [];
if ($universityId <= 0) $errors[] = 'University is required.';
if (!validate_required($name)) $errors[] = 'Course name is required.';
elseif (!validate_max($name, 190)) $errors[] = 'Name must be 190 characters or fewer.';
if ($tuitionFee !== '' && !is_numeric($tuitionFee)) $errors[] = 'Tuition fee must be a number.';
if (!in_array($currency, $allowedCurrencies, true)) $errors[] = 'Invalid currency.';
if ($ieltsRequirement !== '' && !is_numeric($ieltsRequirement)) $errors[] = 'IELTS requirement must be a number.';
if (!in_array($status, ['active','inactive'], true)) $errors[] = 'Invalid status.';

if ($errors) {
    flash('error', implode(' ', $errors));
    redirect('courses/index.php');
}

/* Validate that university exists */
$chk = $pdo->prepare('SELECT id, name FROM universities WHERE id = :id');
$chk->execute([':id' => $universityId]);
$uni = $chk->fetch();
if (!$uni) {
    flash('error', 'University not found.');
    redirect('courses/index.php');
}

/* Generate unique slug */
$baseSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-'));
$slug = $baseSlug;
$i = 1;
while (true) {
    $chk = $pdo->prepare('SELECT id FROM courses WHERE slug = :slug');
    $chk->execute([':slug' => $slug]);
    if (!$chk->fetch()) break;
    $slug = $baseSlug . '-' . $i++;
}

$nullable = static fn($v) => $v !== '' ? $v : null;
$numNull  = static fn($v) => ($v !== '' && is_numeric($v)) ? (float) $v : null;

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO courses
            (university_id, name, slug, level, duration, tuition_fee, currency,
             intake, entry_requirement, ielts_requirement, description, status,
             created_at, updated_at)
         VALUES
            (:university_id, :name, :slug, :level, :duration, :tuition_fee, :currency,
             :intake, :entry_requirement, :ielts_requirement, :description, :status,
             NOW(), NOW())'
    );
    $stmt->bindParam(':university_id',     $universityId, PDO::PARAM_INT);
    $stmt->bindParam(':name',               $name);
    $stmt->bindParam(':slug',                $slug);
    $stmt->bindParam(':level',               $nullable($level));
    $stmt->bindParam(':duration',            $nullable($duration));
    $stmt->bindParam(':tuition_fee',         $numNull($tuitionFee));
    $stmt->bindParam(':currency',            $currency);
    $stmt->bindParam(':intake',              $nullable($intake));
    $stmt->bindParam(':entry_requirement',  $nullable($entryRequirement));
    $stmt->bindParam(':ielts_requirement',  $numNull($ieltsRequirement));
    $stmt->bindParam(':description',        $nullable($description));
    $stmt->bindParam(':status',              $status);
    $stmt->execute();
    $newId = (int) $pdo->lastInsertId();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, crm_id, type, description, created_at)
         VALUES (:uid, NULL, :type, :desc, NOW())'
    );
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $type = 'course_created';
    $desc = 'Course created: ' . $name . ' at ' . ($uni['name'] ?? '#' . $universityId);
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('create', 'courses', $newId, null, [
        'university_id' => $universityId, 'name' => $name, 'level' => $nullable($level),
        'tuition_fee' => $numNull($tuitionFee), 'currency' => $currency,
    ]);

    flash('success', 'Course created.');
    redirect('universities/view.php?id=' . $universityId);
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to create course: ' . $ex->getMessage());
}

redirect('courses/index.php');
