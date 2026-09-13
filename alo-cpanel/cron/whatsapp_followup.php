<?php
declare(strict_types=1);
/**
 * Legacy alias for followups.php — delegates to WhatsAppFollowupService
 * Crontab keeps compatibility: 0 10 * * * php cron/whatsapp_followup.php
 */
define('CRON_MODE', true);
$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';
require_once __DIR__ . '/../app/Services/AloWhatsAppNumberService.php';
require_once __DIR__ . '/../app/Services/WhatsAppCloudService.php';
require_once __DIR__ . '/../app/Services/WhatsAppFollowupService.php';
date_default_timezone_set('Asia/Dhaka');
$sent = WhatsAppFollowupService::dispatchDue(200);
echo "[".date('Y-m-d H:i:s')."] whatsapp_followup: sent {$sent}\n";
