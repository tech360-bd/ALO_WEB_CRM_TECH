#!/usr/bin/env php
<?php
/**
 * Cron — Reminders
 *
 * Finds tasks with due_date <= tomorrow AND status = PENDING and creates a
 * notification for the assigned user reminding them of the upcoming deadline.
 *
 * Run from CLI:
 *   php cron/reminders.php
 *
 * Recommended cPanel cron (every 2 hours):
 *   0 */2 * * *  php -f /home/USERNAME/public_html/cron/reminders.php
 */
declare(strict_types=1);

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';

if (php_sapi_name() !== 'cli' && !isset($_GET['force'])) {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

echo "[" . date('Y-m-d H:i:s') . "] Reminders cron starting...\n";

$pdo = db();
$tomorrowEnd = date('Y-m-d 23:59:59', strtotime('+1 day'));

$sql = "SELECT t.id, t.title, t.due_date, t.priority, t.assigned_to,
               s.full_name AS student_name, l.full_name AS lead_name
          FROM tasks t
     LEFT JOIN students s ON s.id = t.student_id
     LEFT JOIN leads l ON l.id = t.lead_id
         WHERE t.status = 'PENDING'
           AND t.due_date IS NOT NULL
           AND t.due_date <= :tomorrow
         ORDER BY t.due_date ASC";
$stmt = $pdo->prepare($sql);
$stmt->execute([':tomorrow' => $tomorrowEnd]);
$tasks = $stmt->fetchAll();

echo "Found " . count($tasks) . " pending task(s) due within 24h.\n";

if (!$tasks) {
    echo "[" . date('Y-m-d H:i:s') . "] Nothing to do.\n";
    exit(0);
}

$sent = 0;
foreach ($tasks as $t) {
    $assignedTo = (int) ($t['assigned_to'] ?? 0);
    if ($assignedTo <= 0) {
        continue;
    }

    $title = $t['title'];
    $due   = format_date($t['due_date'], 'M d, Y H:i');

    $context = '';
    if (!empty($t['student_name'])) {
        $context = ' (Student: ' . $t['student_name'] . ')';
    } elseif (!empty($t['lead_name'])) {
        $context = ' (Lead: ' . $t['lead_name'] . ')';
    }

    $message = 'Task "' . $title . '"' . $context . ' is due ' . $due . '.';
    if (strtoupper((string) $t['priority']) === 'URGENT') {
        $message .= ' Marked URGENT.';
    }

    send_notification(
        $assignedTo,
        'Upcoming task due',
        $message,
        strtoupper((string) $t['priority']) === 'URGENT' ? 'danger' : 'warning',
        'tasks/index.php'
    );
    $sent++;
}

echo "[" . date('Y-m-d H:i:s') . "] Done. Sent {$sent} reminder(s).\n";
exit(0);
