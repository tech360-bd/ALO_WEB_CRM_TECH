<?php
/**
 * Applications — List page
 *
 * Lists all applications with status & university filters.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('applications.view');

$pdo = db();

$status      = trim($_GET['status']      ?? '');
$universityId = trim($_GET['university'] ?? '');
$search      = trim($_GET['search']      ?? '');
$page        = max(1, (int) ($_GET['page'] ?? 1));
$perPage     = 20;

$where = []; $args = [];
if ($status !== '')       { $where[] = 'a.status = :status'; $args[':status'] = $status; }
if ($universityId !== '')  { $where[] = 'a.university_id = :uid'; $args[':uid'] = (int) $universityId; }
if ($search !== '')       {
    $where[] = '(a.crm_id LIKE :q OR s.full_name LIKE :q OR s.crm_id LIKE :q OR s.phone LIKE :q)';
    $args[':q'] = '%' . $search . '%';
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM applications a LEFT JOIN students s ON s.id = a.student_id {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT a.id, a.crm_id, a.student_id, a.university_id, a.course_id, a.intake,
               a.status, a.application_date, a.created_at,
               s.full_name AS student_name, s.crm_id AS student_crm_id,
               u.name AS university_name,
               c.name AS course_name
          FROM applications a
     LEFT JOIN students s    ON s.id = a.student_id
     LEFT JOIN universities u ON u.id = a.university_id
     LEFT JOIN courses c     ON c.id = a.course_id
          {$whereSql}
      ORDER BY a.application_date DESC, a.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$apps = $stmt->fetchAll();

$statuses    = ['DRAFT','SUBMITTED','UNDER_REVIEW','CONDITIONAL_OFFER','UNCONDITIONAL_OFFER','CAS_PENDING','CAS_ISSUED','VISA_PENDING','VISA_GRANTED','VISA_REFUSED','ENROLLED','WITHDRAWN'];
$universities = $pdo->query("SELECT id, name FROM universities ORDER BY name")->fetchAll();

render_header('Applications');
?>
<div class="toolbar">
  <h1>Applications</h1>
  <div class="flex gap-2">
    <?php if (has_permission('applications.create')): ?>
      <a href="<?php echo url('applications/create.php'); ?>" class="btn btn-primary">+ Add Application</a>
    <?php endif; ?>
  </div>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Status</label>
    <select name="status">
      <option value="">All statuses</option>
      <?php foreach ($statuses as $s): ?>
        <option value="<?php echo e($s); ?>" <?php if ($status === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower(str_replace('_', ' ', $s)))); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>University</label>
    <select name="university">
      <option value="">All universities</option>
      <?php foreach ($universities as $u): ?>
        <option value="<?php echo (int) $u['id']; ?>" <?php if ((int) $universityId === (int) $u['id']) echo 'selected'; ?>><?php echo e($u['name']); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Search</label>
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="CRM ID, student name/phone">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('applications/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>CRM ID</th>
          <th>Student</th>
          <th>University</th>
          <th>Course</th>
          <th>Intake</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$apps): ?>
          <tr><td colspan="7"><div class="empty">No applications found.</div></td></tr>
        <?php else: foreach ($apps as $a): ?>
          <tr onclick="window.location='<?php echo url('students/view.php?id=' . (int) $a['student_id']); ?>'">
            <td class="mono"><?php echo e($a['crm_id']); ?></td>
            <td>
              <strong><?php echo e($a['student_name'] ?? '—'); ?></strong>
              <?php if (!empty($a['student_crm_id'])): ?>
                <div class="text-muted text-sm"><?php echo e($a['student_crm_id']); ?></div>
              <?php endif; ?>
            </td>
            <td><?php echo e($a['university_name'] ?? '—'); ?></td>
            <td class="text-sm"><?php echo e($a['course_name'] ?? '—'); ?></td>
            <td><?php echo e($a['intake'] ?? '—'); ?></td>
            <td><?php echo status_badge($a['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($a['application_date'])); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'applications/index.php'); ?>

<?php render_footer();
