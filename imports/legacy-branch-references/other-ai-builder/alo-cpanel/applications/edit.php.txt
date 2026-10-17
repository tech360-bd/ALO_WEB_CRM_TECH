<?php
/**
 * Applications — Edit page
 *
 * Loads an application, accepts POST (with CSRF), updates, logs audit,
 * redirects back to either the application list or student view.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('applications.edit');

$pdo  = db();
$appId = (int) ($_GET['id'] ?? $_POST['id'] ?? 0);
if ($appId <= 0) {
    flash('error', 'Invalid application ID.');
    redirect('applications/index.php');
}

$stmt = $pdo->prepare(
    'SELECT a.*, s.full_name AS student_name, s.crm_id AS student_crm_id
       FROM applications a
  LEFT JOIN students s ON s.id = a.student_id
      WHERE a.id = :id'
);
$stmt->execute([':id' => $appId]);
$application = $stmt->fetch();
if (!$application) {
    flash('error', 'Application not found.');
    redirect('applications/index.php');
}
$application = is_array($application) ? $application : [];

$students     = $pdo->query("SELECT id, crm_id, full_name FROM students ORDER BY full_name")->fetchAll();
$universities = $pdo->query("SELECT id, name FROM universities WHERE status='active' ORDER BY name")->fetchAll();
$statuses     = ['DRAFT','SUBMITTED','UNDER_REVIEW','CONDITIONAL_OFFER','UNCONDITIONAL_OFFER','CAS_PENDING','CAS_ISSUED','VISA_PENDING','VISA_GRANTED','VISA_REFUSED','ENROLLED','WITHDRAWN'];
$errors       = [];

/* Pre-fetch courses for current university */
$selectedUni = (int) ($application['university_id'] ?? 0);
$courses = [];
if ($selectedUni > 0) {
    $cs = $pdo->prepare('SELECT id, name FROM courses WHERE university_id = :uid AND status = "active" ORDER BY name');
    $cs->execute([':uid' => $selectedUni]);
    $courses = $cs->fetchAll();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $studentId    = (int) ($_POST['student_id']    ?? 0);
    $universityId = (int) ($_POST['university_id'] ?? 0);
    $courseId     = (int) ($_POST['course_id']     ?? 0);
    $intake       = trim((string) ($_POST['intake'] ?? ''));
    $status       = trim((string) ($_POST['status'] ?? 'DRAFT'));
    $notes        = trim((string) ($_POST['notes'] ?? ''));
    $appDate      = trim((string) ($_POST['application_date'] ?? date('Y-m-d')));
    $refNum       = trim((string) ($_POST['reference_number'] ?? ''));
    $offerDate    = trim((string) ($_POST['offer_date'] ?? ''));
    $casDate      = trim((string) ($_POST['cas_date'] ?? ''));
    $visaDate     = trim((string) ($_POST['visa_date'] ?? ''));

    if ($studentId <= 0)    $errors[] = 'Student is required.';
    if ($universityId <= 0)  $errors[] = 'University is required.';
    if (!in_array($status, $statuses, true)) $errors[] = 'Invalid status.';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $appDate)) $errors[] = 'Application date must be YYYY-MM-DD.';

    if (!$errors) {
        $nullable = static fn($v) => $v !== '' ? $v : null;

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'UPDATE applications
                    SET student_id       = :student_id,
                        university_id    = :university_id,
                        course_id        = :course_id,
                        intake           = :intake,
                        application_date = :application_date,
                        status           = :status,
                        reference_number = :reference_number,
                        offer_date       = :offer_date,
                        cas_date         = :cas_date,
                        visa_date        = :visa_date,
                        notes            = :notes,
                        updated_at       = NOW()
                  WHERE id = :id'
            );
            $stmt->bindParam(':id',               $appId, PDO::PARAM_INT);
            $stmt->bindParam(':student_id',       $studentId, PDO::PARAM_INT);
            $stmt->bindParam(':university_id',    $universityId, PDO::PARAM_INT);
            $stmt->bindParam(':course_id',        $courseId > 0 ? $courseId : null, $courseId > 0 ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmt->bindParam(':intake',           $nullable($intake));
            $stmt->bindParam(':application_date', $appDate);
            $stmt->bindParam(':status',           $status);
            $stmt->bindParam(':reference_number', $nullable($refNum));
            $stmt->bindParam(':offer_date',       $nullable($offerDate));
            $stmt->bindParam(':cas_date',         $nullable($casDate));
            $stmt->bindParam(':visa_date',        $nullable($visaDate));
            $stmt->bindParam(':notes',            $nullable($notes));
            $stmt->execute();

            $act = $pdo->prepare(
                'INSERT INTO activities
                    (user_id, student_id, crm_id, type, description, created_at)
                 VALUES (:uid, :sid, :crm, :type, :desc, NOW())'
            );
            $userId = (int) ($_SESSION['user_id'] ?? 0);
            $type = 'application_updated';
            $desc = 'Application updated: ' . ($application['crm_id'] ?? '') . ' — status ' . $status;
            $crm  = (string) ($application['crm_id'] ?? '');
            $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
            $act->bindParam(':sid',  $studentId, PDO::PARAM_INT);
            $act->bindParam(':crm',  $crm);
            $act->bindParam(':type', $type);
            $act->bindParam(':desc', $desc);
            $act->execute();

            $pdo->commit();

            log_audit('update', 'applications', $appId, $application, [
                'student_id' => $studentId, 'university_id' => $universityId,
                'course_id' => $courseId, 'status' => $status,
            ]);

            flash('success', 'Application updated successfully.');
            redirect('students/view.php?id=' . $studentId . '#tab-applications');
        } catch (Throwable $ex) {
            try { $pdo->rollBack(); } catch (Throwable $e) {}
            $errors[] = 'Failed to save application: ' . $ex->getMessage();
        }
    }

    // Re-populate
    $application = array_merge($application, [
        'student_id' => $studentId, 'university_id' => $universityId,
        'course_id' => $courseId, 'intake' => $intake, 'status' => $status,
        'application_date' => $appDate, 'reference_number' => $refNum,
        'offer_date' => $offerDate, 'cas_date' => $casDate, 'visa_date' => $visaDate,
        'notes' => $notes,
    ]);

    // Re-fetch courses if university changed
    if ($universityId > 0) {
        $cs = $pdo->prepare('SELECT id, name FROM courses WHERE university_id = :uid AND status = "active" ORDER BY name');
        $cs->execute([':uid' => $universityId]);
        $courses = $cs->fetchAll();
    }
}

