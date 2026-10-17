<?php
/**
 * Applications — Create page
 *
 * Lets the user pick a student, university and (optionally) a course
 * filtered by university, then insert the application row.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('applications.create');

$pdo = db();
$errors = [];
$old    = [];

$studentId = (int) ($_GET['student_id'] ?? 0);
$uniId     = (int) ($_GET['university_id'] ?? 0);

$students = $pdo->query("SELECT id, crm_id, full_name FROM students ORDER BY full_name")->fetchAll();
$universities = $pdo->query("SELECT id, name FROM universities WHERE status='active' ORDER BY name")->fetchAll();
$statuses = ['DRAFT','SUBMITTED','UNDER_REVIEW','CONDITIONAL_OFFER','UNCONDITIONAL_OFFER','CAS_PENDING','CAS_ISSUED','VISA_PENDING','VISA_GRANTED','VISA_REFUSED','ENROLLED','WITHDRAWN'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $studentId    = (int) ($_POST['student_id']    ?? 0);
    $universityId = (int) ($_POST['university_id'] ?? 0);
    $courseId     = (int) ($_POST['course_id']     ?? 0);
    $intake       = trim((string) ($_POST['intake'] ?? ''));
    $status       = trim((string) ($_POST['status'] ?? 'DRAFT'));
    $notes        = trim((string) ($_POST['notes'] ?? ''));
    $appDate      = trim((string) ($_POST['application_date'] ?? date('Y-m-d')));

    if ($studentId <= 0)  $errors[] = 'Student is required.';
    if ($universityId <= 0) $errors[] = 'University is required.';
    if (!in_array($status, $statuses, true)) $errors[] = 'Invalid status.';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $appDate)) $errors[] = 'Application date must be YYYY-MM-DD.';

    $old = compact('studentId','universityId','courseId','intake','status','notes','appDate');

    if (!$errors) {
        $crmId = generate_crm_id('ALO-CRM');
        $courseIdVal    = $courseId > 0 ? $courseId : null;
        $universityIdVal = $universityId > 0 ? $universityId : null;
        $intakeVal       = $intake !== '' ? $intake : null;
        $notesVal        = $notes !== '' ? $notes : null;

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare(
                'INSERT INTO applications
                    (crm_id, student_id, university_id, course_id, intake,
                     application_date, status, notes, created_at, updated_at)
                 VALUES
                    (:crm_id, :student_id, :university_id, :course_id, :intake,
                     :application_date, :status, :notes, NOW(), NOW())'
            );
            $stmt->bindParam(':crm_id',           $crmId);
            $stmt->bindParam(':student_id',       $studentId, PDO::PARAM_INT);
            $stmt->bindParam(':university_id',    $universityIdVal, $universityIdVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':course_id',        $courseIdVal, $courseIdVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindParam(':intake',           $intakeVal);
            $stmt->bindParam(':application_date', $appDate);
            $stmt->bindParam(':status',           $status);
            $stmt->bindParam(':notes',            $notesVal);
            $stmt->execute();
            $newId = (int) $pdo->lastInsertId();

            $act = $pdo->prepare(
                'INSERT INTO activities
                    (user_id, student_id, crm_id, type, description, created_at)
                 VALUES (:uid, :sid, :crm, :type, :desc, NOW())'
            );
            $userId = (int) ($_SESSION['user_id'] ?? 0);
            $type = 'application_created';
            $desc = 'Application created: ' . $crmId;
            $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
            $act->bindParam(':sid',  $studentId, PDO::PARAM_INT);
            $act->bindParam(':crm',  $crmId);
            $act->bindParam(':type', $type);
            $act->bindParam(':desc', $desc);
            $act->execute();

            $pdo->commit();
            log_audit('create', 'applications', $newId, null, [
                'crm_id' => $crmId, 'student_id' => $studentId,
                'university_id' => $universityId, 'course_id' => $courseId, 'status' => $status,
            ]);
            flash('success', 'Application created — ' . $crmId);
            redirect('students/view.php?id=' . $studentId . '#tab-applications');
        } catch (Throwable $ex) {
            try { $pdo->rollBack(); } catch (Throwable $e) {}
            $errors[] = 'Failed to save application: ' . $ex->getMessage();
        }
    }
}

// Pre-fetch courses for the selected university (if any) so the dropdown
// can be populated on first load (the page also has AJAX-based filtering
// handled by the small JS snippet at the bottom).
$selectedUni = (int) ($old['universityId'] ?? $uniId);
$courses = [];
if ($selectedUni > 0) {
    $cs = $pdo->prepare('SELECT id, name FROM courses WHERE university_id = :uid AND status = "active" ORDER BY name');
    $cs->execute([':uid' => $selectedUni]);
    $courses = $cs->fetchAll();
}

render_header('Add Application');
?>
<div class="toolbar">
  <h1>Add Application</h1>
  <a href="<?php echo url('applications/index.php'); ?>" class="btn">&larr; Back</a>
</div>

<?php if ($errors): ?>
  <div class="alert alert-error"><ul style="margin:0;padding-left:20px"><?php foreach ($errors as $er): ?><li><?php echo e($er); ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>

<form method="post" action="">
  <?php echo csrf_field(); ?>
  <div class="card">
    <div class="card-head"><h3>Application Information</h3></div>
    <div class="card-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Student <span class="req">*</span></label>
          <select name="student_id" required>
            <option value="">— Select student —</option>
            <?php foreach ($students as $s): ?>
              <option value="<?php echo (int) $s['id']; ?>" <?php if ((int) ($old['studentId'] ?? $studentId) === (int) $s['id']) echo 'selected'; ?>>
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
              <option value="<?php echo (int) $u['id']; ?>" <?php if ((int) ($old['universityId'] ?? $uniId) === (int) $u['id']) echo 'selected'; ?>>
                <?php echo e($u['name']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Course</label>
          <select name="course_id" id="course_id">
            <option value="">— Select course —</option>
            <?php foreach ($courses as $c): ?>
              <option value="<?php echo (int) $c['id']; ?>" <?php if ((int) ($old['courseId'] ?? 0) === (int) $c['id']) echo 'selected'; ?>>
                <?php echo e($c['name']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Intake</label>
          <input type="text" name="intake" placeholder="e.g. Sep 2026" value="<?php echo e($old['intake'] ?? ''); ?>">
        </div>
        <div class="form-group">
          <label>Application Date <span class="req">*</span></label>
          <input type="date" name="application_date" required value="<?php echo e($old['appDate'] ?? date('Y-m-d')); ?>">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status">
            <?php foreach ($statuses as $s): ?>
              <option value="<?php echo e($s); ?>" <?php if (($old['status'] ?? 'DRAFT') === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower(str_replace('_', ' ', $s)))); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group" style="grid-column:1 / -1">
          <label>Notes</label>
          <textarea name="notes"><?php echo e($old['notes'] ?? ''); ?></textarea>
        </div>
      </div>
      <div class="form-actions">
        <a href="<?php echo url('applications/index.php'); ?>" class="btn">Cancel</a>
        <button type="submit" class="btn btn-primary">Create Application</button>
      </div>
    </div>
  </div>
</form>

<script>
// Simple course filter — re-loads the page with ?university_id= when the
// university dropdown changes. No external JS dependency required.
(function(){
  var uni = document.getElementById('university_id');
  var course = document.getElementById('course_id');
  if (!uni || !course) return;
  uni.addEventListener('change', function(){
    var id = uni.value;
    // Fetch courses via a hidden iframe-style GET by submitting to the same URL
    var url = window.location.pathname + '?university_id=' + encodeURIComponent(id);
    if (id) window.location.href = url;
  });
})();
</script>

<?php render_footer();
