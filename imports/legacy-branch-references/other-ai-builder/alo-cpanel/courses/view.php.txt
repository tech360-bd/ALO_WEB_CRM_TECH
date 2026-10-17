<?php
/**
 * Courses — Detail / View page
 *
 * Shows the course info, the parent university, and applications count.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('courses.view');

$pdo = db();
$courseId = (int) ($_GET['id'] ?? 0);
if ($courseId <= 0) {
    flash('error', 'Invalid course ID.');
    redirect('courses/index.php');
}

$stmt = $pdo->prepare(
    'SELECT c.*, u.name AS university_name, u.country AS university_country,
            u.city AS university_city
       FROM courses c
  LEFT JOIN universities u ON u.id = c.university_id
      WHERE c.id = :id'
);
$stmt->execute([':id' => $courseId]);
$course = $stmt->fetch();
if (!$course) {
    flash('error', 'Course not found.');
    redirect('courses/index.php');
}
$course = is_array($course) ? $course : [];

/* Recent applications for this course */
$appStmt = $pdo->prepare(
    'SELECT a.id, a.crm_id, a.status, a.application_date, s.full_name AS student_name, s.crm_id AS student_crm_id
       FROM applications a
  LEFT JOIN students s ON s.id = a.student_id
      WHERE a.course_id = :cid
   ORDER BY a.application_date DESC
      LIMIT 10'
);
$appStmt->execute([':cid' => $courseId]);
$apps = $appStmt->fetchAll();

$appCountStmt = $pdo->prepare('SELECT COUNT(*) FROM applications WHERE course_id = :cid');
$appCountStmt->execute([':cid' => $courseId]);
$totalApps = (int) $appCountStmt->fetchColumn();

render_header('Course: ' . ($course['name'] ?? ''));
?>
<div class="toolbar">
  <h1><?php echo e($course['name'] ?? ''); ?></h1>
  <div class="flex gap-2">
    <a href="<?php echo url('courses/index.php'); ?>" class="btn">&larr; Back</a>
    <?php if (!empty($course['university_name'])): ?>
      <a href="<?php echo url('universities/view.php?id=' . (int) $course['university_id']); ?>" class="btn">View University</a>
    <?php endif; ?>
  </div>
</div>

<div class="card" style="margin-bottom:16px">
  <div class="card-body">
    <div class="info-grid">
      <?php echo info_row('University', $course['university_name'] ?? ''); ?>
      <?php echo info_row('Country', $course['university_country'] ?? ''); ?>
      <?php echo info_row('City', $course['university_city'] ?? ''); ?>
      <?php echo info_row('Level', $course['level'] ?? ''); ?>
      <?php echo info_row('Duration', $course['duration'] ?? ''); ?>
      <?php echo info_row('Tuition Fee', $course['tuition_fee'] !== null ? format_currency((float) $course['tuition_fee'], $course['currency'] ?? 'USD') : ''); ?>
      <?php echo info_row('Intake', $course['intake'] ?? ''); ?>
      <?php echo info_row('IELTS Requirement', $course['ielts_requirement'] !== null ? (string) $course['ielts_requirement'] : ''); ?>
      <?php echo info_row('Status', $course['status'] ?? ''); ?>
    </div>
    <?php if (!empty($course['entry_requirement'])): ?>
      <div style="margin-top:16px">
        <strong>Entry Requirements</strong>
        <div style="white-space:pre-wrap;margin-top:6px"><?php echo e((string) $course['entry_requirement']); ?></div>
      </div>
    <?php endif; ?>
    <?php if (!empty($course['description'])): ?>
      <div style="margin-top:16px">
        <strong>Description</strong>
        <div style="white-space:pre-wrap;margin-top:6px"><?php echo e((string) $course['description']); ?></div>
      </div>
    <?php endif; ?>
  </div>
</div>

<div class="stats-grid" style="margin-bottom:16px">
  <?php echo stat_card('Total Applications', $totalApps, "\u{1F4DD}", 'badge-green'); ?>
</div>

<div class="card">
  <div class="card-head">
    <h3>Recent Applications</h3>
  </div>
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>CRM ID</th>
          <th>Student</th>
          <th>Status</th>
          <th>Application Date</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$apps): ?>
          <tr><td colspan="5"><div class="empty">No applications yet.</div></td></tr>
        <?php else: foreach ($apps as $a): ?>
          <tr>
            <td class="mono"><?php echo e($a['crm_id']); ?></td>
            <td><?php echo e($a['student_name'] ?? '—'); ?></td>
            <td><?php echo status_badge($a['status']); ?></td>
            <td><?php echo e(format_date($a['application_date'])); ?></td>
            <td><a href="<?php echo url('students/view.php?id=' . (int) ($a['student_name'] ? 0 : 0)); ?>" class="btn btn-sm"></a></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_footer();
