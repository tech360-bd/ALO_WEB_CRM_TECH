<?php
declare(strict_types=1);

/**
 * WhatsAppFollowupService — Schedules and dispatches Day 3/7/14/21/25/30 followups from 01805020100
 *
 * Spec §11: followups come ONLY from 01805020100 (main). If student replied, pause followup.
 * Cron: `whatsapp_followup_sequence.php` runs daily 10:00 Asia/Dhaka, sends due items.
 */
class WhatsAppFollowupService
{
    public const FOLLOWUP_DAYS = [3, 7, 14, 21, 25, 30];
    public const SENDER = '01805020100';

    public static function scheduleForStudent(int $studentId, int $conversationId, string $phone): void
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT id FROM students WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $studentId]);
            if (!$stmt->fetchColumn()) return;

            $normalized = AloWhatsAppNumberService::normalizePhone($phone);
            $display = $normalized ? '0' . substr($normalized, 3) : $phone;

            foreach (self::FOLLOWUP_DAYS as $day) {
                $scheduledAt = date('Y-m-d H:i:s', strtotime("+{$day} days 10:00:00"));
                // Avoid duplicate
                $chk = $pdo->prepare('SELECT id FROM whatsapp_followup_schedule WHERE student_id = :sid AND conversation_id = :cid AND followup_day = :d LIMIT 1');
                $chk->execute([':sid' => $studentId, ':cid' => $conversationId, ':d' => $day]);
                if ($chk->fetchColumn()) continue;

                // Fetch template if exists
                $tmpl = null;
                try {
                    $tstmt = $pdo->prepare('SELECT body, template_name FROM whatsapp_templates WHERE followup_day = :d AND status = "approved" LIMIT 1');
                    $tstmt->execute([':d' => $day]);
                    $tmpl = $tstmt->fetch(PDO::FETCH_ASSOC);
                } catch (\Throwable $e) {}

                $body = $tmpl['body'] ?? self::defaultMessage($day);
                $tname = $tmpl['template_name'] ?? 'alo_followup_day_' . $day;

                $pdo->prepare('INSERT INTO whatsapp_followup_schedule (student_id, conversation_id, phone, official_sender_number, followup_day, scheduled_at, template_name, message_body, status) VALUES (:sid, :cid, :phone, :sender, :d, :at, :tn, :body, "pending")')
                    ->execute([
                        ':sid' => $studentId, ':cid' => $conversationId, ':phone' => $display,
                        ':sender' => self::SENDER, ':d' => $day, ':at' => $scheduledAt, ':tn' => $tname, ':body' => $body,
                    ]);
            }
        } catch (\Throwable $e) {
            error_log('WhatsAppFollowupService schedule error: ' . $e->getMessage());
        }
    }

    public static function defaultMessage(int $day): string
    {
        $map = [
            3  => "Assalamualaikum! This is ALO Education (01805020100). Just checking in — did you review your study options? Reply to talk to a counselor.",
            7  => "Hello from ALO Education! Your application journey matters to us. Reply YES if you'd like a free counseling session.",
            14 => "Hi! ALO Education here. Many students finalize in 2 weeks — let us help you with documents/university shortlist. Reply HELP.",
            21 => "Assalamualaikum — ALO Education follow-up. Haven't heard back. Shall we pause follow-ups or continue? Reply STOP to pause.",
            25 => "Hello! Final reminder from ALO Education. Scholarship intake closes soon. Reply to book your slot.",
            30 => "Last follow-up from ALO Education (01805020100). Reply START to resume anytime. Thank you!",
        ];
        return $map[$day] ?? $map[30];
    }

    /**
     * Called when student sends inbound message — pause remaining pending followups.
     */
    public static function pauseForConversation(int $conversationId): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_followup_schedule SET status = "paused", updated_at = NOW() WHERE conversation_id = :cid AND status = "pending"')
                ->execute([':cid' => $conversationId]);
        } catch (\Throwable $e) {
            error_log('pauseForConversation error: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch due followups (called by cron). Returns count sent.
     */
    public static function dispatchDue(int $limit = 100): int
    {
        $sent = 0;
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT * FROM whatsapp_followup_schedule WHERE status = "pending" AND scheduled_at <= NOW() ORDER BY scheduled_at ASC LIMIT :lim');
            $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $svc = WhatsAppCloudService::fromEnv();
            foreach ($rows as $row) {
                // Skip if student replied after scheduling (has last_student_message_at > scheduled_at)
                try {
                    $cstmt = $pdo->prepare('SELECT last_student_message_at FROM whatsapp_conversations WHERE id = :cid LIMIT 1');
                    $cstmt->execute([':cid' => $row['conversation_id']]);
                    $conv = $cstmt->fetch(PDO::FETCH_ASSOC);
                    if ($conv && !empty($conv['last_student_message_at']) && strtotime($conv['last_student_message_at']) > strtotime($row['scheduled_at'])) {
                        $pdo->prepare('UPDATE whatsapp_followup_schedule SET status = "cancelled", updated_at = NOW() WHERE id = :id')->execute([':id' => $row['id']]);
                        continue;
                    }
                } catch (\Throwable $e) {}

                $body = $row['message_body'] ?? self::defaultMessage((int)$row['followup_day']);
                // Check opt_out
                try {
                    $ostmt = $pdo->prepare('SELECT opt_out FROM whatsapp_contacts WHERE phone = :p LIMIT 1');
                    $ostmt->execute([':p' => $row['phone']]);
                    if ($ostmt->fetchColumn()) {
                        $pdo->prepare('UPDATE whatsapp_followup_schedule SET status = "cancelled", updated_at = NOW() WHERE id = :id')->execute([':id' => $row['id']]);
                        continue;
                    }
                } catch (\Throwable $e) {}

                $res = $svc->sendText($row['phone'], $body, null); // always from main 01805020100 via default PHONE_NUMBER_ID
                if ($res['success']) {
                    $pdo->prepare('UPDATE whatsapp_followup_schedule SET status = "sent", sent_at = NOW(), updated_at = NOW() WHERE id = :id')->execute([':id' => $row['id']]);
                    // Insert into messages as outbound
                    try {
                        $pdo->prepare('INSERT INTO whatsapp_messages (conversation_id, direction, message_type, body, is_ai_generated, official_sender_number, whatsapp_message_id, created_at, updated_at) VALUES (:cid, "outbound", "text", :body, 0, :sender, :wamid, NOW(), NOW())')
                            ->execute([':cid' => $row['conversation_id'], ':body' => $body, ':sender' => self::SENDER, ':wamid' => $res['message_id']]);
                        $pdo->prepare('UPDATE whatsapp_conversations SET last_message = :body, last_message_at = NOW(), updated_at = NOW() WHERE id = :cid')->execute([':body' => $body, ':cid' => $row['conversation_id']]);
                    } catch (\Throwable $e) {}
                    $sent++;
                } else {
                    $pdo->prepare('UPDATE whatsapp_followup_schedule SET status = "failed", error_message = :err, updated_at = NOW() WHERE id = :id')->execute([':id' => $row['id'], ':err' => substr($res['error'] ?? 'send failed', 0, 2000)]);
                }
                // Pace to avoid rate limit
                usleep(200000);
            }
        } catch (\Throwable $e) {
            error_log('dispatchDue error: ' . $e->getMessage());
        }
        return $sent;
    }

    public static function cancelForStudent(int $studentId): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_followup_schedule SET status = "cancelled", updated_at = NOW() WHERE student_id = :sid AND status = "pending"')->execute([':sid' => $studentId]);
        } catch (\Throwable $e) {}
    }
}
