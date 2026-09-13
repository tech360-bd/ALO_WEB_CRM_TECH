<?php
declare(strict_types=1);

/**
 * MessageRouterService — Routes inbound WhatsApp messages to AI, counselor handover, SLA, documents
 *
 * Called by whatsapp-webhook.php after verifying and persisting inbound message.
 */
class MessageRouterService
{
    /**
     * Route an inbound message: creates student if needed, handles AI reply, escalation, followup pause.
     *
     * @param string $fromPhone 018...
     * @param string $profileName
     * @param string $text
     * @param string $waMessageId WAMID
     * @param array $meta webhook metadata (phone_number_id, etc.)
     * @return array{conversation_id:int, student_id:int, ai_replied:bool}
     */
    public static function routeInbound(string $fromPhone, string $profileName, string $text, string $waMessageId, array $meta = []): array
    {
        $normalized = AloWhatsAppNumberService::normalizePhone($fromPhone);
        if ($normalized === null) throw new InvalidArgumentException('Invalid fromPhone ' . $fromPhone);
        $displayPhone = '0' . substr($normalized, 3);
        $inboundNumberPhone = $meta['phone_number_id'] ?? null;
        // Resolve inbound number id (which official number received this)
        $inboundNumberId = null;
        $officialSender = AloWhatsAppNumberService::DEFAULT_SENDER;
        try {
            $pdo = db();
            if ($inboundNumberPhone) {
                $stmt = $pdo->prepare('SELECT id, phone_number FROM alo_whatsapp_numbers WHERE whatsapp_phone_number_id = :pid LIMIT 1');
                $stmt->execute([':pid' => $inboundNumberPhone]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) { $inboundNumberId = (int)$row['id']; $officialSender = $row['phone_number']; }
            }
            // Fallback to main
            if ($inboundNumberId === null) {
                $main = AloWhatsAppNumberService::getMainNumber();
                if ($main) { $inboundNumberId = (int)$main['id']; $officialSender = $main['phone_number']; }
            }
        } catch (\Throwable $e) {}

        // 1. Ensure student
        $studentInfo = StudentAutoCreateService::ensureStudent($displayPhone, $profileName, null, $officialSender);
        $studentId = $studentInfo['student_id'];
        $isNew = $studentInfo['is_new'];

        // 2. Get or create conversation (one open per student)
        $pdo = db();
        $stmt = $pdo->prepare('SELECT id, assigned_to, branch_id, ai_enabled, status FROM whatsapp_conversations WHERE student_id = :sid AND status = "open" LIMIT 1');
        $stmt->execute([':sid' => $studentId]);
        $conv = $stmt->fetch(PDO::FETCH_ASSOC);
        $conversationId = null;
        $hints = [];
        if ($conv) {
            $conversationId = (int)$conv['id'];
            // Update last message
            $pdo->prepare('UPDATE whatsapp_conversations SET last_message = :msg, last_message_at = NOW(), last_student_message_at = NOW(), sla_started_at = COALESCE(sla_started_at, NOW()), updated_at = NOW() WHERE id = :cid')
                ->execute([':msg' => mb_substr($text, 0, 500), ':cid' => $conversationId]);
        } else {
            $pdo->prepare('INSERT INTO whatsapp_conversations (student_id, student_phone, student_name, inbound_number_id, official_sender_number, last_message, last_message_at, last_student_message_at, sla_started_at, status, ai_enabled) VALUES (:sid, :phone, :name, :inb, :off, :msg, NOW(), NOW(), NOW(), "open", 1)')
                ->execute([':sid' => $studentId, ':phone' => $displayPhone, ':name' => $profileName ?: $displayPhone, ':inb' => $inboundNumberId, ':off' => $officialSender, ':msg' => mb_substr($text, 0, 500)]);
            $conversationId = (int)$pdo->lastInsertId();
            // Schedule followups for new conversation (unless already scheduled)
            WhatsAppFollowupService::scheduleForStudent($studentId, $conversationId, $displayPhone);
        }

        // 3. Insert inbound message (idempotency on WAMID)
        try {
            $pdo->prepare('INSERT IGNORE INTO whatsapp_messages (conversation_id, student_id, whatsapp_message_id, direction, message_type, body, official_sender_number, sender_number_id, created_at, updated_at) VALUES (:cid, :sid, :wamid, "inbound", "text", :body, :off, :snd, NOW(), NOW())')
                ->execute([':cid' => $conversationId, ':sid' => $studentId, ':wamid' => $waMessageId, ':body' => $text, ':off' => $officialSender, ':snd' => $inboundNumberId]);
            $msgId = (int)$pdo->lastInsertId();
            if ($msgId === 0) {
                // Duplicate WAMID — idempotent return
                $stmt = $pdo->prepare('SELECT conversation_id FROM whatsapp_messages WHERE whatsapp_message_id = :wamid LIMIT 1');
                $stmt->execute([':wamid' => $waMessageId]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($existing) $conversationId = (int)$existing['conversation_id'];
            }
        } catch (\Throwable $e) {
            // UNIQUE violation => ignore
        }

        // 4. Handle special intents: STOP (opt-out), 24/7, complaint
        $lower = mb_strtolower($text, 'UTF-8');
        if (in_array(trim($lower), ['stop','unsubscribe','pause','cancel'], true)) {
            try {
                $pdo->prepare('INSERT INTO whatsapp_contacts (phone, normalized_phone) VALUES (:p, :n) ON DUPLICATE KEY UPDATE opt_out = 1')->execute([':p' => $displayPhone, ':n' => $normalized]);
                $pdo->prepare('UPDATE whatsapp_contacts SET opt_out = 1 WHERE phone = :p OR normalized_phone = :n')->execute([':p' => $displayPhone, ':n' => $normalized]);
                WhatsAppFollowupService::cancelForStudent($studentId);
            } catch (\Throwable $e) {}
            // Send confirmation
            try {
                $svc = WhatsAppCloudService::fromEnv();
                $svc->sendText($displayPhone, "You have been unsubscribed from ALO Education follow-ups. Reply START to resume. For help call 01805020100.");
            } catch (\Throwable $e) {}
            // Pause followup already done
        } elseif (in_array(trim($lower), ['start','resume','unpause'], true)) {
            try { $pdo->prepare('UPDATE whatsapp_contacts SET opt_out = 0 WHERE phone = :p OR normalized_phone = :n')->execute([':p' => $displayPhone, ':n' => $normalized]); } catch (\Throwable $e) {}
        }

        // Detect 24/7 request
        if (SupportEscalationService::is24x7Request($text)) {
            SupportEscalationService::mark24x7Requested($conversationId);
        }
        if (SupportEscalationService::isComplaint($text)) {
            // Route as complaint via main number (already)
            try {
                $pdo->prepare('UPDATE whatsapp_conversations SET complaint_number_id = :cid, updated_at = NOW() WHERE id = :id')->execute([':cid' => $inboundNumberId, ':id' => $conversationId]);
            } catch (\Throwable $e) {}
        }

        // 5. Pause followups (student replied)
        WhatsAppFollowupService::pauseForConversation($conversationId);
        // 6. SLA start
        WhatsAppSlaService::onStudentMessage($conversationId, null);

        // 7. AI reply if enabled and not handover requested
        $aiReplied = false;
        $shouldAi = true;
        if ($conv && isset($conv['ai_enabled']) && (int)$conv['ai_enabled'] === 0) $shouldAi = false;
        // Check handover flag
        try {
            $hstmt = $pdo->prepare('SELECT handover_requested FROM whatsapp_conversations WHERE id = :id LIMIT 1');
            $hstmt->execute([':id' => $conversationId]);
            if ((int)($hstmt->fetchColumn() ?? 0) === 1) $shouldAi = false;
        } catch (\Throwable $e) {}

        if ($shouldAi && !$isNew) {
            // Only AI reply if not new (new already got welcome) — but also for new we can AI reply after welcome? We'll allow for follow-up question
            // Check office hours — outside office, AI still replies 24/7 per spec (AI is 24/7, SLA only for human)
            $aiReplied = self::maybeAiReply($conversationId, $displayPhone, $text, $officialSender, $studentId);
        } elseif ($shouldAi && $isNew) {
            // For new student, welcome already sent; no immediate AI duplicate needed
        }

        return ['conversation_id' => $conversationId, 'student_id' => $studentId, 'ai_replied' => $aiReplied];
    }

    private static function maybeAiReply(int $conversationId, string $phone, string $text, string $officialSender, int $studentId): bool
    {
        try {
            $apiKey = $_ENV['OPENROUTER_API_KEY'] ?? (defined('OPENROUTER_API_KEY') ? OPENROUTER_API_KEY : '');
            if ($apiKey === '' || $apiKey === 'CHANGE_ME') {
                // No AI configured — leave for human
                return false;
            }
            // Detect handover request: "talk to human", "counselor", "agent"
            $lower = mb_strtolower($text, 'UTF-8');
            $handoverKeywords = ['human', 'counselor', 'agent', 'person', 'representative', 'মানুষ', 'কাউন্সেলর'];
            foreach ($handoverKeywords as $kw) {
                if (str_contains($lower, $kw)) {
                    $pdo = db();
                    $pdo->prepare('UPDATE whatsapp_conversations SET handover_requested = 1, ai_enabled = 0, updated_at = NOW() WHERE id = :id')->execute([':id' => $conversationId]);
                    // Notify
                    try { $pdo->prepare('INSERT INTO dashboard_notifications (conversation_id, type, title, message, priority) VALUES (:cid, "handover_requested", "Handover requested", :msg, "high")')->execute([':cid' => $conversationId, ':msg' => 'Student requested human counselor in conversation #' . $conversationId]); } catch (\Throwable $e) {}
                    // Send handover message
                    $svc = WhatsAppCloudService::fromEnv();
                    $svc->sendText($phone, "Connecting you to a counselor from ALO Education (01805020100). Please wait — we will reply shortly during office hours Sat-Thu 09:00-18:00 (Asia/Dhaka). For urgent 24/7 support, reply URGENT.");
                    return false;
                }
            }

            // Call OpenRouter for reply
            $history = [];
            try {
                $pdo = db();
                $stmt = $pdo->prepare('SELECT direction, body FROM whatsapp_messages WHERE conversation_id = :cid ORDER BY created_at DESC LIMIT 6');
                $stmt->execute([':cid' => $conversationId]);
                $rows = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
                foreach ($rows as $r) {
                    $role = $r['direction'] === 'inbound' ? 'user' : 'assistant';
                    $history[] = ['role' => $role, 'content' => $r['body']];
                }
            } catch (\Throwable $e) {}

            $systemPrompt = 'You are ALO Education WhatsApp AI. Language: reply in same language as user (English/Bangla). Be concise, friendly, helpful about study abroad, applications, documents. Never share COO 24/7 number ' . SupportEscalationService::COO_NUMBER . ' unless user explicitly requests urgent 24/7 support and human approves. Office hours Sat-Thu 09:00-18:00 Asia/Dhaka, Fri closed. If user asks for human, say you will connect to counselor. Keep replies under 300 words.';
            $messages = array_merge([['role' => 'system', 'content' => $systemPrompt]], $history);
            // Ensure last user message is included (if history truncated)
            if (empty($history) || end($history)['content'] !== $text) {
                $messages[] = ['role' => 'user', 'content' => $text];
            }
            $payload = [
                'model' => $_ENV['OPENROUTER_MODEL'] ?? 'meta-llama/llama-3.1-8b-instruct:free',
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 600,
            ];
            $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $apiKey,
                    'Content-Type: application/json',
                    'HTTP-Referer: ' . ($_ENV['OPENROUTER_SITE_URL'] ?? 'https://crm.aloeducation.com'),
                    'X-Title: ' . ($_ENV['OPENROUTER_APP_NAME'] ?? 'ALO Education'),
                ],
                CURLOPT_TIMEOUT => 20,
            ]);
            $resp = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code < 200 || $code >= 300 || $resp === false) return false;
            $j = json_decode($resp, true);
            $reply = trim($j['choices'][0]['message']['content'] ?? '');
            if ($reply === '') return false;

            // Guard: never leak 24/7 number if AI hallucinates it when not requested — filter if not a 24/7 request
            if (str_contains($reply, SupportEscalationService::COO_NUMBER) && !SupportEscalationService::is24x7Request($text)) {
                $reply = str_replace(SupportEscalationService::COO_NUMBER, '01805020100', $reply);
                // Also strip any 24/7 mention if not requested
            }

            $svc = WhatsAppCloudService::fromEnv();
            $res = $svc->sendText($phone, $reply);
            if ($res['success']) {
                $pdo = db();
                $pdo->prepare('INSERT INTO whatsapp_messages (conversation_id, student_id, direction, message_type, body, is_ai_generated, ai_confidence, official_sender_number, whatsapp_message_id, created_at, updated_at) VALUES (:cid, :sid, "outbound", "text", :body, 1, 85, :off, :wamid, NOW(), NOW())')
                    ->execute([':cid' => $conversationId, ':sid' => $studentId, ':body' => $reply, ':off' => $officialSender, ':wamid' => $res['message_id']]);
                $pdo->prepare('UPDATE whatsapp_conversations SET last_message = :msg, last_message_at = NOW(), updated_at = NOW() WHERE id = :cid')
                    ->execute([':msg' => mb_substr($reply, 0, 500), ':cid' => $conversationId]);
                return true;
            }
            return false;
        } catch (\Throwable $e) {
            error_log('maybeAiReply error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Route outbound staff message: inserts message, updates conversation, handles SLA resolve.
     */
    public static function routeOutbound(int $conversationId, int $senderUserId, string $text, string $senderRole = 'counselor'): array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT student_phone, official_sender_number FROM whatsapp_conversations WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $conversationId]);
            $conv = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$conv) return ['success' => false, 'error' => 'Conversation not found'];
            $phone = $conv['student_phone'];
            // Resolve sender number: counselor's assigned employee number or main
            $senderNum = AloWhatsAppNumberService::resolveSender('employee', null, $senderUserId);
            $official = $senderNum['phone_number'] ?? $conv['official_sender_number'] ?? AloWhatsAppNumberService::DEFAULT_SENDER;
            $senderNumberId = $senderNum['id'] ?? null;
            $phoneNumberId = $senderNum['whatsapp_phone_number_id'] ?? null;

            $svc = WhatsAppCloudService::fromEnv();
            $res = $svc->sendText($phone, $text, $phoneNumberId);
            $wamid = $res['message_id'] ?? null;
            // Always persist in CRM even if send failed (per immutable storage), mark status
            $pdo->prepare('INSERT INTO whatsapp_messages (conversation_id, direction, message_type, body, sender_id, sender_role, official_sender_number, sender_number_id, whatsapp_status, whatsapp_message_id, created_at, updated_at) VALUES (:cid, "outbound", "text", :body, :sid, :role, :off, :snid, :st, :wamid, NOW(), NOW())')
                ->execute([
                    ':cid' => $conversationId, ':body' => $text, ':sid' => $senderUserId, ':role' => $senderRole,
                    ':off' => $official, ':snid' => $senderNumberId, ':st' => $res['success'] ? 'sent' : 'failed', ':wamid' => $wamid ?? uniqid('local_', true),
                ]);
            $pdo->prepare('UPDATE whatsapp_conversations SET last_message = :msg, last_message_at = NOW(), last_staff_reply_at = NOW(), updated_at = NOW() WHERE id = :cid')
                ->execute([':msg' => mb_substr($text, 0, 500), ':cid' => $conversationId]);
            WhatsAppSlaService::onStaffReply($conversationId, $senderUserId);
            return ['success' => $res['success'], 'message_id' => $wamid, 'error' => $res['error'] ?? null];
        } catch (\Throwable $e) {
            error_log('routeOutbound error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
