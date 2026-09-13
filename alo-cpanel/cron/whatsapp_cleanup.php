<?php
declare(strict_types=1);
/**
 * Cron: whatsapp_cleanup — prunes old failed jobs (>30d) and old cron_logs (>90d)
 * Daily 02:00
 */
define('CRON_MODE', true);
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
$pdo = db();
$pdo->exec('DELETE FROM whatsapp_failed_jobs WHERE status = "sent" AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)');
$pdo->exec('DELETE FROM whatsapp_failed_jobs WHERE status = "failed" AND created_at < DATE_SUB(NOW(), INTERVAL 60 DAY)');
$pdo->exec('DELETE FROM cron_logs WHERE executed_at < DATE_SUB(NOW(), INTERVAL 90 DAY)');
echo "Cleanup done\n";
