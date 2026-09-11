<?php
/**
 * Students — Edit page
 *
 * Loads a student, accepts POST (with CSRF) updates, logs audit, redirects.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('students.edit');

$pdo       = db();
$studentId = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);
if ($studentId <= 0) {
    flash('error', 'Invalid student ID.');
    redirect('students/index.php');
}

$stmt = $pdo->prepare(
    'SELECT s.*, u.name AS counselor_name
       FROM students s
  LEFT JOIN users u ON u.id = s.counselor_id
      WHERE s.id = :id'
);
$stmt->execute([':id' => $studentId]);
$student = $stmt->fetch();
if (!$student) {
    flash('error', 'Student not found.');
    redirect('students/index.php');
}
$student = is_array($student) ? $student : [];

$counselors = $pdo->query("SELECT id, name FROM users WHERE status='active' AND role IN ('counselor','manager','admin','super_admin') ORDER BY name")->fetchAll();
$statuses   = ['PROSPECT','LEAD','APPLICANT','OFFERED','ENROLLED','GRADUATED','WITHDRAWN','REJECTED'];
$errors     = [];

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

    if (!validate_required($fullName)) $errors[] = 'Full name is required.';
    if ($email !== '' && !validate_email($email)) $errors[] = 'Email is invalid.';
    if ($phone !== '' && !validate_phone($phone)) $errors[] = 'Phone is invalid.';
    if ($guardianPhone !== '' && !validate_phone($guardianPhone)) $errors[] = 'Guardian phone is invalid.';
    if (!in_array($status, $statuses, true)) $errors[] = 'Invalid status.';
    if (!in_array($gender, ['male','female','other','',null], true) && $gender !== '') $errors[] = 'Invalid gender.';
    if ($ieltsScore !== '' && !is_numeric($ieltsScore)) $errors[] = 'IELTS score must be a number.';

    if (!$errors) {
        $nullable  = static fn($v) => $v !== '' ? $v : null;
        $numNull   = static fn($v) => ($v !== '' && is_numeric($v)) ? (float) $v : null;
        $intNull   = static fn($v) => ($v !== '' && ctype_digit($v)) ? (int) $v : null;
        $genderVal = $gender !== '' ? $gender : null;
        $counselorVal = $intNull($counselorId);

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'UPDATE students
                    SET full_name            = :full_name,
                        email                = :email,
                        phone                = :phone,
                        alt_phone            = :alt_phone,
                        date_of_birth        = :dob,
                        gender               = :gender,
                        nationality          = :nationality,
                        passport_number      = :passport_number,
                        passport_expiry      = :passport_expiry,
                        present_address      = :present_address,
                        permanent_address    = :permanent_address,
                        guardian_name        = :guardian_name,
                        guardian_phone       = :guardian_phone,
                        ssc_result           = :ssc_result,
                        hsc_result           = :hsc_result,
                        ielts_score          = :ielts_score,
                        preferred_country    = :preferred_country,
                        preferred_university = :preferred_university,
                        preferred_course     = :preferred_course,
                        preferred_intake     = :preferred_intake,
                        status               = :status,
                        counselor_id         = :counselor_id,
                        updated_at           = NOW()
                  WHERE id = :id'
            );
            $stmt->bindParam(':id',                  $studentId, PDO::PARAM_INT);
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
            $stmt->bindParam(':ielts_score',          $numNull($ieltsScore));
            $stmt->bindParam(':preferred_country',    $nullable($preferredCountry));
            $stmt->bindParam(':preferred_university', $nullable($preferredUniversity));
            $stmt->bindParam(':preferred_course',     $nullable($preferredCourse));
            $stmt->bindParam(':preferred_intake',     $nullable($preferredIntake));
            $stmt->bindParam(':status',               $status);
            $stmt->bindParam(':counselor_id',         $counselorVal, $counselorVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->execute();

            // Activity log
            $act = $pdo->prepare(
                'INSERT INTO activities
                    (user_id, student_id, crm_id, type, description, created_at)
                 VALUES (:uid, :sid, :crm, :type, :desc, NOW())'
            );
            $userId = (int) ($_SESSION['user_id'] ?? 0);
            $type = 'student_updated';
            $desc = 'Student updated: ' . $fullName . ' — status ' . $status;
            $crm  = (string) ($student['crm_id'] ?? '');
            $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
            $act->bindParam(':sid',  $studentId, PDO::PARAM_INT);
            $act->bindParam(':crm',  $crm);
            $act->bindParam(':type', $type);
            $act->bindParam(':desc', $desc);
            $act->execute();

            $pdo->commit();

            log_audit('update', 'students', $studentId, $student, [
                'full_name' => $fullName, 'email' => $nullable($email),
                'status' => $status, 'counselor_id' => $counselorVal,
            ]);

            flash('success', 'Student updated successfully.');
            redirect('students/view.php?id=' . $studentId);
        } catch (Throwable $ex) {
            try { $pdo->rollBack(); } catch (Throwable $e) {}
            $errors[] = 'Failed to save student: ' . $ex->getMessage();
        }
    }

    // On error — re-populate with submitted values
    $student = array_merge($student, [
        'full_name' => $fullName, 'email' => $email, 'phone' => $phone,
        'alt_phone' => $altPhone, 'date_of_birth' => $dob, 'gender' => $gender,
        'nationality' => $nationality, 'passport_number' => $passportNumber,
        'passport_expiry' => $passportExpiry, 'present_address' => $presentAddress,
        'permanent_address' => $permanentAddress, 'guardian_name' => $guardianName,
        'guardian_phone' => $guardianPhone, 'ssc_result' => $sscResult,
        'hsc_result' => $hscResult, 'ielts_score' => $ieltsScore,
        'preferred_country' => $preferredCountry, 'preferred_university' => $preferredUniversity,
        'preferred_course' => $preferredCourse, 'preferred_intake' => $preferredIntake,
        'status' => $status, 'counselor_id' => $counselorId,
    ]);
}

render_header('Edit Student');
?>
<div class="toolbar">
  <h1>Edit Student — <?php echo e($student['full_name'] ?? ''); ?></h1>
  <a href="<?php echo url('students/view.php?id=' . $studentId); ?>" class="btn">&larr; Back</a>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error"><ul style="margin:0;padding-left:20px"><?php foreach ($errors as $er): ?><li><?php echo e($er); ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>

<form method="post" action="">
  <?php echo csrf_field(); ?>
  <input type="hidden" name="id" value="<?php echo (int) $studentId; ?>">

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Personal Information</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Full Name <span class="req">*</span></label><input type="text" name="full_name" maxlength="150" required value="<?php echo e($student['full_name'] ?? ''); ?>"></div>
        <div class="form-group"><label>Email</label><input type="email" name="email" value="<?php echo e($student['email'] ?? ''); ?>"></div>
        <div class="form-group"><label>Phone</label><input type="text" name="phone" value="<?php echo e($student['phone'] ?? ''); ?>"></div>
        <div class="form-group"><label>Alt Phone</label><input type="text" name="alt_phone" value="<?php echo e($student['alt_phone'] ?? ''); ?>"></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" name="date_of_birth" value="<?php echo e($student['date_of_birth'] ?? ''); ?>"></div>
        <div class="form-group">
          <label>Gender</label>
          <select name="gender">
            <option value="">—</option>
            <option value="male"   <?php if (($student['gender'] ?? '') === 'male') echo 'selected'; ?>>Male</option>
            <option value="female" <?php if (($student['gender'] ?? '') === 'female') echo 'selected'; ?>>Female</option>
            <option value="other"  <?php if (($student['gender'] ?? '') === 'other') echo 'selected'; ?>>Other</option>
          </select>
        </div>
        <div class="form-group"><label>Nationality</label><input type="text" name="nationality" value="<?php echo e($student['nationality'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Passport</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Passport Number</label><input type="text" name="passport_number" value="<?php echo e($student['passport_number'] ?? ''); ?>"></div>
        <div class="form-group"><label>Passport Expiry</label><input type="date" name="passport_expiry" value="<?php echo e($student['passport_expiry'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Contact</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group" style="grid-column:1 / -1"><label>Present Address</label><textarea name="present_address"><?php echo e($student['present_address'] ?? ''); ?></textarea></div>
        <div class="form-group" style="grid-column:1 / -1"><label>Permanent Address</label><textarea name="permanent_address"><?php echo e($student['permanent_address'] ?? ''); ?></textarea></div>
        <div class="form-group"><label>Guardian Name</label><input type="text" name="guardian_name" value="<?php echo e($student['guardian_name'] ?? ''); ?>"></div>
        <div class="form-group"><label>Guardian Phone</label><input type="text" name="guardian_phone" value="<?php echo e($student['guardian_phone'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Academic</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>SSC Result</label><input type="text" name="ssc_result" value="<?php echo e($student['ssc_result'] ?? ''); ?>"></div>
        <div class="form-group"><label>HSC Result</label><input type="text" name="hsc_result" value="<?php echo e($student['hsc_result'] ?? ''); ?>"></div>
        <div class="form-group"><label>IELTS Score</label><input type="number" step="0.5" min="0" max="9" name="ielts_score" value="<?php echo e($student['ielts_score'] ?? ''); ?>"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Preferences</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group"><label>Preferred Country</label><input type="text" name="preferred_country" value="<?php echo e($student['preferred_country'] ?? ''); ?>"></div>
        <div class="form-group"><label>Preferred University</label><input type="text" name="preferred_university" value="<?php echo e($student['preferred_university'] ?? ''); ?>"></div>
        <div class="form-group"><label>Preferred Course</label><input type="text" name="preferred_course" value="<?php echo e($student['preferred_course'] ?? ''); ?>"></div>
        <div class="form-group"><label>Preferred Intake</label><input type="text" name="preferred_intake" value="<?php echo e($student['preferred_intake'] ?? ''); ?>"></div>
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
              <option value="<?php echo e($s); ?>" <?php if (($student['status'] ?? 'PROSPECT') === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower($s))); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Counselor</label>
          <select name="counselor_id">
            <option value="">— Unassigned —</option>
            <?php foreach ($counselors as $c): ?>
              <option value="<?php echo (int) $c['id']; ?>" <?php if ((string) ($student['counselor_id'] ?? '') === (string) $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="form-actions">
    <a href="<?php echo url('students/view.php?id=' . $studentId); ?>" class="btn">Cancel</a>
    <button type="submit" class="btn btn-primary">Save Changes</button>
  </div>
</form>

<?php render_footer();
