<?php
/**
 * API — Students search
 *
 * GET ?q=XX
 *
 * Searches students by name / phone / email / CRM ID.
 * Returns JSON [{id, crm_id, full_name, phone, email}]
 */
declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

/* Auth */
if (!is_logged_in()) {
    json_response(['error' => 'Authentication required'], 401);
}
if (!has_permission('students.view')) {
    json_response(['error' => 'Forbidden'], 403);
}

$q = trim((string) ($_GET['q'] ?? ''));
if ($q === '' || mb_strlen($q) < 2) {
    json_response([], 200);
}

$pdo = db();
$like = '%' . $q . '%';
$stmt = $pdo->prepare(
    'SELECT id, crm_id, full_name, phone, email
       FROM students
      WHERE full_name LIKE :q
         OR phone LIKE :q2
         OR email LIKE :q3
         OR crm_id LIKE :q4
      ORDER BY
         CASE WHEN crm_id = :exact THEN 0 ELSE 1 END,
         full_name ASC
      LIMIT 20'
);
$stmt->bindValue(':q',     $like);
$stmt->bindValue(':q2',    $like);
$stmt->bindValue(':q3',    $like);
$stmt->bindValue(':q4',    $like);
$stmt->bindValue(':exact', $q);
$stmt->execute();
$rows = $stmt->fetchAll();

$out = array_map(static fn($r) => [
    'id'        => (int) $r['id'],
    'crm_id'    => (string) ($r['crm_id'] ?? ''),
    'full_name' => (string) ($r['full_name'] ?? ''),
    'phone'     => (string) ($r['phone'] ?? ''),
    'email'     => (string) ($r['email'] ?? ''),
], $rows);

json_response($out, 200);
