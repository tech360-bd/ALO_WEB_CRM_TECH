<?php
/**
 * Universities — Detail / View page
 *
 * Shows the university info, its courses list, and applications count.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('universities.view');

$pdo = db();
$uniId = (int) ($_GET['id'] ?? 0);
if ($uniId <= 0) {
    flash('error', 'Invalid university ID.');
    redirect('universities/index.php');
}

$stmt = $pdo->prepare('SELECT * FROM universities WHERE id = :id');
$stmt->execute([':id' => $uniId]);
$uni = $stmt->fetch();
if (!$uni) {
    flash('error', 'University not found.');
    redirect('universities/index.php');
}
$uni = is_array($uni) ? $uni : [];

/* Courses */
$coursesStmt = $pdo->prepare(
    'SELECT c.*,
            (SELECT COUNT(*) FROM applications a WHERE a.course_id = c.id) AS applications_count
       FROM courses c
      WHERE c.university_id = :uid
   ORDER BY c.name'
);
$coursesStmt->execute([':uid' => $uniId]);
$courses = $coursesStmt->fetchAll();

/* Application count overall */
$appCountStmt = $pdo->prepare('SELECT COUNT(*) FROM applications WHERE university_id = :uid');
$appCountStmt->execute([':uid' => $uniId]);
$totalApps = (int) $appCountStmt->fetchColumn();

render_header('University: ' . ($uni['name'] ?? ''));
?>
<div class="toolbar">
  <div class="flex items-center gap-2">
    <h1><?php echo e($uni['name'] ?? ''); ?></h1>
    <?php echo status_badge($uni['status'] ?? 'active'); ?>
  </div>
  <div class="flex gap-2">
    <a href="<?php echo url('universities/index.php'); ?>" class="btn">&larr; Back</a>
    <?php if (has_permission('courses.create')): ?>
      <a href="<?php echo url('courses/create.php?university_id=' . $uniId); ?>" class="btn btn-primary">+ Add Course</a>
    <?php endif; ?>
  </div>
</div>

<div class="card" style="margin-bottom:16px">
  <div class="card-body">
    <div class="info-grid">
      <?php echo info_row('Country', $uni['country'] ?? ''); ?>
      <?php echo info_row('City', $uni['city'] ?? ''); ?>
      <?php echo info_row('Ranking', $uni['ranking'] ?? ''); ?>
      <?php echo info_row('Status', $uni['status'] ?? ''); ?>
      <?php echo info_row('Website', $uni['website'] ?? '' ? '<a href="' . e((string) $uni['website']) . '" target="_blank" rel="noopener">' . e((string) $uni['website']) . '</a>' : ''); ?>
      <?php echo info_row('Created', $uni['created_at'] ?? '', 'datetime'); ?>
    </div>
    <?php if (!empty($uni['description'])): ?>
      <div style="margin-top:16px;">
        <strong>Description</strong>
        <div style="white-space:pre-wrap;margin-top:6px"><?php echo e((string) $uni['description']); ?></div>
      </div>
    <?php endif; ?>
  </div>
</div>

<div class="stats-grid" style="margin-bottom:16px">
  <?php echo stat_card('Total Courses', count($courses), "\u{1F4DA}", 'badge-blue'); ?>
  <?php echo stat_card('Total Applications', $totalApps, "\u{1F4DD}", 'badge-green'); ?>
</div>

<div class="card">
  <div class="card-head">
    <h3>Courses (<?php echo count($courses); ?>)</h3>
  </div>
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Name</th>
          <th>Level</th>
          <th>Duration</th>
          <th>Tuition</th>
          <th>Intake</th>
          <th>IELTS</th>
          <th>Status</th>
          <th>Applications</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$courses): ?>
          <tr><td colspan="9"><div class="empty">No courses yet. Click "Add Course" to create one.</div></td></tr>
        <?php else: foreach ($courses as $c): ?>
          <tr>
            <td><strong><?php echo e($c['name']); ?></strong></td>
            <td><?php echo e($c['level'] ?? '—'); ?></td>
            <td><?php echo e($c['duration'] ?? '—'); ?></td>
            <td><?php echo $c['tuition_fee'] !== null ? format_currency((float) $c['tuition_fee'], $c['currency'] ?? 'USD') : '—'; ?></td>
            <td><?php echo e($c['intake'] ?? '—'); ?></td>
            <td><?php echo $c['ielts_requirement'] !== null ? e((string) $c['ielts_requirement']) : '—'; ?></td>
            <td><?php echo status_badge($c['status'] ?? 'active'); ?></td>
            <td><?php echo (int) ($c['applications_count'] ?? 0); ?></td>
            <td><a href="<?php echo url('courses/view.php?id=' . (int) $c['id']); ?>" class="btn btn-sm">View</a></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_footer();
