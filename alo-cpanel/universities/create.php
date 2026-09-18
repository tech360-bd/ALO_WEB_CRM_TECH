<?php
/**
 * Universities — Create endpoint (POST)
 *
 * Inserts a university with an auto-generated slug, logs audit, redirects
 * back to the universities index.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('universities.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('universities/index.php');
}

$name        = trim((string) ($_POST['name'] ?? ''));
$country     = trim((string) ($_POST['country'] ?? ''));
$city        = trim((string) ($_POST['city'] ?? ''));
$ranking     = trim((string) ($_POST['ranking'] ?? ''));
$website     = trim((string) ($_POST['website'] ?? ''));
$description = trim((string) ($_POST['description'] ?? ''));
$status      = trim((string) ($_POST['status'] ?? 'active'));

$errors = [];
if (!validate_required($name)) $errors[] = 'University name is required.';
elseif (!validate_max($name, 190)) $errors[] = 'Name must be 190 characters or fewer.';
if ($ranking !== '' && (!ctype_digit($ranking) || (int) $ranking < 1)) $errors[] = 'Ranking must be a positive integer.';
if ($website !== '' && !filter_var($website, FILTER_VALIDATE_URL)) $errors[] = 'Website URL is invalid.';
if (!in_array($status, ['active','inactive'], true)) $errors[] = 'Invalid status.';

if ($errors) {
    flash('error', implode(' ', $errors));
    redirect('universities/index.php');
}

/* Generate unique slug */
$baseSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-'));
$slug = $baseSlug;
$i = 1;
while (true) {
    $chk = $pdo->prepare('SELECT id FROM universities WHERE slug = :slug');
    $chk->execute([':slug' => $slug]);
    if (!$chk->fetch()) break;
    $slug = $baseSlug . '-' . $i++;
}

$nullable = static fn($v) => $v !== '' ? $v : null;
$rankingVal = ($ranking !== '' && ctype_digit($ranking)) ? (int) $ranking : null;

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO universities
            (name, slug, country, city, logo, ranking, website, description, status,
             created_at, updated_at)
         VALUES
            (:name, :slug, :country, :city, NULL, :ranking, :website, :description, :status,
             NOW(), NOW())'
    );
    $stmt->bindParam(':name',        $name);
    $stmt->bindParam(':slug',         $slug);
    $stmt->bindParam(':country',      $nullable($country));
    $stmt->bindParam(':city',         $nullable($city));
    $stmt->bindParam(':ranking',      $rankingVal, $rankingVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindParam(':website',      $nullable($website));
    $stmt->bindParam(':description', $nullable($description));
    $stmt->bindParam(':status',       $status);
    $stmt->execute();
    $newId = (int) $pdo->lastInsertId();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, crm_id, type, description, created_at)
         VALUES (:uid, NULL, :type, :desc, NOW())'
    );
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $type = 'university_created';
    $desc = 'University created: ' . $name;
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('create', 'universities', $newId, null, [
        'name' => $name, 'country' => $nullable($country), 'city' => $nullable($city),
        'ranking' => $rankingVal, 'website' => $nullable($website),
    ]);

    flash('success', 'University created.');
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to create university: ' . $ex->getMessage());
}

redirect('universities/index.php');
