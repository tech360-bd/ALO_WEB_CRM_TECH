<?php
/**
 * Leads — Convert to Student
 *
 * On POST (with CSRF):
 *   - Validates lead_id
 *   - Creates a new student record (copying key fields from the lead) with a
 *     fresh CRM ID (ALO-CRM-YYYY-NNNNNN)
 *   - Sets the lead status to ENROLLED
 *   - Logs activity + audit trail
 *   - Redirects to the student view page
 *
 * This endpoint supports both form-POST (CSRF token in $_POST) and AJAX (CSRF
 * token in X-CSRF-Token header). The former is the default.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('students.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('leads/index.php');
}

$leadId = (int) ($_POST['lead_id'] ?? 0);
if ($leadId <= 0) {
    flash('error', 'Invalid lead ID.');
    redirect('leads/index.php');
}

/* Fetch the lead */
$stmt = $pdo->prepare('SELECT * FROM leads WHERE id = :id');
$stmt->execute([':id' => $leadId]);
$lead = $stmt->fetch();
if (!$lead) {
    flash('error', 'Lead not found.');
    redirect('leads/index.php');
}
$lead = is_array($lead) ? $lead : [];

/* If already converted — check */
if (!empty($lead['status']) && $lead['status'] === 'ENROLLED') {
    /* Find the student and redirect there */
    $chk = $pdo->prepare('SELECT id FROM students WHERE lead_id = :lid ORDER BY id DESC LIMIT 1');
    $chk->execute([':lid' => $leadId]);
    $exId = $chk->fetchColumn();
    if ($exId) {
        flash('warning', 'This lead has already been converted.');
        redirect('students/view.php?id=' . (int) $exId);
    }
}

try {
    $pdo->beginTransaction();

    $crmId = generate_crm_id('ALO-CRM');
    $fullName    = (string) ($lead['full_name'] ?? '');
    $email       = ($lead['email'] ?? null) ?: null;
    $phone       = ($lead['phone'] ?? null) ?: null;
    $altPhone    = ($lead['alt_phone'] ?? null) ?: null;
    $country     = ($lead['country'] ?? null) ?: null;
    $course      = ($lead['course'] ?? null) ?: null;
    $intake      = ($lead['intake'] ?? null) ?: null;
    $ielts       = ($lead['ielts_score'] !== null && $lead['ielts_score'] !== '') ? (float) $lead['ielts_score'] : null;
    $counselorId = ($lead['counselor_id'] ?? null) ? (int) $lead['counselor_id'] : null;
    $notes       = $lead['notes'] ?? null;

    $ins = $pdo->prepare(
        'INSERT INTO students
            (crm_id, lead_id, user_id, full_name, email, phone, alt_phone,
             ielts_score, preferred_country, preferred_course, preferred_intake,
             status, counselor_id, created_at, updated_at)
         VALUES
            (:crm_id, :lead_id, NULL, :full_name, :email, :phone, :alt_phone,
             :ielts, :country, :course, :intake,
             :status, :counselor_id, NOW(), NOW())'
    );
    $studentStatus = 'ENROLLED';
    $ins->bindParam(':crm_id',      $crmId);
    $ins->bindParam(':lead_id',     $leadId, PDO::PARAM_INT);
    $ins->bindParam(':full_name',   $fullName);
    $ins->bindParam(':email',       $email);
    $ins->bindParam(':phone',       $phone);
    $ins->bindParam(':alt_phone',   $altPhone);
    $ins->bindParam(':ielts',       $ielts);
    $ins->bindParam(':country',    $country);
    $ins->bindParam(':course',      $course);
    $ins->bindParam(':intake',      $intake);
    $ins->bindParam(':status',      $studentStatus);
    $ins->bindParam(':counselor_id', $counselorId, $counselorId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $ins->execute();
    $studentId = (int) $pdo->lastInsertId();

    /* Update lead status to ENROLLED */
    $upd = $pdo->prepare("UPDATE leads SET status = 'ENROLLED', updated_at = NOW() WHERE id = :id");
    $upd->execute([':id' => $leadId]);

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, student_id, lead_id, crm_id, type, description, created_at)
         VALUES (:uid, :sid, :lid, :crm, :type, :desc, NOW())'
    );
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $type   = 'lead_converted';
    $desc   = 'Lead converted to Student: ' . $fullName . ' (' . $crmId . ')';
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':sid',  $studentId, PDO::PARAM_INT);
    $act->bindParam(':lid',  $leadId, PDO::PARAM_INT);
    $act->bindParam(':crm',  $crmId);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('convert', 'leads', $leadId, $lead, [
        'status' => 'ENROLLED', 'student_id' => $studentId, 'crm_id' => $crmId,
    ]);
    log_audit('create', 'students', $studentId, null, [
        'crm_id' => $crmId, 'full_name' => $fullName, 'lead_id' => $leadId,
    ]);

    /* Notify the assigned counselor (if any) */
    if ($counselorId > 0) {
        send_notification(
            $counselorId,
            'Lead converted to Student',
            'Lead ' . $fullName . ' was converted to a student (' . $crmId . ').',
            'success',
            'students/view.php?id=' . $studentId
        );
    }

    flash('success', 'Lead converted to student — ' . $crmId);
    redirect('students/view.php?id=' . $studentId);
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to convert lead: ' . $ex->getMessage());
    redirect('leads/view.php?id=' . $leadId);
}
