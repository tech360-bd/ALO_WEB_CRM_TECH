<?php
declare(strict_types=1);

/**
 * Cron: whatsapp_sla_monitor — runs every 5 minutes to escalate SLA breaches
 * Crontab: */5 * * * * /usr/local/bin/php /home/aloeduca/public_html/cron/whatsapp_sla_monitor.php >> /home/aloeduca/logs/sla.log 2>&1
 */

define('CRON_MODE', true);
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/WhatsAppSlaService.php';

date_default_timezone_set('Asia/Dhaka');
$log = function(string $m){ echo '['.date('Y-m-d H:i:s').'] '.$m.PHP_EOL; };

if (!WhatsAppSlaService::isOfficeHours()) {
    $log('Outside office hours (Fri closed or 09-18 only) — skip escalation');
    exit(0);
}

$result = WhatsAppSlaService::monitorAndEscalate();
$log('SLA monitor: ' . json_encode($result));

try {
    $pdo = db();
    $pdo->prepare('INSERT INTO cron_logs (job_name, status, message) VALUES ("whatsapp_sla_monitor", "success", :msg)')->execute([':msg'=>json_encode($result)]);
} catch (\Throwable $e) {}
exit(0);
