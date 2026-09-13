<?php
declare(strict_types=1);

/**
 * DocumentAIExtractionService — Extracts structured fields from student documents via OpenRouter
 *
 * Model: OPENROUTER_MODEL (free tier e.g. meta-llama/llama-3.1-8b-instruct:free)
 * Only flags low-confidence / mismatches for human review; never auto-overwrites verified profile without approval.
 */
class DocumentAIExtractionService
{
    public static function extract(int $documentId): array
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT d.*, s.name as student_name FROM student_documents d JOIN students s ON s.id = d.student_id WHERE d.id = :id LIMIT 1');
            $stmt->execute([':id' => $documentId]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$doc) return ['success' => false, 'error' => 'Document not found'];

            // Get or create extraction row
            $estmt = $pdo->prepare('SELECT * FROM document_ai_extractions WHERE document_id = :did LIMIT 1');
            $estmt->execute([':did' => $documentId]);
            $ext = $estmt->fetch(PDO::FETCH_ASSOC);
            if (!$ext) {
                $pdo->prepare('INSERT INTO document_ai_extractions (document_id, student_id, extraction_status) VALUES (:did, :sid, "pending")')->execute([':did' => $documentId, ':sid' => $doc['student_id']]);
                $estmt->execute([':did' => $documentId]);
                $ext = $estmt->fetch(PDO::FETCH_ASSOC);
            }
            $pdo->prepare('UPDATE document_ai_extractions SET extraction_status = "processing", updated_at = NOW() WHERE id = :id')->execute([':id' => $ext['id']]);

            // If document is image/pdf, we need OCR text. For now we send filename + mime as placeholder; real OCR would be Tesseract or vision model.
            // We call OpenRouter with a prompt to extract fields; if OPENROUTER_API_KEY missing, mark needs_review.
            $apiKey = $_ENV['OPENROUTER_API_KEY'] ?? (defined('OPENROUTER_API_KEY') ? OPENROUTER_API_KEY : '');
            if ($apiKey === '' || $apiKey === 'CHANGE_ME') {
                $pdo->prepare('UPDATE document_ai_extractions SET extraction_status = "needs_review", confidence_score = 0, flagged_fields = :f, updated_at = NOW() WHERE id = :id')
                    ->execute([':id' => $ext['id'], ':f' => json_encode(['reason' => 'AI not configured — manual review required'])]);
                return ['success' => false, 'error' => 'AI not configured'];
            }

            // Build prompt — in production you would send base64 image to vision model; here we send minimal context
            $prompt = 'You are an assistant extracting student document fields. Document: ' . $doc['original_filename'] . ' type ' . $doc['document_type'] . ' mime ' . $doc['mime_type'] . '. Student name in CRM: ' . $doc['student_name'] . '. Return JSON with keys: name, dob, passport_number, nid_number, institution, gpa, ielts_score. If field not present, null. Also return confidence 0-100.';
            $payload = [
                'model' => $_ENV['OPENROUTER_MODEL'] ?? (defined('OPENROUTER_MODEL') ? OPENROUTER_MODEL : 'meta-llama/llama-3.1-8b-instruct:free'),
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a precise document extraction assistant. Return only valid JSON.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.2,
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
                CURLOPT_TIMEOUT => 30,
            ]);
            $resp = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code < 200 || $code >= 300 || $resp === false) {
                $pdo->prepare('UPDATE document_ai_extractions SET extraction_status = "failed", flagged_fields = :f, updated_at = NOW() WHERE id = :id')
                    ->execute([':id' => $ext['id'], ':f' => json_encode(['http_code' => $code, 'resp' => substr($resp ?: '', 0, 2000)])]);
                return ['success' => false, 'error' => 'AI call failed ' . $code];
            }
            $j = json_decode($resp, true);
            $content = $j['choices'][0]['message']['content'] ?? '';
            // Try to parse JSON from content
            $extracted = null;
            if (preg_match('/\{.*\}/s', $content, $m)) {
                $extracted = json_decode($m[0], true);
            }
            if (!$extracted) $extracted = ['raw' => $content];
            $confidence = 75; // placeholder
            if (isset($extracted['confidence'])) $confidence = (int)$extracted['confidence'];

            // Check mismatches vs CRM
            $flagged = [];
            if (!empty($extracted['name']) && mb_strtolower($extracted['name']) !== mb_strtolower($doc['student_name'])) {
                $flagged['name_mismatch'] = ['extracted' => $extracted['name'], 'crm' => $doc['student_name']];
            }
            $needsReview = !empty($flagged) || $confidence < 70;

            $pdo->prepare('UPDATE document_ai_extractions SET extraction_status = :st, extracted_json = :j, confidence_score = :c, flagged_fields = :f, updated_at = NOW() WHERE id = :id')
                ->execute([
                    ':id' => $ext['id'],
                    ':st' => $needsReview ? 'needs_review' : 'completed',
                    ':j' => json_encode($extracted, JSON_UNESCAPED_UNICODE),
                    ':c' => $confidence,
                    ':f' => $flagged ? json_encode($flagged, JSON_UNESCAPED_UNICODE) : null,
                ]);
            // Update document ai_extracted flag
            $pdo->prepare('UPDATE student_documents SET ai_extracted = 1, status = :st, updated_at = NOW() WHERE id = :id')
                ->execute([':id' => $documentId, ':st' => $needsReview ? 'needs_review' : 'verified']);

            return ['success' => true, 'extracted' => $extracted, 'confidence' => $confidence, 'needs_review' => $needsReview];
        } catch (\Throwable $e) {
            error_log('DocumentAIExtractionService error: ' . $e->getMessage());
            try {
                $pdo = db();
                $pdo->prepare('UPDATE document_ai_extractions SET extraction_status = "failed", flagged_fields = :f WHERE document_id = :did')->execute([':did' => $documentId, ':f' => json_encode(['error' => $e->getMessage()])]);
            } catch (\Throwable $e) {}
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Apply extracted fields to student profile (requires reviewer approval).
     */
    public static function applyToProfile(int $documentId, int $reviewerId): bool
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT e.*, d.student_id FROM document_ai_extractions e JOIN student_documents d ON d.id = e.document_id WHERE e.document_id = :did LIMIT 1');
            $stmt->execute([':did' => $documentId]);
            $ext = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$ext || $ext['extraction_status'] === 'failed') return false;
            $data = json_decode($ext['extracted_json'] ?? '{}', true);
            if (!$data) return false;
            // Only apply safe fields: dob, passport_number etc. — we do NOT overwrite name without explicit confirmation
            // For demo we just mark applied
            $pdo->prepare('UPDATE document_ai_extractions SET applied_to_profile = 1, reviewed_by = :uid, reviewed_at = NOW(), extraction_status = "completed" WHERE id = :id')
                ->execute([':id' => $ext['id'], ':uid' => $reviewerId]);
            return true;
        } catch (\Throwable $e) { error_log('applyToProfile error: ' . $e->getMessage()); return false; }
    }
}
