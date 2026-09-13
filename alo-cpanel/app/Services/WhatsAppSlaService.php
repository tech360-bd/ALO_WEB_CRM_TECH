<?php
declare(strict_types=1);

/**
 * WhatsAppSlaService — Monitors office hours (Asia/Dhaka Sat-Thu 09-18 Fri closed) and escalations
 *
 * SLA: 30 min counselor -> 20 min branch_manager -> 10 min ceo -> global_alarm
 * Creates whatsapp_sla_events, dashboard_notifications, dashboard_alarms, tasks.
 */
class WhatsAppSlaService
{
    public const SLA_EMPLOYEE = 30;
    public const SLA_BRANCH_MANAGER = 20;
    public const SLA_CEO = 10;

    public static function isOfficeHours(?DateTime $now = null): bool
    {
        $tz = new DateTimeZone('Asia/Dhaka');
        $dt = $now ?? new DateTime('now', $tz);
        if ($dt->getTimezone()->getName() !== 'Asia/Dhaka') {
            $dt->setTimezone($tz);
        }
        // Friday is closed (N=5 where 1=Mon..7=Sun, Fri=5)
        $dayNum = (int)$dt->format('N');
        if ($dayNum === 5) return false;
        $hour = (int)$dt->format('G'); // 0-23
        $min = (int)$dt->format('i');
        $totalMin = $hour * 60 + $min;
        $start = 9 * 60;
        $end = 18 * 60; // exclusive
        return $totalMin >= $start && $totalMin < $end;
    }

