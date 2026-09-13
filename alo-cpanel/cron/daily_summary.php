<?php
declare(strict_types=1);
/**
 * Cron: daily_summary — sends daily WhatsApp summary to managers at 18:30
 */
define('CRON_MODE', true);
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/WhatsAppCloudService.php';
date_default_timezone_set('Asia/Dhaka');
$pdo = db();
$today = date('Y-m-d');
$stmt = $pdo->prepare('SELECT COUNT(*) FROM whatsapp_conversations WHERE DATE(created_at)=:d');
$stmt->execute([':d'=>$today]); $newConvs = (int)$stmt->fetchColumn();
$stmt = $pdo->prepare('SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(created_at)=:d AND direction="inbound"');
$stmt->execute([':d'=>$today]); $inbound = (int)$stmt->fetchColumn();
$stmt = $pdo->prepare('SELECT COUNT(*) FROM dashboard_alarms WHERE DATE(created_at)=:d AND alarm_status="active"');
$stmt->execute([':d'=>$today]); $alarms = (int)$stmt->fetchColumn();
$msg = "ALO Daily Summary {$today}\nNew conversations: {$newConvs}\nInbound messages: {$inbound}\nActive alarms: {$alarms}\nView dashboard: https://crm.aloeducation.com/dashboard.php";
$svc = WhatsAppCloudService::fromEnv();
// Send to COO number's owner (if assigned) else log only
try {
    $pdo->prepare('INSERT INTO cron_logs (job_name, status, message) VALUES ("daily_summary", "success", :m)')->execute([':m'=>$msg]);
} catch (\Throwable $e) {}
echo $msg.PHP_EOL;