render_header('Edit Application');
?>
<div class="toolbar">
  <h1>Edit Application — <?php echo e($application['crm_id'] ?? ''); ?></h1>
  <a href="<?php echo url('applications/index.php'); ?>" class="btn">&larr; Back</a>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error"><ul style="margin:0;padding-left:20px"><?php foreach ($errors as $er): ?><li><?php echo e($er); ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>

<form method="post" action="">
  <?php echo csrf_field(); ?>
  <input type="hidden" name="id" value="<?php echo (int) $appId; ?>">
  <div class="card">
    <div class="card-head"><h3>Application Information</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Student <span class="req">*</span></label>
          <select name="student_id" required>
            <option value="">— Select student —</option>
            <?php foreach ($students as $s): ?>
              <option value="<?php echo (int) $s['id']; ?>" <?php if ((int) ($application['student_id'] ?? 0) === (int) $s['id']) echo 'selected'; ?>>
                <?php echo e($s['full_name'] . ' (' . $s['crm_id'] . ')'); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>University <span class="req">*</span></label>
          <select name="university_id" id="university_id" required>
            <option value="">— Select university —</option>
            <?php foreach ($universities as $u): ?>
              <option value="<?php echo (int) $u['id']; ?>" <?php if ((int) ($application['university_id'] ?? 0) === (int) $u['id']) echo 'selected'; ?>><?php echo e($u['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Course</label>
          <select name="course_id" id="course_id">
            <option value="">— Select course —</option>
            <?php foreach ($courses as $c): ?>
              <option value="<?php echo (int) $c['id']; ?>" <?php if ((int) ($application['course_id'] ?? 0) === (int) $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group"><label>Intake</label><input type="text" name="intake" placeholder="e.g. Sep 2026" value="<?php echo e($application['intake'] ?? ''); ?>"></div>
        <div class="form-group"><label>Application Date <span class="req">*</span></label><input type="date" name="application_date" required value="<?php echo e($application['application_date'] ?? date('Y-m-d')); ?>"></div>
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            <?php foreach ($statuses as $s): ?>
              <option value="<?php echo e($s); ?>" <?php if (($application['status'] ?? 'DRAFT') === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower(str_replace('_', ' ', $s)))); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group"><label>Reference Number</label><input type="text" name="reference_number" value="<?php echo e($application['reference_number'] ?? ''); ?>"></div>
        <div class="form-group"><label>Offer Date</label><input type="date" name="offer_date" value="<?php echo e($application['offer_date'] ?? ''); ?>"></div>
        <div class="form-group"><label>CAS Date</label><input type="date" name="cas_date" value="<?php echo e($application['cas_date'] ?? ''); ?>"></div>
        <div class="form-group"><label>Visa Date</label><input type="date" name="visa_date" value="<?php echo e($application['visa_date'] ?? ''); ?>"></div>
        <div class="form-group" style="grid-column:1 / -1">
          <label>Notes</label>
          <textarea name="notes"><?php echo e($application['notes'] ?? ''); ?></textarea>
        </div>
      </div>
      <div class="form-actions">
        <a href="<?php echo url('applications/index.php'); ?>" class="btn">Cancel</a>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </div>
  </div>
</form>

<script>
(function(){
  var uni = document.getElementById('university_id');
  if (!uni) return;
  uni.addEventListener('change', function(){
    var id = uni.value;
    if (id) window.location.href = window.location.pathname + '?id=<?php echo (int) $appId; ?>&university_id=' + encodeURIComponent(id);
  });
})();
</script>

<?php render_footer();