    public static function slaStartedAtForConversation(int $conversationId): ?DateTime
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT sla_started_at, last_student_message_at FROM whatsapp_conversations WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $conversationId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) return null;
            $raw = $row['sla_started_at'] ?? $row['last_student_message_at'];
            if (empty($raw)) return null;
            return new DateTime($raw, new DateTimeZone('Asia/Dhaka'));
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Called when a student message arrives — starts/restarts SLA.
     */
    public static function onStudentMessage(int $conversationId, ?int $branchId = null): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_conversations SET sla_started_at = NOW(), last_student_message_at = NOW(), escalation_level = "none", escalation_status = "open", updated_at = NOW() WHERE id = :id')
                ->execute([':id' => $conversationId]);
            // If office hours, create immediate dashboard notification? No, wait for SLA to breach.
        } catch (\Throwable $e) {
            error_log('onStudentMessage SLA error: ' . $e->getMessage());
        }
    }

    /**
     * Called when staff replies — resolves SLA, cancels alarms.
     */
    public static function onStaffReply(int $conversationId, ?int $staffUserId = null): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_conversations SET last_staff_reply_at = NOW(), escalation_level = "none", escalation_status = "resolved", resolved_by = :uid, resolved_at = NOW(), updated_at = NOW() WHERE id = :id')
                ->execute([':id' => $conversationId, ':uid' => $staffUserId]);
            $pdo->prepare('UPDATE whatsapp_sla_events SET status = "resolved", resolved_at = NOW() WHERE conversation_id = :cid AND status = "open"')->execute([':cid' => $conversationId]);
            $pdo->prepare('UPDATE dashboard_alarms SET alarm_status = "resolved", resolved_at = NOW(), resolved_by = :uid WHERE conversation_id = :cid AND alarm_status = "active"')->execute([':cid' => $conversationId, ':uid' => $staffUserId]);
            $pdo->prepare('UPDATE dashboard_notifications SET is_read = 1, read_at = NOW() WHERE conversation_id = :cid AND is_read = 0')->execute([':cid' => $conversationId]);
        } catch (\Throwable $e) {
            error_log('onStaffReply SLA error: ' . $e->getMessage());
        }
    }

    /**
     * Cron-every-5-min: scan open conversations where SLA breached and escalate.
     * Returns counts array.
     */
    public static function monitorAndEscalate(): array
    {
        $result = ['scanned' => 0, 'escalated_to_branch_manager' => 0, 'escalated_to_ceo' => 0, 'global_alarms' => 0];
        if (!self::isOfficeHours()) {
            // Outside office hours we do not escalate, but we keep SLA clock paused? Spec: only escalate during office hours.
            // We still scan but skip escalation until next office window. For simplicity, skip.
            return $result;
        }
        try {
            $pdo = db();
            // Fetch open conversations with sla_started_at and no recent staff reply
            // We treat last_staff_reply_at > sla_started_at as resolved; if staff replied after student, no escalation.
            $stmt = $pdo->query('SELECT id, branch_id, assigned_to, sla_started_at, last_student_message_at, last_staff_reply_at, escalation_level FROM whatsapp_conversations WHERE status = "open" AND sla_started_at IS NOT NULL AND escalation_status = "open"');
            $convs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $now = new DateTime('now', new DateTimeZone('Asia/Dhaka'));
            foreach ($convs as $conv) {
                $result['scanned']++;
                $cid = (int)$conv['id'];
                $slaStart = new DateTime($conv['sla_started_at'], new DateTimeZone('Asia/Dhaka'));
                // If staff replied after sla_start, already resolved — skip
                if (!empty($conv['last_staff_reply_at'])) {
                    $staffReply = new DateTime($conv['last_staff_reply_at'], new DateTimeZone('Asia/Dhaka'));
                    if ($staffReply > $slaStart) continue;
                }
                $elapsedMin = (int)(($now->getTimestamp() - $slaStart->getTimestamp()) / 60);
                $level = $conv['escalation_level'];

                if ($elapsedMin >= self::SLA_EMPLOYEE && $level === 'none') {
                    self::escalateToBranchManager($cid, (int)($conv['branch_id'] ?? 0), $elapsedMin);
                    $result['escalated_to_branch_manager']++;
                } elseif ($elapsedMin >= (self::SLA_EMPLOYEE + self::SLA_BRANCH_MANAGER) && $level === 'branch_manager') {
                    self::escalateToCeo($cid, $elapsedMin);
                    $result['escalated_to_ceo']++;
                } elseif ($elapsedMin >= (self::SLA_EMPLOYEE + self::SLA_BRANCH_MANAGER + self::SLA_CEO) && $level === 'ceo') {
                    self::triggerGlobalAlarm($cid, $elapsedMin);
                    $result['global_alarms']++;
                } elseif ($elapsedMin >= (self::SLA_EMPLOYEE + self::SLA_BRANCH_MANAGER + self::SLA_CEO) && $level === 'none') {
                    // Missed earlier levels (e.g., cron was down) — jump to global
                    self::escalateToBranchManager($cid, (int)($conv['branch_id'] ?? 0), $elapsedMin);
                    self::escalateToCeo($cid, $elapsedMin);
                    self::triggerGlobalAlarm($cid, $elapsedMin);
                    $result['global_alarms']++;
                }
            }
        } catch (\Throwable $e) {
            error_log('monitorAndEscalate error: ' . $e->getMessage());
        }
        return $result;
    }

    private static function escalateToBranchManager(int $conversationId, int $branchId, int $elapsed): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_conversations SET escalation_level = "branch_manager", escalated_to_branch_manager_at = NOW(), updated_at = NOW() WHERE id = :id')->execute([':id' => $conversationId]);
            $pdo->prepare('INSERT INTO whatsapp_sla_events (conversation_id, branch_id, escalation_level, minutes_overdue, message) VALUES (:cid, :bid, "branch_manager_overdue", :min, :msg)')
                ->execute([':cid' => $conversationId, ':bid' => $branchId ?: null, ':min' => $elapsed, ':msg' => 'No counselor reply in 30 min; escalated to Branch Manager']);
            // dashboard_notifications for branch_manager role
            $pdo->prepare('INSERT INTO dashboard_notifications (branch_id, conversation_id, role_name, type, title, message, priority) VALUES (:bid, :cid, "manager", "sla_breach", "SLA Breach — Counselor overdue", :msg, "high")')
                ->execute([':bid' => $branchId ?: null, ':cid' => $conversationId, ':msg' => 'Conversation #' . $conversationId . ' no reply in ' . $elapsed . ' min']);
            // tasks
            try {
                $pdo->prepare('INSERT INTO tasks (title, description, assigned_to, assigned_role, branch_id, conversation_id, priority, status, due_at, created_at, updated_at) VALUES (:t, :d, NULL, "manager", :bid, :cid, "high", "pending", DATE_ADD(NOW(), INTERVAL 20 MINUTE), NOW(), NOW())')
                    ->execute([':t' => 'SLA: Reply to conversation #' . $conversationId, ':d' => 'Counselor overdue ' . $elapsed . ' min', ':bid' => $branchId ?: null, ':cid' => $conversationId]);
            } catch (\Throwable $e) {}
        } catch (\Throwable $e) { error_log('escalateToBranchManager error: ' . $e->getMessage()); }
    }

    private static function escalateToCeo(int $conversationId, int $elapsed): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_conversations SET escalation_level = "ceo", escalated_to_ceo_at = NOW(), updated_at = NOW() WHERE id = :id')->execute([':id' => $conversationId]);
            $pdo->prepare('INSERT INTO whatsapp_sla_events (conversation_id, escalation_level, minutes_overdue, message) VALUES (:cid, "ceo_overdue", :min, :msg)')
                ->execute([':cid' => $conversationId, ':min' => $elapsed, ':msg' => 'No branch manager action in 20 min; escalated to CEO']);
            $pdo->prepare('INSERT INTO dashboard_notifications (conversation_id, role_name, type, title, message, priority) VALUES (:cid, "super_admin", "sla_breach", "SLA Breach — Branch Manager overdue", :msg, "urgent")')
                ->execute([':cid' => $conversationId, ':msg' => 'Conversation #' . $conversationId . ' no branch reply, elapsed ' . $elapsed . ' min']);
            try {
                $pdo->prepare('INSERT INTO tasks (title, description, assigned_role, conversation_id, priority, status, due_at, created_at, updated_at) VALUES (:t, :d, "super_admin", :cid, "urgent", "pending", DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW(), NOW())')
                    ->execute([':t' => 'SLA CEO: Conversation #' . $conversationId, ':d' => 'Branch manager overdue', ':cid' => $conversationId]);
            } catch (\Throwable $e) {}
        } catch (\Throwable $e) { error_log('escalateToCeo error: ' . $e->getMessage()); }
    }

    private static function triggerGlobalAlarm(int $conversationId, int $elapsed): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_conversations SET escalation_level = "global_alarm", global_alarm_at = NOW(), updated_at = NOW() WHERE id = :id')->execute([':id' => $conversationId]);
            $pdo->prepare('INSERT INTO whatsapp_sla_events (conversation_id, escalation_level, minutes_overdue, message) VALUES (:cid, "global_alarm", :min, :msg)')
                ->execute([':cid' => $conversationId, ':min' => $elapsed, ':msg' => 'CEO no action in 10 min; GLOBAL ALARM']);
            $pdo->prepare('INSERT INTO dashboard_alarms (conversation_id, title, message, priority, alarm_status) VALUES (:cid, "GLOBAL ALARM", :msg, "critical", "active")')
                ->execute([':cid' => $conversationId, ':msg' => 'Conversation #' . $conversationId . ' breached all SLA levels, elapsed ' . $elapsed . ' min']);
            $pdo->prepare('INSERT INTO dashboard_notifications (conversation_id, type, title, message, priority) VALUES (:cid, "global_alarm", "GLOBAL ALARM — SLA breached", :msg, "critical")')
                ->execute([':cid' => $conversationId, ':msg' => 'Conversation #' . $conversationId . ' global alarm — immediate action required']);
            // Also notify super_admin/manager via tasks
            try {
                $pdo->prepare('INSERT INTO tasks (title, description, assigned_role, conversation_id, priority, status, due_at, created_at, updated_at) VALUES (:t, :d, "super_admin", :cid, "urgent", "pending", NOW(), NOW(), NOW())')
                    ->execute([':t' => 'GLOBAL ALARM #' . $conversationId, ':d' => 'SLA fully breached', ':cid' => $conversationId]);
            } catch (\Throwable $e) {}
        } catch (\Throwable $e) { error_log('triggerGlobalAlarm error: ' . $e->getMessage()); }
    }
}
