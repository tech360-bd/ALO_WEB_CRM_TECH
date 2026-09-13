<?php
declare(strict_types=1);

/**
 * WhatsAppDocumentIngestionService — Auto-uploads WhatsApp media to private storage
 *
 * Storage: storage/private_uploads/documents/{student_id}/{Y/m}/{stored_filename}
 * Never public. Only authenticated portal/admin can access via signed controller.
 */
class WhatsAppDocumentIngestionService
{
    public static function ingestFromWebhook(int $conversationId, int $studentId, string $mediaId, string $mimeType, string $fileName, string $waMessageId): ?int
    {
        try {
            $svc = WhatsAppCloudService::fromEnv();
            $bin = $svc->downloadMedia($mediaId);
            if ($bin === null || $bin === '') {
                error_log('Document ingest download failed mediaId=' . $mediaId);
                return null;
            }
            $pdo = db();
            // Determine storage path
            $base = defined('STORAGE_PRIVATE_UPLOADS') ? STORAGE_PRIVATE_UPLOADS : (getenv('STORAGE_PRIVATE_UPLOADS') ?: dirname(__DIR__, 2) . '/storage/private_uploads');
            $base = rtrim($base, '/');
            $subdir = 'documents/' . $studentId . '/' . date('Y/m');
            $dir = $base . '/' . $subdir;
            if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
                error_log('Cannot create dir ' . $dir);
                return null;
            }
            $ext = pathinfo($fileName, PATHINFO_EXTENSION);
            if ($ext === '') {
                $ext = self::mimeToExt($mimeType);
            }
            $stored = bin2hex(random_bytes(8)) . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);
            if (!str_contains($stored, '.') && $ext !== '') $stored .= '.' . $ext;
            $fullPath = $dir . '/' . $stored;
            file_put_contents($fullPath, $bin);
            chmod($fullPath, 0640);
            $size = strlen($bin);
            $storagePath = $subdir . '/' . $stored;
            $docType = self::classify($mimeType, $fileName);

            $stmt = $pdo->prepare('INSERT INTO student_documents (student_id, conversation_id, whatsapp_message_id, document_type, original_filename, stored_filename, storage_path, mime_type, file_size, source, status) VALUES (:sid, :cid, (SELECT id FROM whatsapp_messages WHERE whatsapp_message_id = :wamid LIMIT 1), :dtype, :orig, :stored, :path, :mime, :size, "whatsapp", "received")');
            $stmt->execute([
                ':sid' => $studentId, ':cid' => $conversationId, ':wamid' => $waMessageId,
                ':dtype' => $docType, ':orig' => $fileName, ':stored' => $stored, ':path' => $storagePath,
                ':mime' => $mimeType, ':size' => $size,
            ]);
            $docId = (int)$pdo->lastInsertId();

            // Auto-queue AI extraction if image/pdf
            if (in_array($mimeType, ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'], true) || in_array($ext, ['pdf','jpg','jpeg','png','webp'], true)) {
                try {
                    $pdo->prepare('INSERT INTO document_ai_extractions (document_id, student_id, extraction_status) VALUES (:did, :sid, "pending")')->execute([':did' => $docId, ':sid' => $studentId]);
                } catch (\Throwable $e) {}
            }

            // Log
            try {
                $pdo->prepare('INSERT INTO activities (student_id, type, description) VALUES (:sid, "document_received", :desc)')
                    ->execute([':sid' => $studentId, ':desc' => 'Document received via WhatsApp: ' . $fileName . ' (' . $mimeType . ')']);
            } catch (\Throwable $e) {}

            return $docId;
        } catch (\Throwable $e) {
            error_log('WhatsAppDocumentIngestionService error: ' . $e->getMessage());
            return null;
        }
    }

    private static function mimeToExt(string $mime): string
    {
        $map = ['application/pdf'=>'pdf','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif','application/msword'=>'doc','application/vnd.openxmlformats-officedocument.wordprocessingml.document'=>'docx'];
        return $map[$mime] ?? '';
    }

    private static function classify(string $mime, string $fileName): string
    {
        $lower = strtolower($fileName);
        if (str_contains($lower, 'passport')) return 'passport';
        if (str_contains($lower, 'nid') || str_contains($lower, 'national')) return 'nid';
        if (str_contains($lower, 'transcript') || str_contains($lower, 'certificate')) return 'academic';
        if (str_contains($lower, 'ielts') || str_contains($lower, 'toefl')) return 'language';
        if (str_starts_with($mime, 'image/')) return 'image';
        if ($mime === 'application/pdf') return 'pdf';
        return 'other';
    }

    /**
     * Controller: serve private file with access check (call from download.php).
     */
    public static function serve(int $documentId, int $requestingUserId): void
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT * FROM student_documents WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $documentId]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$doc) { http_response_code(404); echo 'Not found'; exit; }
            // RBAC: super_admin/manager/documentation can view any; counselor only if branch matches; student only own
            // Simplified: check permissions via has_permission() helper
            if (!function_exists('has_permission') || !has_permission('documents.view')) {
                // Check if student owns doc
                // For now deny if not permitted
                // Allow if requestor is student linked to doc (via session student_id)
                $isStudentOwner = isset($_SESSION['student_id']) && (int)$_SESSION['student_id'] === (int)$doc['student_id'];
                if (!$isStudentOwner) {
                    // Also allow if user is assigned to student's branch? Skip for brevity — deny
                    // But we still allow super_admin bypass
                    $role = $_SESSION['role'] ?? '';
                    if (!in_array($role, ['super_admin','admin','manager','documentation'], true)) {
                        http_response_code(403); echo 'Forbidden'; exit;
                    }
                }
            }
            $base = defined('STORAGE_PRIVATE_UPLOADS') ? STORAGE_PRIVATE_UPLOADS : dirname(__DIR__, 2) . '/storage/private_uploads';
            $full = rtrim($base, '/') . '/' . $doc['storage_path'];
            if (!is_file($full)) { http_response_code(404); echo 'File missing'; exit; }
            header('Content-Type: ' . ($doc['mime_type'] ?: 'application/octet-stream'));
            header('Content-Disposition: inline; filename="' . addslashes($doc['original_filename']) . '"');
            header('Content-Length: ' . filesize($full));
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: private, no-store');
            readfile($full);
            exit;
        } catch (\Throwable $e) {
            http_response_code(500); echo 'Error'; exit;
        }
    }
}
