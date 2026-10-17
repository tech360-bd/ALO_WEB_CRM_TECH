#!/usr/bin/env php
<?php
/**
 * Cron — Follow-ups
 *
 * Finds leads where follow_up_date <= today AND status != ENROLLED,
 * creates a "Follow up with {lead_name}" task assigned to the lead's counselor,
 * then bumps the lead's follow_up_date forward by 7 days.
 *
 * Run from CLI:
 *   php cron/followups.php
 *
 * Recommended cPanel cron (daily at 8 AM):
 *   0 8 * * *  php -f /home/USERNAME/public_html/cron/followups.php
 */
declare(strict_types=1);

/* Skip CSRF check (CLI has no session) */
$GLOBALS['__skip_csrf'] = true;

require_once __DIR__ . '/../app/bootstrap.php';

/* Confirm CLI execution */
if (php_sapi_name() !== 'cli' && !isset($_GET['force'])) {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

echo "[" . date('Y-m-d H:i:s') . "] Follow-up cron starting...\n";

$pdo  = db();
$today = date('Y-m-d');

/* Find leads due for follow-up */
$sql = "SELECT l.id, l.crm_id, l.full_name, l.counselor_id, l.follow_up_date, l.status
          FROM leads l
         WHERE l.follow_up_date IS NOT NULL
           AND l.follow_up_date <= :today
           AND l.status NOT IN ('ENROLLED','LOST')
         ORDER BY l.follow_up_date ASC";
$stmt = $pdo->prepare($sql);
$stmt->execute([':today' => $today]);
$leads = $stmt->fetchAll();

echo "Found " . count($leads) . " lead(s) requiring follow-up.\n";

if (!$leads) {
    echo "[" . date('Y-m-d H:i:s') . "] Nothing to do.\n";
    exit(0);
}

$created = 0;
$bumped = 0;
$systemUserId = 0;

/* Try to find a system / super_admin user for audit logging */
try {
    $suStmt = $pdo->query("SELECT id FROM users WHERE role='super_admin' AND status='active' ORDER BY id ASC LIMIT 1");
    $suId = $suStmt->fetchColumn();
    if ($suId) {
        $systemUserId = (int) $suId;
        $_SESSION['user_id'] = $systemUserId; /* for log_audit() */
    }
} catch (Throwable $e) { /* ignore */ }

$newFollowUpDate = date('Y-m-d', strtotime('+7 days'));

foreach ($leads as $lead) {
    $leadId     = (int) $lead['id'];
    $leadName   = (string) $lead['full_name'];
    $crmId      = (string) ($lead['crm_id'] ?? '');
    $counselor  = $lead['counselor_id'] ? (int) $lead['counselor_id'] : null;
    $dueDate    = date('Y-m-d H:i:s', strtotime('+1 day'));

    try {
        $pdo->beginTransaction();

        /* Insert follow-up task */
        $title = 'Follow up with ' . $leadName;
        $description = 'Automated follow-up reminder for lead ' . $crmId
                     . ' (original follow-up date: ' . $lead['follow_up_date'] . ').';

        $insTask = $pdo->prepare(
            'INSERT INTO tasks
                (title, description, assigned_to, lead_id, priority, status,
                 due_date, created_by, created_at, updated_at)
             VALUES
                (:title, :description, :assigned_to, :lead_id, "HIGH", "PENDING",
                 :due_date, :created_by, NOW(), NOW())'
        );
        $insTask->bindParam(':title',        $title);
        $insTask->bindParam(':description',  $description);
        $insTask->bindParam(':assigned_to',  $counselor, $counselor === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $insTask->bindParam(':lead_id',       $leadId, PDO::PARAM_INT);
        $insTask->bindParam(':due_date',      $dueDate);
        $insTask->bindParam(':created_by',    $systemUserId > 0 ? $systemUserId : null,
                                       $systemUserId > 0 ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $insTask->execute();
        $taskId = (int) $pdo->lastInsertId();

        /* Activity log */
        $act = $pdo->prepare(
            'INSERT INTO activities
                (user_id, lead_id, crm_id, type, description, created_at)
             VALUES (:uid, :lid, :crm, :type, :desc, NOW())'
        );
        $act->bindValue(':uid',  $systemUserId > 0 ? $systemUserId : null, $systemUserId > 0 ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $act->bindParam(':lid',  $leadId, PDO::PARAM_INT);
        $act->bindParam(':crm',  $crmId);
        $type = 'followup_task_created';
        $desc = 'Automated follow-up task #' . $taskId . ' created for ' . $leadName;
        $act->bindParam(':type', $type);
        $act->bindParam(':desc', $desc);
        $act->execute();

        /* Bump the follow_up_date +7 days */
        $bump = $pdo->prepare('UPDATE leads SET follow_up_date = :fd, updated_at = NOW() WHERE id = :id');
        $bump->bindParam(':fd', $newFollowUpDate);
        $bump->bindParam(':id', $leadId, PDO::PARAM_INT);
        $bump->execute();

        $pdo->commit();

        $created++;
        $bumped++;
        echo "  - Created task #{$taskId} for lead #{$leadId} ({$leadName}); next follow-up {$newFollowUpDate}\n";

        /* Notify the counselor */
        if ($counselor > 0) {
            send_notification(
                $counselor,
                'Follow-up reminder: ' . $leadName,
                'A follow-up with ' . $leadName . ' (' . $crmId . ') was due ' . $lead['follow_up_date'] . '. Task #' . $taskId . ' created.',
                'warning',
                'leads/view.php?id=' . $leadId
            );
        }
    } catch (Throwable $ex) {
        try { $pdo->rollBack(); } catch (Throwable $e) {}
        fwrite(STDERR, "  ! Failed for lead #{$leadId} ({$leadName}): " . $ex->getMessage() . "\n");
    }
}

echo "[" . date('Y-m-d H:i:s') . "] Done. Created {$created} task(s); bumped {$bumped} lead(s).\n";
exit(0);
