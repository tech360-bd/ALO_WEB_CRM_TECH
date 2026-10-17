<?php
/**
 * API — Leads search
 *
 * GET ?q=XX
 *
 * Searches leads by name / phone / email / CRM ID.
 * Returns JSON [{id, crm_id, full_name, phone, email, status, counselor_name}]
 */
declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    json_response(['error' => 'Authentication required'], 401);
}
if (!has_permission('leads.view')) {
    json_response(['error' => 'Forbidden'], 403);
}

$q = trim((string) ($_GET['q'] ?? ''));
if ($q === '' || mb_strlen($q) < 2) {
    json_response([], 200);
}

$pdo = db();
$like = '%' . $q . '%';
$stmt = $pdo->prepare(
    'SELECT l.id, l.crm_id, l.full_name, l.phone, l.email, l.status,
            u.name AS counselor_name
       FROM leads l
  LEFT JOIN users u ON u.id = l.counselor_id
      WHERE l.full_name LIKE :q
         OR l.phone LIKE :q2
         OR l.email LIKE :q3
         OR l.crm_id LIKE :q4
      ORDER BY
         CASE WHEN l.crm_id = :exact THEN 0 ELSE 1 END,
         l.full_name ASC
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
    'id'             => (int) $r['id'],
    'crm_id'         => (string) ($r['crm_id'] ?? ''),
    'full_name'      => (string) ($r['full_name'] ?? ''),
    'phone'          => (string) ($r['phone'] ?? ''),
    'email'          => (string) ($r['email'] ?? ''),
    'status'         => (string) ($r['status'] ?? 'NEW'),
    'counselor_name' => (string) ($r['counselor_name'] ?? ''),
], $rows);

json_response($out, 200);
