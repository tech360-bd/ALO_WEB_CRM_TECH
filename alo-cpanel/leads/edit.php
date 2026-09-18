<?php
/**
 * Leads — Edit page
 *
 * Loads the lead by id, then on POST (with CSRF) updates the leads table,
 * writes an audit log entry and redirects back to the lead view page.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('leads.edit');

$pdo    = db();
$leadId = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);
if ($leadId <= 0) {
    flash('error', 'Invalid lead ID.');
    redirect('leads/index.php');
}

/* Fetch current lead row */
$stmt = $pdo->prepare(
    'SELECT l.*, u.name AS counselor_name
       FROM leads l
  LEFT JOIN users u ON u.id = l.counselor_id
      WHERE l.id = :id'
);
$stmt->execute([':id' => $leadId]);
$lead = $stmt->fetch();
if (!$lead) {
    flash('error', 'Lead not found.');
    redirect('leads/index.php');
}
$lead = is_array($lead) ? $lead : [];

$counselors = $pdo->query("SELECT id, name FROM users WHERE status='active' AND role IN ('counselor','manager','admin','super_admin') ORDER BY name")->fetchAll();
$statuses   = ['NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED','LOST'];
$errors     = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName      = trim((string) ($_POST['full_name'] ?? ''));
    $email         = trim((string) ($_POST['email'] ?? ''));
    $phone         = trim((string) ($_POST['phone'] ?? ''));
    $altPhone      = trim((string) ($_POST['alt_phone'] ?? ''));
    $source        = trim((string) ($_POST['source'] ?? ''));
    $status        = trim((string) ($_POST['status'] ?? 'NEW'));
    $country       = trim((string) ($_POST['country'] ?? ''));
    $course        = trim((string) ($_POST['course'] ?? ''));
    $intake        = trim((string) ($_POST['intake'] ?? ''));
    $budget        = trim((string) ($_POST['budget'] ?? ''));
    $ielts         = trim((string) ($_POST['ielts_score'] ?? ''));
    $notes         = trim((string) ($_POST['notes'] ?? ''));
    $counselorId   = trim((string) ($_POST['counselor_id'] ?? ''));
    $leadScoreRaw  = trim((string) ($_POST['lead_score'] ?? '0'));
    $followUpDate  = trim((string) ($_POST['follow_up_date'] ?? ''));

    if (!validate_required($fullName))      $errors[] = 'Full name is required.';
    elseif (!validate_max($fullName, 150)) $errors[] = 'Full name must be 150 characters or fewer.';
    if ($email !== '' && !validate_email($email))   $errors[] = 'Email address is invalid.';
    if ($phone !== '' && !validate_phone($phone))   $errors[] = 'Phone number is invalid.';
    if ($altPhone !== '' && !validate_phone($altPhone)) $errors[] = 'Alt phone number is invalid.';
    if ($budget !== '' && !is_numeric($budget))     $errors[] = 'Budget must be a number.';
    if ($ielts !== '' && !is_numeric($ielts))        $errors[] = 'IELTS score must be a number.';
    if ($counselorId !== '' && !ctype_digit($counselorId)) $errors[] = 'Counselor selection is invalid.';
    if (!in_array($status, $statuses, true))         $errors[] = 'Invalid status.';
    if ($followUpDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $followUpDate)) {
        $errors[] = 'Follow-up date must be YYYY-MM-DD.';
    }

    if (!$errors) {
        $nullable  = static fn($v) => $v !== '' ? $v : null;
        $numNull   = static fn($v) => ($v !== '' && is_numeric($v)) ? (float) $v : null;
        $intNull   = static fn($v) => ($v !== '' && ctype_digit($v)) ? (int) $v : null;
        $scoreVal  = ($leadScoreRaw !== '' && is_numeric($leadScoreRaw)) ? (int) $leadScoreRaw : (int) ($lead['lead_score'] ?? 0);
        $followVal = $nullable($followUpDate);

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                'UPDATE leads
                    SET full_name      = :full_name,
                        email          = :email,
                        phone          = :phone,
                        alt_phone      = :alt_phone,
                        source         = :source,
                        status         = :status,
                        counselor_id   = :counselor_id,
                        country        = :country,
                        course          = :course,
                        intake          = :intake,
                        budget          = :budget,
                        ielts_score     = :ielts_score,
                        notes           = :notes,
                        lead_score      = :lead_score,
                        follow_up_date  = :follow_up_date,
                        updated_at      = NOW()
                  WHERE id = :id'
            );
            $counselorVal = $intNull($counselorId);
            $stmt->bindParam(':id',            $leadId, PDO::PARAM_INT);
            $stmt->bindParam(':full_name',     $fullName);
            $stmt->bindParam(':email',         $nullable($email));
            $stmt->bindParam(':phone',         $nullable($phone));
            $stmt->bindParam(':alt_phone',     $nullable($altPhone));
            $stmt->bindParam(':source',        $nullable($source));
            $stmt->bindParam(':status',        $status);
            $stmt->bindParam(':counselor_id',  $counselorVal, $counselorVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':country',       $nullable($country));
            $stmt->bindParam(':course',         $nullable($course));
            $stmt->bindParam(':intake',         $nullable($intake));
            $stmt->bindParam(':budget',         $numNull($budget));
            $stmt->bindParam(':ielts_score',   $numNull($ielts));
            $stmt->bindParam(':notes',          $nullable($notes));
            $stmt->bindParam(':lead_score',     $scoreVal, PDO::PARAM_INT);
            $stmt->bindParam(':follow_up_date', $followVal);
            $stmt->execute();

            // Activity log
            $act = $pdo->prepare(
                'INSERT INTO activities
                    (user_id, lead_id, crm_id, type, description, created_at)
                 VALUES (:uid, :lid, :crm, :type, :desc, NOW())'
            );
            $userId = (int) ($_SESSION['user_id'] ?? 0);
            $type   = 'lead_updated';
            $desc   = 'Lead updated: ' . $fullName . ' — status ' . $status;
            $crm    = (string) ($lead['crm_id'] ?? '');
            $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
            $act->bindParam(':lid',  $leadId, PDO::PARAM_INT);
            $act->bindParam(':crm',  $crm);
            $act->bindParam(':type', $type);
            $act->bindParam(':desc', $desc);
            $act->execute();

            $pdo->commit();

            log_audit('update', 'leads', $leadId, $lead, [
                'full_name' => $fullName, 'email' => $nullable($email),
                'phone' => $nullable($phone), 'status' => $status,
                'counselor_id' => $counselorVal, 'lead_score' => $scoreVal,
            ]);

            flash('success', 'Lead updated successfully.');
            redirect('leads/view.php?id=' . $leadId);
        } catch (Throwable $ex) {
            try { $pdo->rollBack(); } catch (Throwable $e) {}
            $errors[] = 'Failed to save lead: ' . $ex->getMessage();
        }
    }

    // On error, re-populate the form with submitted values
    $lead = array_merge($lead, [
        'full_name'      => $fullName,
        'email'          => $email,
        'phone'          => $phone,
        'alt_phone'      => $altPhone,
        'source'         => $source,
        'status'         => $status,
        'country'        => $country,
        'course'         => $course,
        'intake'         => $intake,
        'budget'         => $budget,
        'ielts_score'    => $ielts,
        'notes'          => $notes,
        'counselor_id'   => $counselorId,
        'lead_score'     => $leadScoreRaw,
        'follow_up_date' => $followUpDate,
    ]);
}

