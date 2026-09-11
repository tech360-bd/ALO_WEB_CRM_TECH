<?php
/**
 * Leads — Create page
 *
 * Validates input, generates a CRM ID (ALO-CRM-2026-000001), inserts the
 * lead, writes an activity_log entry and audit log, then redirects to
 * the lead view page.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('leads.create');

$pdo = db();
$errors = [];
$old    = [];

/* Fetch dropdown options */
$counselors = $pdo->query("SELECT id, name FROM users WHERE status='active' AND role IN ('counselor','manager','admin','super_admin') ORDER BY name")->fetchAll();
$statuses  = ['NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED','LOST'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName      = trim((string) ($_POST['full_name'] ?? ''));
    $email         = trim((string) ($_POST['email'] ?? ''));
    $phone         = trim((string) ($_POST['phone'] ?? ''));
    $altPhone      = trim((string) ($_POST['alt_phone'] ?? ''));
    $source        = trim((string) ($_POST['source'] ?? ''));
    $country       = trim((string) ($_POST['country'] ?? ''));
    $course        = trim((string) ($_POST['course'] ?? ''));
    $intake         = trim((string) ($_POST['intake'] ?? ''));
    $budget         = trim((string) ($_POST['budget'] ?? ''));
    $ielts          = trim((string) ($_POST['ielts_score'] ?? ''));
    $notes          = trim((string) ($_POST['notes'] ?? ''));
    $counselorId    = trim((string) ($_POST['counselor_id'] ?? ''));
    $followUpDate   = trim((string) ($_POST['follow_up_date'] ?? ''));

    // Validate
    if (!validate_required($fullName)) {
        $errors[] = 'Full name is required.';
    } elseif (!validate_max($fullName, 150)) {
        $errors[] = 'Full name must be 150 characters or fewer.';
    }
    if ($email !== '' && !validate_email($email)) {
        $errors[] = 'Email address is invalid.';
    }
    if ($phone !== '' && !validate_phone($phone)) {
        $errors[] = 'Phone number is invalid.';
    }
    if ($altPhone !== '' && !validate_phone($altPhone)) {
        $errors[] = 'Alt phone number is invalid.';
    }
    if ($budget !== '' && !is_numeric($budget)) {
        $errors[] = 'Budget must be a number.';
    }
    if ($ielts !== '' && !is_numeric($ielts)) {
        $errors[] = 'IELTS score must be a number.';
    }
    if ($counselorId !== '' && !ctype_digit($counselorId)) {
        $errors[] = 'Counselor selection is invalid.';
    }
    if ($followUpDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $followUpDate)) {
        $errors[] = 'Follow-up date must be YYYY-MM-DD.';
    }

    $old = compact('fullName','email','phone','altPhone','source','country','course','intake','budget','ielts','notes','counselorId','followUpDate');

    if (!$errors) {
        $crmId = generate_crm_id('ALO-CRM');
        $counselorIdVal = ($counselorId !== '') ? (int) $counselorId : null;
        $emailVal       = $email       !== '' ? $email       : null;
        $phoneVal       = $phone       !== '' ? $phone       : null;
        $altPhoneVal    = $altPhone    !== '' ? $altPhone    : null;
        $sourceVal      = $source      !== '' ? $source      : null;
        $countryVal     = $country     !== '' ? $country     : null;
        $courseVal      = $course      !== '' ? $course      : null;
        $intakeVal      = $intake      !== '' ? $intake      : null;
        $budgetVal      = ($budget !== '' && is_numeric($budget)) ? (float) $budget : null;
        $ieltsVal       = ($ielts  !== '' && is_numeric($ielts))  ? (float) $ielts  : null;
        $notesVal       = $notes       !== '' ? $notes       : null;
        $followUpVal    = $followUpDate !== '' ? $followUpDate : null;

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                'INSERT INTO leads
                    (crm_id, full_name, email, phone, alt_phone, source, status,
                     counselor_id, country, course, intake, budget, ielts_score,
                     notes, lead_score, follow_up_date, created_at, updated_at)
                 VALUES
                    (:crm_id, :full_name, :email, :phone, :alt_phone, :source, :status,
                     :counselor_id, :country, :course, :intake, :budget, :ielts_score,
                     :notes, 0, :follow_up_date, NOW(), NOW())'
            );
            $stmt->bindParam(':crm_id',       $crmId);
            $stmt->bindParam(':full_name',    $fullName);
            $stmt->bindParam(':email',        $emailVal);
            $stmt->bindParam(':phone',        $phoneVal);
            $stmt->bindParam(':alt_phone',    $altPhoneVal);
            $stmt->bindParam(':source',       $sourceVal);
            $stmt->bindValue(':status',       'NEW');
            $stmt->bindParam(':counselor_id', $counselorIdVal, $counselorIdVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':country',      $countryVal);
            $stmt->bindParam(':course',        $courseVal);
            $stmt->bindParam(':intake',        $intakeVal);
            $stmt->bindParam(':budget',       $budgetVal);
            $stmt->bindParam(':ielts_score',  $ieltsVal);
            $stmt->bindParam(':notes',         $notesVal);
            $stmt->bindParam(':follow_up_date', $followUpVal);
            $stmt->execute();
            $newId = (int) $pdo->lastInsertId();

            // Activity log
            $act = $pdo->prepare(
                'INSERT INTO activities
                    (user_id, lead_id, crm_id, type, description, created_at)
                 VALUES (:uid, :lid, :crm, :type, :desc, NOW())'
            );
            $userId = (int) ($_SESSION['user_id'] ?? 0);
            $type   = 'lead_created';
            $desc   = 'Lead created: ' . $fullName . ' (' . $crmId . ')';
            $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
            $act->bindParam(':lid',  $newId, PDO::PARAM_INT);
            $act->bindParam(':crm',  $crmId);
            $act->bindParam(':type', $type);
            $act->bindParam(':desc', $desc);
            $act->execute();

            $pdo->commit();

            // Audit log
            log_audit('create', 'leads', $newId, null, [
                'crm_id' => $crmId, 'full_name' => $fullName, 'email' => $emailVal,
                'phone' => $phoneVal, 'source' => $sourceVal, 'counselor_id' => $counselorIdVal,
            ]);

            flash('success', 'Lead created successfully — ' . $crmId);
            redirect('leads/view.php?id=' . $newId);
        } catch (Throwable $ex) {
            try { $pdo->rollBack(); } catch (Throwable $e) {}
            $errors[] = 'Failed to save lead: ' . ($ex->getMessage());
        }
    }
}

