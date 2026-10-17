#!/usr/bin/env php
<?php
/**
 * Cron — Marketing auto-publish
 *
 * Finds marketing_content rows with status = APPROVED and published_at <= now,
 * and sets them to PUBLISHED. This is the second phase of the approval workflow
 * (approve -> schedule -> auto-publish).
 *
 * Run from CLI:
 *   php cron/marketing.php
 *
 * Recommended cPanel cron (every 15 minutes):
 *   */15 * * * *  php -f /home/USERNAME/public_html/cron/marketing.php
 */
declare(strict_types=1);

$GLOBALS['__skip_csrf'] = true;
require_once __DIR__ . '/../app/bootstrap.php';

if (php_sapi_name() !== 'cli' && !isset($_GET['force'])) {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

echo "[" . date('Y-m-d H:i:s') . "] Marketing publish cron starting...\n";

$pdo = db();
$now = date('Y-m-d H:i:s');

/* Fetch content that is APPROVED and scheduled for now-or-past */
$sql = "SELECT mc.id, mc.title, mc.status, mc.published_at, mc.campaign_id,
               mc.created_by,
               c.name AS campaign_name, c.status AS campaign_status
          FROM marketing_content mc
     LEFT JOIN marketing_campaigns c ON c.id = mc.campaign_id
         WHERE mc.status = 'APPROVED'
           AND mc.published_at IS NOT NULL
           AND mc.published_at <= :now";
$stmt = $pdo->prepare($sql);
$stmt->execute([':now' => $now]);
$rows = $stmt->fetchAll();

echo "Found " . count($rows) . " content piece(s) ready to publish.\n";

if (!$rows) {
    echo "[" . date('Y-m-d H:i:s') . "] Nothing to do.\n";
    exit(0);
}

$published = 0;
foreach ($rows as $row) {
    $contentId = (int) $row['id'];
    try {
        $pdo->beginTransaction();

        $upd = $pdo->prepare(
            "UPDATE marketing_content
                SET status = 'PUBLISHED',
                    updated_at = NOW()
              WHERE id = :id"
        );
        $upd->bindParam(':id', $contentId, PDO::PARAM_INT);
        $upd->execute();

        /* Activity log */
        $act = $pdo->prepare(
            'INSERT INTO activities
                (user_id, crm_id, type, description, created_at)
             VALUES (:uid, NULL, :type, :desc, NOW())'
        );
        $act->bindValue(':uid', $row['created_by'] ?? null, $row['created_by'] ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $type = 'content_published';
        $desc = 'Marketing content published: ' . $row['title'] . ' (campaign: ' . ($row['campaign_name'] ?? 'N/A') . ')';
        $act->bindParam(':type', $type);
        $act->bindParam(':desc', $desc);
        $act->execute();

        $pdo->commit();

        log_audit('update', 'marketing_content', $contentId, $row, [
            'status' => 'PUBLISHED',
            'published_at' => $row['published_at'],
        ]);

        $published++;
        echo "  - Published content #{$contentId} ({$row['title']})\n";

        /* Notify the creator */
        if (!empty($row['created_by'])) {
            send_notification(
                (int) $row['created_by'],
                'Content published: ' . $row['title'],
                'Your scheduled marketing content "' . $row['title'] . '" has been published.',
                'success',
                'marketing/index.php'
            );
        }
    } catch (Throwable $ex) {
        try { $pdo->rollBack(); } catch (Throwable $e) {}
        fwrite(STDERR, "  ! Failed for content #{$contentId}: " . $ex->getMessage() . "\n");
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Done. Published {$published} piece(s).\n";
exit(0);
