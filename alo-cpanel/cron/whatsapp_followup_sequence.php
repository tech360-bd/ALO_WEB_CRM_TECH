<?php
declare(strict_types=1);

/**
 * Cron: whatsapp_followup_sequence — sends due followups daily 10:00 Asia/Dhaka
 * Crontab: 0 10 * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_followup_sequence.php >> /home/aloeduca/logs/followup.log 2>&1
 *
 * Also handles pre-checks: verify number 01805020100 still active, log cron_logs.
 */

define('CRON_MODE', true);
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/AloWhatsAppNumberService.php';
require_once __DIR__ . '/../app/Services/WhatsAppCloudService.php';
require_once __DIR__ . '/../app/Services/WhatsAppFollowupService.php';

date_default_timezone_set('Asia/Dhaka');
$start = microtime(true);
$log = function(string $msg) { echo '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL; error_log('[followup_sequence] ' . $msg); };

try {
    $pdo = db();
    $pdo->prepare('INSERT INTO cron_logs (job_name, status, message) VALUES ("whatsapp_followup_sequence", "started", "Cron started")')->execute();
} catch (\Throwable $e) {}

$main = AloWhatsAppNumberService::getMainNumber();
if (!$main || (int)$main['is_active'] !== 1) {
    $log('ERROR: Main followup sender 01805020100 not active — abort');
    try { $pdo->prepare('INSERT INTO cron_logs (job_name, status, message) VALUES ("whatsapp_followup_sequence", "failed", "Main number inactive")')->execute(); } catch (\Throwable $e) {}
    exit(1);
}

$sent = WhatsAppFollowupService::dispatchDue(200);
$elapsed = round(microtime(true) - $start, 2);
$log("Dispatched {$sent} followups in {$elapsed}s via {$main['phone_number']}");

try {
    $pdo->prepare('INSERT INTO cron_logs (job_name, status, message) VALUES ("whatsapp_followup_sequence", "success", :msg)')->execute([':msg' => "Sent {$sent} followups"]);
} catch (\Throwable $e) {}
exit(0);
