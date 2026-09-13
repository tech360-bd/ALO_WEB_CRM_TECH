<?php
declare(strict_types=1);
/**
 * Cron: retry failed whatsapp jobs (failed API sends)
 * Schedule: */10 * * * *
 */
define('CRON_MODE', true);
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/WhatsAppCloudService.php';
date_default_timezone_set('Asia/Dhaka');
$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM whatsapp_failed_jobs WHERE status IN ("pending","retrying") AND next_retry_at <= NOW() AND attempts < 5 ORDER BY created_at ASC LIMIT 50');
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$svc = WhatsAppCloudService::fromEnv();
foreach ($rows as $row) {
    $pdo->prepare('UPDATE whatsapp_failed_jobs SET attempts = attempts + 1, status = "retrying", updated_at = NOW() WHERE id = :id')->execute([':id'=>$row['id']]);
    $res = $svc->sendText($row['phone'], $row['message']);
    if ($res['success']) {
        $pdo->prepare('UPDATE whatsapp_failed_jobs SET status = "sent", updated_at = NOW() WHERE id = :id')->execute([':id'=>$row['id']]);
    } else {
        $next = date('Y-m-d H:i:s', strtotime('+'. (pow(2, (int)$row['attempts']) * 5) .' minutes'));
        $pdo->prepare('UPDATE whatsapp_failed_jobs SET last_error = :err, next_retry_at = :nxt, status = IF(attempts >= 5, "failed", "pending"), updated_at = NOW() WHERE id = :id')->execute([':id'=>$row['id'], ':err'=>substr($res['error']??'',0,2000), ':nxt'=>$next]);
    }
    usleep(200000);
}
echo "Retried ".count($rows)." jobs\n";
