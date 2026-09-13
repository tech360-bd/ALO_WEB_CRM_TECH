<?php
declare(strict_types=1);

/**
 * SupportEscalationService — Handles counselor → branch_manager → CEO handover and 24/7 number sharing
 *
 * Rules:
 *  - 24/7 support number 01805020101 is ONLY shared when student explicitly requests urgent/24x7 support AND counselor approves or SLA reaches global alarm
 *  - Complaints always via 01805020100
 */
class SupportEscalationService
{
    public const COO_NUMBER = '01805020101';

    /**
     * Detect if an inbound message is requesting 24/7 support (keyword match).
     * Bangla + English keywords.
     */
    public static function is24x7Request(string $text): bool
    {
        $lower = mb_strtolower($text, 'UTF-8');
        $keywords = ['24/7', '24x7', 'urgent', 'emergency', 'immediate', 'now', 'asap', 'help urgent', 'coo', '01805020101', '24 hour', 'জরুরি', 'জরুরী', 'এখন', 'তাড়াতাড়ি', 'ইমার্জেন্সি'];
        foreach ($keywords as $kw) {
            if (str_contains($lower, mb_strtolower($kw, 'UTF-8'))) return true;
        }
        // Also detect sentiment "not getting reply" + "need support"
        if (preg_match('/(no\s*reply|not\s*responding|waiting\s*long).*(support|help|manager|ceo)/i', $text)) return true;
        return false;
    }

    public static function isComplaint(string $text): bool
    {
        $lower = mb_strtolower($text, 'UTF-8');
        $keywords = ['complaint', 'complain', 'bad service', 'not happy', 'refund', 'cheat', 'fraud', 'অভিযোগ', 'প্রতারণা', 'খারাপ'];
        foreach ($keywords as $k) {
            if (str_contains($lower, mb_strtolower($k, 'UTF-8'))) return true;
        }
        return false;
    }

    /**
     * Mark conversation as 24/7 requested (sets flag, not yet shared).
     */
    public static function mark24x7Requested(int $conversationId): void
    {
        try {
            $pdo = db();
            $pdo->prepare('UPDATE whatsapp_conversations SET is_24_7_support_requested = 1, support_24_7_requested_at = NOW(), updated_at = NOW() WHERE id = :id')
                ->execute([':id' => $conversationId]);
            // Notify branch manager
            $pdo->prepare('INSERT INTO dashboard_notifications (conversation_id, role_name, type, title, message, priority) VALUES (:cid, "manager", "support_24x7_request", "24/7 Support Requested", "Student requested 24/7 support in conversation #' . $conversationId . '", "urgent")')
                ->execute([':cid' => $conversationId]);
        } catch (\Throwable $e) { error_log('mark24x7Requested error: ' . $e->getMessage()); }
    }

    /**
     * Share 24/7 number with student — ONLY via this centralized method.
     * Inserts outbound message from COO number and sets shared_at.
     *
     * @return bool success
     */
    public static function share24x7Number(int $conversationId, string $studentPhone, ?int $approvedBy = null): bool
    {
        try {
            $pdo = db();
            // Double-check not already shared
            $stmt = $pdo->prepare('SELECT support_24_7_number_shared_at FROM whatsapp_conversations WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $conversationId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && !empty($row['support_24_7_number_shared_at'])) {
                return true; // already shared
            }
            $body = "ALO Education 24/7 Support — you can reach our COO team at " . self::COO_NUMBER . " (available 24/7). For regular queries continue here at 01805020100. Save both numbers. — ALO Education";
            $svc = WhatsAppCloudService::fromEnv();
            // Need COO's whatsapp_phone_number_id — fetch from alo_whatsapp_numbers
            $coo = AloWhatsAppNumberService::getCooNumber();
            $senderId = $coo['whatsapp_phone_number_id'] ?? null;
            $res = $svc->sendText($studentPhone, $body, $senderId);
            if ($res['success']) {
                $pdo->prepare('UPDATE whatsapp_conversations SET support_24_7_number_shared_at = NOW(), updated_at = NOW() WHERE id = :id')->execute([':id' => $conversationId]);
                $pdo->prepare('INSERT INTO whatsapp_messages (conversation_id, direction, message_type, body, official_sender_number, whatsapp_message_id, sender_role, created_at, updated_at) VALUES (:cid, "outbound", "text", :body, :sender, :wamid, :role, NOW(), NOW())')
                    ->execute([':cid' => $conversationId, ':body' => $body, ':sender' => self::COO_NUMBER, ':wamid' => $res['message_id'], ':role' => 'manager']);
                // Audit
                $pdo->prepare('INSERT INTO activities (student_id, type, description) VALUES (NULL, "24x7_number_shared", :desc)')
                    ->execute([':desc' => 'Shared 24/7 number ' . self::COO_NUMBER . ' in conversation #' . $conversationId . ' approved_by=' . ($approvedBy ?? 'auto')]);
                return true;
            }
            error_log('share24x7Number failed: ' . ($res['error'] ?? 'unknown'));
            return false;
        } catch (\Throwable $e) {
            error_log('share24x7Number exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Handover conversation to another employee/branch.
     */
    public static function handover(int $conversationId, int $toUserId, ?int $branchId = null, ?int $actorId = null): bool
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT id FROM users WHERE id = :uid LIMIT 1');
            $stmt->execute([':uid' => $toUserId]);
            if (!$stmt->fetchColumn()) return false;

            $pdo->prepare('UPDATE whatsapp_conversations SET assigned_to = :uid, branch_id = COALESCE(:bid, branch_id), handover_requested = 0, updated_at = NOW() WHERE id = :cid')
                ->execute([':uid' => $toUserId, ':bid' => $branchId, ':cid' => $conversationId]);
            // Notification to new assignee
            $pdo->prepare('INSERT INTO dashboard_notifications (user_id, conversation_id, type, title, message, priority) VALUES (:uid, :cid, "handover", "Conversation handed over", :msg, "high")')
                ->execute([':uid' => $toUserId, ':cid' => $conversationId, ':msg' => 'Conversation #' . $conversationId . ' assigned to you']);
            // SLA reset?
            WhatsAppSlaService::onStaffReply($conversationId, $actorId);
            return true;
        } catch (\Throwable $e) {
            error_log('handover error: ' . $e->getMessage());
            return false;
        }
    }
}
