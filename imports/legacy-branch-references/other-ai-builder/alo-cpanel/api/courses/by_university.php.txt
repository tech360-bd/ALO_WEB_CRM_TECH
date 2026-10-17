<?php
/**
 * API — Courses by University
 *
 * GET ?university_id=XX
 *
 * Returns JSON [{id, name, level, tuition_fee, currency, ielts_requirement}]
 */
declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    json_response(['error' => 'Authentication required'], 401);
}
if (!has_permission('courses.view')) {
    json_response(['error' => 'Forbidden'], 403);
}

$uniId = (int) ($_GET['university_id'] ?? 0);
if ($uniId <= 0) {
    json_response(['error' => 'university_id required'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    "SELECT id, name, level, tuition_fee, currency, ielts_requirement
       FROM courses
      WHERE university_id = :uid
        AND status = 'active'
      ORDER BY name"
);
$stmt->execute([':uid' => $uniId]);
$rows = $stmt->fetchAll();

$out = array_map(static fn($r) => [
    'id'                 => (int) $r['id'],
    'name'               => (string) ($r['name'] ?? ''),
    'level'              => (string) ($r['level'] ?? ''),
    'tuition_fee'        => $r['tuition_fee'] !== null ? (float) $r['tuition_fee'] : null,
    'currency'           => (string) ($r['currency'] ?? 'USD'),
    'ielts_requirement'  => $r['ielts_requirement'] !== null ? (float) $r['ielts_requirement'] : null,
], $rows);

json_response($out, 200);
