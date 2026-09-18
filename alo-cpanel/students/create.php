<?php
/**
 * Students — Create page
 *
 * Collects full personal info, passport, contact, academic, English test,
 * preferences and inserts into the students table.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('students.create');

$pdo = db();
$errors = [];
$old    = [];

$counselors = $pdo->query("SELECT id, name FROM users WHERE status='active' AND role IN ('counselor','manager','admin','super_admin') ORDER BY name")->fetchAll();
$statuses   = ['PROSPECT','LEAD','APPLICANT','OFFERED','ENROLLED','GRADUATED','WITHDRAWN','REJECTED'];
$leadId     = (int) ($_GET['lead_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName            = trim((string) ($_POST['full_name'] ?? ''));
    $email               = trim((string) ($_POST['email'] ?? ''));
    $phone               = trim((string) ($_POST['phone'] ?? ''));
    $altPhone            = trim((string) ($_POST['alt_phone'] ?? ''));
    $dob                 = trim((string) ($_POST['date_of_birth'] ?? ''));
    $gender              = trim((string) ($_POST['gender'] ?? ''));
    $nationality         = trim((string) ($_POST['nationality'] ?? ''));
    $passportNumber      = trim((string) ($_POST['passport_number'] ?? ''));
    $passportExpiry      = trim((string) ($_POST['passport_expiry'] ?? ''));
    $presentAddress      = trim((string) ($_POST['present_address'] ?? ''));
    $permanentAddress    = trim((string) ($_POST['permanent_address'] ?? ''));
    $guardianName        = trim((string) ($_POST['guardian_name'] ?? ''));
    $guardianPhone       = trim((string) ($_POST['guardian_phone'] ?? ''));
    $sscResult           = trim((string) ($_POST['ssc_result'] ?? ''));
    $hscResult           = trim((string) ($_POST['hsc_result'] ?? ''));
    $ieltsScore          = trim((string) ($_POST['ielts_score'] ?? ''));
    $preferredCountry    = trim((string) ($_POST['preferred_country'] ?? ''));
    $preferredUniversity = trim((string) ($_POST['preferred_university'] ?? ''));
    $preferredCourse     = trim((string) ($_POST['preferred_course'] ?? ''));
    $preferredIntake     = trim((string) ($_POST['preferred_intake'] ?? ''));
    $status              = trim((string) ($_POST['status'] ?? 'PROSPECT'));
    $counselorId         = trim((string) ($_POST['counselor_id'] ?? ''));
    $leadIdPost          = (int) ($_POST['lead_id'] ?? 0);

    if (!validate_required($fullName)) $errors[] = 'Full name is required.';
    if ($email !== '' && !validate_email($email)) $errors[] = 'Email is invalid.';
    if ($phone !== '' && !validate_phone($phone)) $errors[] = 'Phone is invalid.';
    if ($guardianPhone !== '' && !validate_phone($guardianPhone)) $errors[] = 'Guardian phone is invalid.';
    if (!in_array($status, $statuses, true)) $errors[] = 'Invalid status.';
    if (!in_array($gender, ['male','female','other','',null], true) && $gender !== '') $errors[] = 'Invalid gender.';
    if ($ieltsScore !== '' && !is_numeric($ieltsScore)) $errors[] = 'IELTS score must be a number.';

    $old = compact('fullName','email','phone','altPhone','dob','gender','nationality','passportNumber','passportExpiry','presentAddress','permanentAddress','guardianName','guardianPhone','sscResult','hscResult','ieltsScore','preferredCountry','preferredUniversity','preferredCourse','preferredIntake','status','counselorId','leadIdPost');

    if (!$errors) {
        $crmId = generate_crm_id('ALO-CRM');

        $nullable = static fn($v) => $v !== '' ? $v : null;
        $numNullable = static fn($v) => ($v !== '' && is_numeric($v)) ? (float) $v : null;
        $intNullable = static fn($v) => ($v !== '' && ctype_digit($v)) ? (int) $v : null;

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'INSERT INTO students
                    (crm_id, lead_id, user_id, full_name, email, phone, alt_phone,
                     date_of_birth, gender, nationality, passport_number, passport_expiry,
                     present_address, permanent_address, guardian_name, guardian_phone,
                     ssc_result, hsc_result, ielts_score,
                     preferred_country, preferred_university, preferred_course, preferred_intake,
                     status, counselor_id, created_at, updated_at)
                 VALUES
                    (:crm_id, :lead_id, NULL, :full_name, :email, :phone, :alt_phone,
                     :dob, :gender, :nationality, :passport_number, :passport_expiry,
                     :present_address, :permanent_address, :guardian_name, :guardian_phone,
                     :ssc_result, :hsc_result, :ielts_score,
                     :preferred_country, :preferred_university, :preferred_course, :preferred_intake,
                     :status, :counselor_id, NOW(), NOW())'
            );
            $leadIdVal = $leadIdPost > 0 ? $leadIdPost : null;
            $genderVal = $gender !== '' ? $gender : null;
            $statusVal = in_array($status, $statuses, true) ? $status : 'PROSPECT';
            $counselorVal = $intNullable($counselorId);

            $stmt->bindParam(':crm_id',               $crmId);
            $stmt->bindParam(':lead_id',              $leadIdVal, $leadIdVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':full_name',            $fullName);
            $stmt->bindParam(':email',                $nullable($email));
            $stmt->bindParam(':phone',                $nullable($phone));
            $stmt->bindParam(':alt_phone',            $nullable($altPhone));
            $stmt->bindParam(':dob',                  $nullable($dob));
            $stmt->bindParam(':gender',               $genderVal);
            $stmt->bindParam(':nationality',          $nullable($nationality));
            $stmt->bindParam(':passport_number',      $nullable($passportNumber));
            $stmt->bindParam(':passport_expiry',      $nullable($passportExpiry));
            $stmt->bindParam(':present_address',      $nullable($presentAddress));
            $stmt->bindParam(':permanent_address',    $nullable($permanentAddress));
            $stmt->bindParam(':guardian_name',        $nullable($guardianName));
            $stmt->bindParam(':guardian_phone',       $nullable($guardianPhone));
            $stmt->bindParam(':ssc_result',           $nullable($sscResult));
            $stmt->bindParam(':hsc_result',           $nullable($hscResult));
            $stmt->bindParam(':ielts_score',          $numNullable($ieltsScore));
            $stmt->bindParam(':preferred_country',    $nullable($preferredCountry));
            $stmt->bindParam(':preferred_university', $nullable($preferredUniversity));
            $stmt->bindParam(':preferred_course',     $nullable($preferredCourse));
            $stmt->bindParam(':preferred_intake',     $nullable($preferredIntake));
            $stmt->bindParam(':status',               $statusVal);
            $stmt->bindParam(':counselor_id',         $counselorVal, $counselorVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->execute();
            $newId = (int) $pdo->lastInsertId();

            // Activity log
            $act = $pdo->prepare(
                'INSERT INTO activities
                    (user_id, student_id, lead_id, crm_id, type, description, created_at)
                 VALUES (:uid, :sid, :lid, :crm, :type, :desc, NOW())'
            );
            $userId = (int) ($_SESSION['user_id'] ?? 0);
            $type = 'student_created';
            $desc = 'Student created: ' . $fullName . ' (' . $crmId . ')';
            $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
            $act->bindParam(':sid',  $newId,  PDO::PARAM_INT);
            $act->bindParam(':lid',  $leadIdVal, $leadIdVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $act->bindParam(':crm',  $crmId);
            $act->bindParam(':type', $type);
            $act->bindParam(':desc', $desc);
            $act->execute();

            $pdo->commit();

            log_audit('create', 'students', $newId, null, ['crm_id' => $crmId, 'full_name' => $fullName, 'email' => $email]);
            flash('success', 'Student created — ' . $crmId);
            redirect('students/view.php?id=' . $newId);
        } catch (Throwable $ex) {
            try { $pdo->rollBack(); } catch (Throwable $e) {}
            $errors[] = 'Failed to save student: ' . $ex->getMessage();
        }
    }
}

render_header('Add Student');
?>
<div class="toolbar">
  <h1>Add Student</h1>
  <a href="<?php echo url('students/index.php'); ?>" class="btn">&larr; Back</a>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error"><ul style="margin:0;padding-left:20px"><?php foreach ($errors as $er): ?><li><?php echo e($er); ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>

<form method="post" action="">
  <?php echo csrf_field(); ?>
  <?php if ($leadId > 0): ?>
    <input type="hidden" name="lead_id" value="<?php echo (int) $leadId; ?>">
  <?php endif; ?>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Personal Information</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Full Name <span class="req">*</span></label><input type="text" name="full_name" maxlength="150" required value="<?php echo e($old['fullName'] ?? ''); ?>"></div>
        <div class="form-group"><label>Email</label><input type="email" name="email" value="<?php echo e($old['email'] ?? ''); ?>"></div>
        <div class="form-group"><label>Phone</label><input type="text" name="phone" value="<?php echo e($old['phone'] ?? ''); ?>"></div>
        <div class="form-group"><label>Alt Phone</label><input type="text" name="alt_phone" value="<?php echo e($old['altPhone'] ?? ''); ?>"></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" name="date_of_birth" value="<?php echo e($old['dob'] ?? ''); ?>"></div>
        <div class="form-group">
          <label>Gender</label>
          <select name="gender">
            <option value="">—</option>
            <option value="male"   <?php if (($old['gender'] ?? '') === 'male') echo 'selected'; ?>>Male</option>
            <option value="female" <?php if (($old['gender'] ?? '') === 'female') echo 'selected'; ?>>Female</option>
            <option value="other"  <?php if (($old['gender'] ?? '') === 'other') echo 'selected'; ?>>Other</option>
          </select>
        </div>
        <div class="form-group"><label>Nationality</label><input type="text" name="nationality" value="<?php echo e($old['nationality'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Passport</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Passport Number</label><input type="text" name="passport_number" value="<?php echo e($old['passportNumber'] ?? ''); ?>"></div>
        <div class="form-group"><label>Passport Expiry</label><input type="date" name="passport_expiry" value="<?php echo e($old['passportExpiry'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Contact</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group" style="grid-column:1 / -1"><label>Present Address</label><textarea name="present_address"><?php echo e($old['presentAddress'] ?? ''); ?></textarea></div>
        <div class="form-group" style="grid-column:1 / -1"><label>Permanent Address</label><textarea name="permanent_address"><?php echo e($old['permanentAddress'] ?? ''); ?></textarea></div>
        <div class="form-group"><label>Guardian Name</label><input type="text" name="guardian_name" value="<?php echo e($old['guardianName'] ?? ''); ?>"></div>
        <div class="form-group"><label>Guardian Phone</label><input type="text" name="guardian_phone" value="<?php echo e($old['guardianPhone'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Academic</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>SSC Result</label><input type="text" name="ssc_result" value="<?php echo e($old['sscResult'] ?? ''); ?>"></div>
        <div class="form-group"><label>HSC Result</label><input type="text" name="hsc_result" value="<?php echo e($old['hscResult'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>English Test</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>IELTS Score</label><input type="number" step="0.5" min="0" max="9" name="ielts_score" value="<?php echo e($old['ieltsScore'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Preferences</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Preferred Country</label><input type="text" name="preferred_country" value="<?php echo e($old['preferredCountry'] ?? ''); ?>"></div>
        <div class="form-group"><label>Preferred University</label><input type="text" name="preferred_university" value="<?php echo e($old['preferredUniversity'] ?? ''); ?>"></div>
        <div class="form-group"><label>Preferred Course</label><input type="text" name="preferred_course" value="<?php echo e($old['preferredCourse'] ?? ''); ?>"></div>
        <div class="form-group"><label>Preferred Intake</label><input type="text" name="preferred_intake" value="<?php echo e($old['preferredIntake'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>CRM</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            <?php foreach ($statuses as $s): ?>
              <option value="<?php echo e($s); ?>" <?php if (($old['status'] ?? 'PROSPECT') === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower($s))); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Counselor</label>
          <select name="counselor_id">
            <option value="">— Unassigned —</option>
            <?php foreach ($counselors as $c): ?>
              <option value="<?php echo (int) $c['id']; ?>" <?php if (($old['counselorId'] ?? '') === (string) $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="form-actions">
    <a href="<?php echo url('students/index.php'); ?>" class="btn">Cancel</a>
    <button type="submit" class="btn btn-primary">Create Student</button>
  </div>
</form>

<?php render_footer();
