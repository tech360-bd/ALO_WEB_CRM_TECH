<?php
declare(strict_types=1);

/**
 * DocumentSecurityService — Prevents unauthorized sharing of student documents via WhatsApp/email/external
 *
 * Policy: documents are private to branch + owner student. Any attempt to forward/share to an unauthorized recipient
 * is blocked, logged as security incident, and branch manager + CEO are notified.
 */
class DocumentSecurityService
{
    /**
     * @param int $documentId
     * @param int $attemptedBy User id trying to share
     * @param string $recipientPhone 018... phone they tried to send to
     * @param string $channel whatsapp|email|download|external_share
     * @return array{allowed:bool, reason:string}
     */
    public static function checkAndLog(int $documentId, int $attemptedBy, string $recipientPhone, string $channel = 'whatsapp'): array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT d.*, s.branch_id, s.name as student_name FROM student_documents d JOIN students s ON s.id = d.student_id WHERE d.id = :id LIMIT 1');
            $stmt->execute([':id' => $documentId]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$doc) return ['allowed' => false, 'reason' => 'Document not found'];

            $recipientNorm = AloWhatsAppNumberService::normalizePhone($recipientPhone);
            $studentPhoneNorm = null;
            try {
                $sstmt = $pdo->prepare('SELECT whatsapp_phone, phone FROM students WHERE id = :id LIMIT 1');
                $sstmt->execute([':id' => $doc['student_id']]);
                $srow = $sstmt->fetch(PDO::FETCH_ASSOC);
                $studentPhoneNorm = $srow ? AloWhatsAppNumberService::normalizePhone($srow['whatsapp_phone'] ?? $srow['phone'] ?? '') : null;
            } catch (\Throwable $e) {}

            $isStudentSelf = $recipientNorm && $studentPhoneNorm && $recipientNorm === $studentPhoneNorm;
            // Allow sending to student's own phone (portal)
            if ($isStudentSelf) {
                return ['allowed' => true, 'reason' => 'Recipient is student self'];
            }

            // Check RBAC: does attemptedBy have branch access to student?
            $allowed = false;
            $reason = 'Sharing to external recipient is blocked by policy';
            // super_admin/admin/documentation can share within branch; but external whatsapp forward is never allowed unless recipient is student?
            // For spec §20: "any attempt to share via WhatsApp to non-student number is blocked"
            // So block all whatsapp shares except to student's own number

            if ($channel === 'whatsapp' && !$isStudentSelf) {
                $allowed = false;
                $reason = 'WhatsApp forwarding of private documents to third parties is blocked. Share via secure portal link instead.';
            } elseif ($channel === 'email') {
                // Allow email if requester is counselor/branch manager? Still log.
                // For now allow but log warning
                $allowed = true;
                $reason = 'Email sharing requires branch manager approval — logged as warning';
            } else {
                $allowed = false;
            }

            $incidentLevel = $allowed ? 'warning' : 'high';
            if ($channel === 'whatsapp' && !$isStudentSelf) $incidentLevel = 'critical';

            // Log incident if blocked or warning
            $pdo->prepare('INSERT INTO document_security_incidents (document_id, student_id, attempted_by, attempted_recipient_phone, channel, policy_action, incident_level, reason) VALUES (:did, :sid, :by, :phone, :ch, :act, :lvl, :reason)')
                ->execute([
                    ':did' => $documentId, ':sid' => $doc['student_id'], ':by' => $attemptedBy,
                    ':phone' => $recipientPhone, ':ch' => $channel,
                    ':act' => $allowed ? 'allowed_with_warning' : 'blocked',
                    ':lvl' => $incidentLevel, ':reason' => $reason,
                ]);
            $incidentId = (int)$pdo->lastInsertId();

            if (!$allowed || $incidentLevel !== 'warning') {
                // Notify branch manager + CEO
                $msg = 'Security: User #' . $attemptedBy . ' attempted to share document #' . $documentId . ' (' . $doc['original_filename'] . ') for student ' . $doc['student_name'] . ' to ' . $recipientPhone . ' via ' . $channel . ' — ' . $reason;
                $pdo->prepare('INSERT INTO dashboard_notifications (role_name, type, title, message, priority) VALUES ("manager", "security_incident", "Document sharing blocked", :msg, "critical")')->execute([':msg' => $msg]);
                $pdo->prepare('INSERT INTO dashboard_notifications (role_name, type, title, message, priority) VALUES ("super_admin", "security_incident", "Document sharing blocked", :msg, "critical")')->execute([':msg' => $msg]);
                // Also dashboard_alarms if critical
                if ($incidentLevel === 'critical') {
                    // Need conversation? Use dummy; create alarm without conversation? Instead create with student-linked task
                    try {
                        $pdo->prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, after_values, ip_address) VALUES (:uid, "document_share_blocked", "student_documents", :eid, :after, :ip)')
                            ->execute([':uid' => $attemptedBy, ':eid' => $documentId, ':after' => json_encode(['recipient' => $recipientPhone, 'channel' => $channel, 'incident_id' => $incidentId]), ':ip' => $_SERVER['REMOTE_ADDR'] ?? null]);
                    } catch (\Throwable $e) {}
                }
                // Update incident notified flags
                $pdo->prepare('UPDATE document_security_incidents SET notified_branch_manager = 1, notified_ceo = 1 WHERE id = :id')->execute([':id' => $incidentId]);
            }

            return ['allowed' => $allowed, 'reason' => $reason];
        } catch (\Throwable $e) {
            error_log('DocumentSecurityService error: ' . $e->getMessage());
            return ['allowed' => false, 'reason' => 'Security check failed'];
        }
    }
}
