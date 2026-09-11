<?php
/**
 * Students — List page
 *
 * Table of students with filters, search and pagination.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('students.view');

$pdo = db();

/* CSV export */
if (($_GET['export'] ?? '') === 'csv' && has_permission('students.export')) {
    $where = []; $args = [];
    $status    = trim($_GET['status']    ?? '');
    $course    = trim($_GET['course']    ?? '');
    $country   = trim($_GET['country']  ?? '');
    $counselor = trim($_GET['counselor'] ?? '');
    $search    = trim($_GET['search']    ?? '');

    if ($status !== '')    { $where[] = 's.status = :status';       $args[':status']    = $status; }
    if ($counselor !== '')  { $where[] = 's.counselor_id = :cid';   $args[':cid']       = (int) $counselor; }
    if ($country !== '')    { $where[] = 's.preferred_country = :country'; $args[':country'] = $country; }
    if ($search !== '')     {
        $where[] = '(s.full_name LIKE :q OR s.phone LIKE :q OR s.email LIKE :q OR s.crm_id LIKE :q)';
        $args[':q'] = '%' . $search . '%';
    }
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
    $sql = "SELECT s.crm_id, s.full_name, s.email, s.phone, s.preferred_country,
                   s.preferred_course, s.status, u.name AS counselor_name, s.created_at
              FROM students s
         LEFT JOIN users u ON u.id = s.counselor_id
            {$whereSql} ORDER BY s.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    $rows = $stmt->fetchAll();
    csv_output(
        'students-export-' . date('Y-m-d') . '.csv',
        ['CRM ID','Name','Email','Phone','Country','Course','Status','Counselor','Created'],
        array_map(static fn($r) => [$r['crm_id'],$r['full_name'],$r['email'],$r['phone'],$r['preferred_country'],$r['preferred_course'],$r['status'],$r['counselor_name'],$r['created_at']], $rows)
    );
}

/* Filters */
$status    = trim($_GET['status']    ?? '');
$counselor = trim($_GET['counselor'] ?? '');
$country   = trim($_GET['country']   ?? '');
$search    = trim($_GET['search']    ?? '');
$page      = max(1, (int) ($_GET['page'] ?? 1));
$perPage   = 20;

$where = []; $args = [];
if ($status !== '')    { $where[] = 's.status = :status';       $args[':status']    = $status; }
if ($counselor !== '')  { $where[] = 's.counselor_id = :cid';    $args[':cid']       = (int) $counselor; }
if ($country !== '')    { $where[] = 's.preferred_country = :country'; $args[':country'] = $country; }
if ($search !== '')     {
    $where[] = '(s.full_name LIKE :q OR s.phone LIKE :q OR s.email LIKE :q OR s.crm_id LIKE :q)';
    $args[':q'] = '%' . $search . '%';
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

/* Count + page */
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM students s {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT s.id, s.crm_id, s.full_name, s.email, s.phone, s.preferred_country,
               s.preferred_course, s.status, u.name AS counselor_name, s.created_at
          FROM students s
     LEFT JOIN users u ON u.id = s.counselor_id
          {$whereSql}
      ORDER BY s.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$students = $stmt->fetchAll();

$statuses  = ['PROSPECT','LEAD','APPLICANT','OFFERED','ENROLLED','GRADUATED','WITHDRAWN','REJECTED'];
$counselors = $pdo->query("SELECT id, name FROM users WHERE status='active' AND role IN ('counselor','manager','admin','super_admin') ORDER BY name")->fetchAll();
$countries = $pdo->query("SELECT DISTINCT preferred_country FROM students WHERE preferred_country IS NOT NULL AND preferred_country <> '' ORDER BY preferred_country")->fetchAll(PDO::FETCH_COLUMN);

render_header('Students');
?>
<div class="toolbar">
  <h1>Students</h1>
  <div class="flex gap-2">
    <a href="?<?php echo http_build_query(array_merge($_GET, ['export' => 'csv'])); ?>" class="btn">⤓ Export CSV</a>
    <?php if (has_permission('students.create')): ?>
    <a href="<?php echo url('students/create.php'); ?>" class="btn btn-primary">+ Add Student</a>
    <?php endif; ?>
  </div>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Status</label>
    <select name="status">
      <option value="">All statuses</option>
      <?php foreach ($statuses as $s): ?>
        <option value="<?php echo e($s); ?>" <?php if ($status === $s) echo 'selected'; ?>><?php echo e(ucwords(strtolower($s))); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Counselor</label>
    <select name="counselor">
      <option value="">All counselors</option>
      <?php foreach ($counselors as $c): ?>
        <option value="<?php echo (int) $c['id']; ?>" <?php if ((int) $counselor === (int) $c['id']) echo 'selected'; ?>><?php echo e($c['name']); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Country</label>
    <select name="country">
      <option value="">All countries</option>
      <?php foreach ($countries as $cn): ?>
        <option value="<?php echo e($cn); ?>" <?php if ($country === $cn) echo 'selected'; ?>><?php echo e($cn); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Search</label>
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="Name, phone, email, CRM ID">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('students/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr><th>CRM ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Country</th><th>Course</th><th>Status</th><th>Counselor</th></tr>
      </thead>
      <tbody>
        <?php if (!$students): ?>
          <tr><td colspan="8"><div class="empty">No students found.</div></td></tr>
        <?php else: foreach ($students as $s): ?>
          <tr onclick="window.location='<?php echo url('students/view.php?id=' . (int) $s['id']); ?>'">
            <td class="mono"><?php echo e($s['crm_id']); ?></td>
            <td><strong><?php echo e($s['full_name']); ?></strong></td>
            <td><?php echo e($s['phone'] ?? '—'); ?></td>
            <td class="text-sm"><?php echo e($s['email'] ?? '—'); ?></td>
            <td><?php echo e($s['preferred_country'] ?? '—'); ?></td>
            <td class="text-sm"><?php echo e($s['preferred_course'] ?? '—'); ?></td>
            <td><?php echo status_badge($s['status']); ?></td>
            <td><?php echo e($s['counselor_name'] ?? '—'); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'students/index.php'); ?>

<?php render_footer();