render_header('Add Lead');
?>
<div class="toolbar">
  <h1>Add Lead</h1>
  <a href="<?php echo url('leads/index.php'); ?>" class="btn">&larr; Back</a>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error">
    <ul style="margin:0;padding-left:20px"><?php foreach ($errors as $er): ?>
      <li><?php echo e($er); ?></li>
    <?php endforeach; ?></ul>
  </div>
<?php endif; ?>

<form method="post" action="">
  <?php echo csrf_field(); ?>
  <div class="card">
    <div class="card-head"><h3>Lead Information</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Full Name <span class="req">*</span></label>
          <input type="text" name="full_name" maxlength="150" value="<?php echo e($old['fullName'] ?? ''); ?>" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" value="<?php echo e($old['email'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" name="phone" value="<?php echo e($old['phone'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Alt Phone</label>
          <input type="text" name="alt_phone" value="<?php echo e($old['altPhone'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Source</label>
          <input type="text" name="source" list="source-list" value="<?php echo e($old['source'] ?? ''); ?>">
          <datalist id="source-list">
            <option value="Facebook">
            <option value="Instagram">
            <option value="Website">
            <option value="WhatsApp">
            <option value="Referral">
            <option value="Walk-in">
            <option value="Phone Call">
            <option value="Email">
            <option value="Other">
          </datalist>
        </div>
        <div class="form-group">
          <label>Country</label>
          <input type="text" name="country" value="<?php echo e($old['country'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Course</label>
          <input type="text" name="course" value="<?php echo e($old['course'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Intake</label>
          <input type="text" name="intake" placeholder="e.g. Sep 2026" value="<?php echo e($old['intake'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Budget</label>
          <input type="number" step="0.01" name="budget" value="<?php echo e($old['budget'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>IELTS Score</label>
          <input type="number" step="0.5" min="0" max="9" name="ielts_score" value="<?php echo e($old['ielts'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Counselor</label>
          <select name="counselor_id">
            <option value="">— Unassigned —</option>
            <?php foreach ($counselors as $c): ?>
              <option value="<?php echo (int) $c['id']; ?>" <?php if (($old['counselorId'] ?? '') === (string) $c['id']) echo 'selected'; ?>>
                <?php echo e($c['name']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Follow-up Date</label>
          <input type="date" name="follow_up_date" value="<?php echo e($old['followUpDate'] ?? ''); ?>">
        </div>
        <div class="form-group" style="grid-column:1 / -1">
          <label>Notes</label>
          <textarea name="notes"><?php echo e($old['notes'] ?? ''); ?></textarea>
        </div>
      </div>
      <div class="form-actions">
        <a href="<?php echo url('leads/index.php'); ?>" class="btn">Cancel</a>
        <button type="submit" class="btn btn-primary">Create Lead</button>
      </div>
    </div>
  </div>
</form>

<?php render_footer();
