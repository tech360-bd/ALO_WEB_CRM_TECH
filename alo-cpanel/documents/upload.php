<?php
/**
 * Documents — Upload endpoint (POST)
 *
 * Validates the uploaded file, moves it to uploads/documents/, inserts a
 * documents row, logs audit, and redirects back.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('documents.upload');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('documents/index.php');
}

$studentId     = (int) ($_POST['student_id'] ?? 0);
$applicationId = (int) ($_POST['application_id'] ?? 0);
$documentType  = trim((string) ($_POST['document_type'] ?? ''));
$file          = $_FILES['file'] ?? null;

$allowedTypes = ['PASSPORT','PHOTO','ACADEMIC_CERT','TRANSCRIPT','ENGLISH_CERT','CV','PERSONAL_STATEMENT','RECOMMENDATION','OFFER_LETTER','CAS','VISA','FINANCIAL','OTHER'];

$errors = [];
if ($studentId <= 0 && $applicationId <= 0) $errors[] = 'A student or application is required.';
if (!in_array($documentType, $allowedTypes, true)) $errors[] = 'Invalid document type.';
if (!$file || !is_array($file) || !isset($file['tmp_name'])) $errors[] = 'No file was uploaded.';

if (!$errors) {
    $check = validate_upload($file);
    if (!$check['success']) {
        $errors[] = $check['error'];
    } else {
        $info = $check['info'];
        $ext = $info['ext'];

        /* Ensure upload directory exists */
        $uploadDir = APP_ROOT . '/uploads/documents/';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            $errors[] = 'Failed to create upload directory.';
        } else {
            /* Generate unique filename: <YYYY>/<MM>/<type>_<studentId>_<uniq>.<ext> */
            $yearMonth = date('Y/m');
            $subDir = $uploadDir . $yearMonth . '/';
            if (!is_dir($subDir) && !mkdir($subDir, 0755, true) && !is_dir($subDir)) {
                $errors[] = 'Failed to create month upload directory.';
            } else {
                $safeName = preg_replace('/[^A-Za-z0-9_\-]/', '_', pathinfo($info['name'], PATHINFO_FILENAME));
                $safeName = substr($safeName ?? 'file', 0, 40);
                $unique   = $safeName . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
                $destPath = $subDir . $unique;
                $relPath  = 'uploads/documents/' . $yearMonth . '/' . $unique;

                if (!move_uploaded_file($info['tmp_name'], $destPath)) {
                    $errors[] = 'Failed to move uploaded file.';
                } else {
                    try {
                        $pdo->beginTransaction();
                        $stmt = $pdo->prepare(
                            'INSERT INTO documents
                                (student_id, application_id, document_type, file_name, file_path,
                                 file_size, mime_type, uploaded_by, status, created_at, updated_at)
                             VALUES
                                (:student_id, :application_id, :document_type, :file_name, :file_path,
                                 :file_size, :mime_type, :uploaded_by, "PENDING", NOW(), NOW())'
                        );
                        $userId = (int) ($_SESSION['user_id'] ?? 0);
                        $studentVal = $studentId > 0 ? $studentId : null;
                        $appVal = $applicationId > 0 ? $applicationId : null;
                        $stmt->bindParam(':student_id',    $studentVal, $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
                        $stmt->bindParam(':application_id', $appVal,     $appVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
                        $stmt->bindParam(':document_type', $documentType);
                        $stmt->bindParam(':file_name',     $info['name']);
                        $stmt->bindParam(':file_path',     $relPath);
                        $stmt->bindParam(':file_size',    $info['size'], PDO::PARAM_INT);
                        $stmt->bindParam(':mime_type',     $info['type']);
                        $stmt->bindParam(':uploaded_by',   $userId, PDO::PARAM_INT);
                        $stmt->execute();
                        $docId = (int) $pdo->lastInsertId();

                        /* Activity log */
                        $act = $pdo->prepare(
                            'INSERT INTO activities
                                (user_id, student_id, crm_id, type, description, created_at)
                             VALUES (:uid, :sid, NULL, :type, :desc, NOW())'
                        );
                        $type = 'document_uploaded';
                        $desc = 'Document uploaded: ' . $documentType . ' — ' . $info['name'];
                        $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
                        $act->bindParam(':sid',  $studentVal, $studentVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
                        $act->bindParam(':type', $type);
                        $act->bindParam(':desc', $desc);
                        $act->execute();

                        $pdo->commit();

                        log_audit('create', 'documents', $docId, null, [
                            'student_id' => $studentVal, 'document_type' => $documentType,
                            'file_name' => $info['name'], 'file_path' => $relPath,
                            'file_size' => $info['size'],
                        ]);

                        flash('success', 'Document uploaded.');
                    } catch (Throwable $ex) {
                        try { $pdo->rollBack(); } catch (Throwable $e) {}
                        @unlink($destPath); // remove orphan
                        $errors[] = 'Failed to record document: ' . $ex->getMessage();
                    }
                }
            }
        }
    }
}

if ($errors) {
    flash('error', implode(' ', $errors));
}

$back = $_SERVER['HTTP_REFERER'] ?? url('documents/index.php');
redirect($back);