render_header('Edit Lead');
?>
<div class="toolbar">
  <h1>Edit Lead — <?php echo e($lead['full_name'] ?? ''); ?></h1>
  <a href="<?php echo url('leads/view.php?id=' . $leadId); ?>" class="btn">&larr; Back</a>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error"><ul style="margin:0;padding-left:20px"><?php foreach ($errors as $er): ?><li><?php echo e($er); ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>

<form method="post" action="">
  <?php echo csrf_field(); ?>
  <input type="hidden" name="id" value="<?php echo (int) $leadId; ?>">
  <div class="card">
    <div class="card-head"><h3>Lead Information</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Full Name <span class="req">*</span></label><input type="text" name="full_name" maxlength="150" required value="<?php echo e($lead['full_name'] ?? ''); ?>"></div>
        <div class="form-group"><label>Email</label><input type="email" name="email" value="<?php echo e($lead['email'] ?? ''); ?>"></div>
        <div class="form-group"><label>Phone</label><input type="text" name="phone" value="<?php echo e($lead['phone'] ?? ''); ?>"></div>
        <div class="form-group"><label>Alt Phone</label><input type="text" name="alt_phone" value="<?php echo e($lead['alt_phone'] ?? ''); ?>"></div>
        <div class="form-group">
          <label>Source</label>
          <input type="text" name="source" list="source-list" value="<?php echo e($lead['source'] ?? ''); ?>">
          <datalist id="source-list">
            <option value="Facebook"><option value="Instagram"><option value="Website">
            <option value="WhatsApp"><option value="Referral"><option value="Walk-in">
            <option value="Phone Call"><option value="Email"><option value="Other">
          </datalist>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            <?php foreach ($statuses as $s): ?>
              <option value="<?php echo e($s); ?>" <?php if (($lead['status'] ?? 'NEW') === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower($s))); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group"><label>Country</label><input type="text" name="country" value="<?php echo e($lead['country'] ?? ''); ?>"></div>
        <div class="form-group"><label>Course</label><input type="text" name="course" value="<?php echo e($lead['course'] ?? ''); ?>"></div>
        <div class="form-group"><label>Intake</label><input type="text" name="intake" placeholder="e.g. Sep 2026" value="<?php echo e($lead['intake'] ?? ''); ?>"></div>
        <div class="form-group"><label>Budget</label><input type="number" step="0.01" name="budget" value="<?php echo e($lead['budget'] ?? ''); ?>"></div>
        <div class="form-group"><label>IELTS Score</label><input type="number" step="0.5" min="0" max="9" name="ielts_score" value="<?php echo e($lead['ielts_score'] ?? ''); ?>"></div>
        <div class="form-group"><label>Lead Score</label><input type="number" step="1" min="0" max="100" name="lead_score" value="<?php echo e((string) ($lead['lead_score'] ?? 0)); ?>"></div>
        <div class="form-group">
          <label>Counselor</label>
          <select name="counselor_id">
            <option value="">— Unassigned —</option>
            <?php foreach ($counselors as $c): ?>
              <option value="<?php echo (int) $c['id']; ?>" <?php if ((string) ($lead['counselor_id'] ?? '') === (string) $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group"><label>Follow-up Date</label><input type="date" name="follow_up_date" value="<?php echo e($lead['follow_up_date'] ?? ''); ?>"></div>
        <div class="form-group" style="grid-column:1 / -1">
          <label>Notes</label>
          <textarea name="notes"><?php echo e($lead['notes'] ?? ''); ?></textarea>
        </div>
      </div>
      <div class="form-actions">
        <a href="<?php echo url('leads/view.php?id=' . $leadId); ?>" class="btn">Cancel</a>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </div>
  </div>
</form>

<?php render_footer();
