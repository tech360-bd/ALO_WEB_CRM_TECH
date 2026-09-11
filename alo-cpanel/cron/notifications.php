#!/usr/bin/env php
<?php
/**
 * Cron — Notifications
 *
 * 1. Check overdue invoices → notify finance users.
 * 2. Check applications with upcoming deadlines (offer_date, cas_date, visa_date
 *    within next 7 days) → notify the counselor of the related student.
 *
 * Run from CLI:
 *   php cron/notifications.php
 *
 * Recommended cPanel cron (daily at 7 AM):
 *   0 7 * * *  php -f /home/USERNAME/public_html/cron/notifications.php
 */
declare(strict_types=1);

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';

if (php_sapi_name() !== 'cli' && !isset($_GET['force'])) {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

echo "[" . date('Y-m-d H:i:s') . "] Notifications cron starting...\n";

$pdo = db();
$today = date('Y-m-d');
$plus7 = date('Y-m-d', strtotime('+7 days'));

/* ----- 1. Overdue invoices ----- */
$overdueSql = "SELECT i.id, i.invoice_number, i.amount, i.currency, i.due_date,
                      s.id AS student_id, s.full_name AS student_name
                 FROM invoices i
            LEFT JOIN students s ON s.id = i.student_id
                WHERE i.status IN ('PENDING','PARTIAL','OVERDUE')
                  AND i.due_date IS NOT NULL
                  AND i.due_date < :today";
$overdueStmt = $pdo->prepare($overdueSql);
$overdueStmt->execute([':today' => $today]);
$overdue = $overdueStmt->fetchAll();

echo "Found " . count($overdue) . " overdue invoice(s).\n";

/* Finance users = role finance / admin / super_admin */
$finUsers = [];
try {
    $finStmt = $pdo->query("SELECT id FROM users WHERE status='active' AND role IN ('finance','admin','super_admin')");
    $finUsers = $finStmt->fetchAll();
} catch (Throwable $e) { /* ignore */ }

$notifiedInvoices = 0;
foreach ($overdue as $inv) {
    $msg = 'Invoice ' . $inv['invoice_number']
         . ' for student ' . ($inv['student_name'] ?? '#' . $inv['student_id'])
         . ' (amount ' . format_currency((float) $inv['amount'], $inv['currency'] ?? 'BDT')
         . ') was due ' . format_date($inv['due_date']) . '.';
    foreach ($finUsers as $u) {
        send_notification(
            (int) $u['id'],
            'Overdue invoice: ' . $inv['invoice_number'],
            $msg,
            'danger',
            'finance/index.php'
        );
    }
    $notifiedInvoices++;
}
echo "  Notified finance users about {$notifiedInvoices} overdue invoice(s).\n";

/* ----- 2. Application deadline reminders (next 7 days) ----- */
$appSql = "SELECT a.id, a.crm_id, a.status, a.offer_date, a.cas_date, a.visa_date,
                  s.id AS student_id, s.full_name AS student_name, s.counselor_id
             FROM applications a
        LEFT JOIN students s ON s.id = a.student_id
            WHERE a.offer_date IS NOT NULL AND a.offer_date BETWEEN :today AND :plus7
               OR a.cas_date   IS NOT NULL AND a.cas_date   BETWEEN :today2 AND :plus7
               OR a.visa_date  IS NOT NULL AND a.visa_date  BETWEEN :today3 AND :plus7";
$appStmt = $pdo->prepare($appSql);
$appStmt->execute([
    ':today' => $today, ':plus7' => $plus7,
    ':today2' => $today, ':plus7' => $plus7,
    ':today3' => $today, ':plus7' => $plus7,
]);
$apps = $appStmt->fetchAll();

echo "Found " . count($apps) . " application(s) with upcoming deadlines.\n";

$notifiedApps = 0;
foreach ($apps as $app) {
    $counselorId = (int) ($app['counselor_id'] ?? 0);
    if ($counselorId <= 0) continue;

    $messages = [];
    if (!empty($app['offer_date'])) {
        $messages[] = 'Offer date: ' . format_date($app['offer_date']);
    }
    if (!empty($app['cas_date'])) {
        $messages[] = 'CAS date: ' . format_date($app['cas_date']);
    }
    if (!empty($app['visa_date'])) {
        $messages[] = 'Visa date: ' . format_date($app['visa_date']);
    }
    $msg = 'Application ' . $app['crm_id'] . ' for student ' . $app['student_name']
         . ' has upcoming deadline(s): ' . implode('; ', $messages) . '.';
    send_notification(
        $counselorId,
        'Upcoming application deadline: ' . $app['crm_id'],
        $msg,
        'warning',
        'students/view.php?id=' . (int) $app['student_id']
    );
    $notifiedApps++;
}

echo "  Notified counselors about {$notifiedApps} application(s).\n";
echo "[" . date('Y-m-d H:i:s') . "] Done.\n";
exit(0);
