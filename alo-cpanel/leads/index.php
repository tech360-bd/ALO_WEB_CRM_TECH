<?php
/**
 * Leads — List page
 *
 * Shows leads table with filters (status, source, counselor, search),
 * pagination (20 per page), CSV export, and an "Add Lead" button.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('leads.view');

$pdo = db();

/* ----------------------------------------------------------------
 * CSV Export (must run before any HTML output)
 * ---------------------------------------------------------------- */
if (($_GET['export'] ?? '') === 'csv' && has_permission('leads.export')) {
    $where = [];
    $args  = [];

    $status    = trim($_GET['status']    ?? '');
    $source    = trim($_GET['source']    ?? '');
    $counselor = trim($_GET['counselor'] ?? '');
    $search    = trim($_GET['search']    ?? '');

    if ($status !== '')    { $where[] = 'l.status = :status';       $args[':status']    = $status; }
    if ($source !== '')     { $where[] = 'l.source = :source';       $args[':source']    = $source; }
    if ($counselor !== '')  { $where[] = 'l.counselor_id = :cid';    $args[':cid']       = (int) $counselor; }
    if ($search !== '')     {
        $where[] = '(l.full_name LIKE :q OR l.phone LIKE :q OR l.email LIKE :q OR l.crm_id LIKE :q)';
        $args[':q'] = '%' . $search . '%';
    }

    $sql = 'SELECT l.crm_id, l.full_name, l.email, l.phone, l.alt_phone, l.source,
                   l.status, l.country, l.course, l.intake, l.budget, l.ielts_score,
                   l.lead_score, l.notes, l.follow_up_date, l.created_at,
                   u.name AS counselor_name
              FROM leads l
         LEFT JOIN users u ON u.id = l.counselor_id';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY l.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    $rows = $stmt->fetchAll();

    csv_output(
        'leads-export-' . date('Y-m-d') . '.csv',
        ['CRM ID','Name','Email','Phone','Alt Phone','Source','Status','Country','Course','Intake','Budget','IELTS','Score','Follow Up','Counselor','Created'],
        array_map(static fn($r) => [
            $r['crm_id'] ?? '',
            $r['full_name'] ?? '',
            $r['email'] ?? '',
            $r['phone'] ?? '',
            $r['alt_phone'] ?? '',
            $r['source'] ?? '',
            $r['status'] ?? '',
            $r['country'] ?? '',
            $r['course'] ?? '',
            $r['intake'] ?? '',
            $r['budget'] ?? '',
            $r['ielts_score'] ?? '',
            $r['lead_score'] ?? '',
            $r['follow_up_date'] ?? '',
            $r['counselor_name'] ?? '',
            $r['created_at'] ?? '',
        ], $rows)
    );
}

/* ----------------------------------------------------------------
 * Filters (sanitised)
 * ---------------------------------------------------------------- */
$status    = trim($_GET['status']    ?? '');
$source    = trim($_GET['source']    ?? '');
$counselor = trim($_GET['counselor'] ?? '');
$search    = trim($_GET['search']    ?? '');
$page      = max(1, (int) ($_GET['page'] ?? 1));
$perPage   = 20;

$where = [];
$args  = [];
if ($status !== '')    { $where[] = 'l.status = :status';       $args[':status']    = $status; }
if ($source !== '')     { $where[] = 'l.source = :source';       $args[':source']    = $source; }
if ($counselor !== '')  { $where[] = 'l.counselor_id = :cid';    $args[':cid']       = (int) $counselor; }
if ($search !== '')     {
    $where[] = '(l.full_name LIKE :q OR l.phone LIKE :q OR l.email LIKE :q OR l.crm_id LIKE :q)';
    $args[':q'] = '%' . $search . '%';
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

/* ----------------------------------------------------------------
 * Total count for pagination
 * ---------------------------------------------------------------- */
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM leads l {$whereSql}");
$countStmt->execute($args);
$total     = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) { $page = $totalPages; }
$offset = ($page - 1) * $perPage;

/* ----------------------------------------------------------------
 * Fetch page rows
 * ---------------------------------------------------------------- */
$sql = "SELECT l.id, l.crm_id, l.full_name, l.email, l.phone, l.source, l.status,
               l.lead_score, l.follow_up_date, l.created_at,
               u.name AS counselor_name
          FROM leads l
     LEFT JOIN users u ON u.id = l.counselor_id
          {$whereSql}
      ORDER BY l.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) {
    $stmt->bindValue($k, $v);
}
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$leads = $stmt->fetchAll();

/* ----------------------------------------------------------------
 * Filter options (statuses + counselors + sources)
 * ---------------------------------------------------------------- */
$statuses = ['NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED','LOST'];
$counselors = $pdo->query("SELECT id, name FROM users WHERE status='active' AND role IN ('counselor','manager','admin','super_admin') ORDER BY name")->fetchAll();
$sources = $pdo->query("SELECT DISTINCT source FROM leads WHERE source IS NOT NULL AND source <> '' ORDER BY source")->fetchAll(PDO::FETCH_COLUMN);

render_header('Leads');
?>
<div class="toolbar">
  <h1>Leads</h1>
  <div class="flex gap-2">
    <a href="?<?php echo http_build_query(array_merge($_GET, ['export' => 'csv'])); ?>" class="btn">⤓ Export CSV</a>
    <?php if (has_permission('leads.create')): ?>
    <a href="<?php echo url('leads/create.php'); ?>" class="btn btn-primary">+ Add Lead</a>
    <?php endif; ?>
  </div>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Status</label>
    <select name="status">
      <option value="">All statuses</option>
      <?php foreach ($statuses as $s): ?>
        <option value="<?php echo e($s); ?>" <?php if ($status === $s) echo 'selected'; ?>><?php echo e($s); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Source</label>
    <select name="source">
      <option value="">All sources</option>
      <?php foreach ($sources as $src): ?>
        <option value="<?php echo e($src); ?>" <?php if ($source === $src) echo 'selected'; ?>><?php echo e($src); ?></option>
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
    <label>Search</label>
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="Name, phone, email, CRM ID">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('leads/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>CRM ID</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Source</th>
          <th>Status</th>
          <th>Counselor</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
      <?php if (!$leads): ?>
        <tr><td colspan="7"><div class="empty">No leads found.</div></td></tr>
      <?php else: foreach ($leads as $l): ?>
        <tr onclick="window.location='<?php echo url('leads/view.php?id=' . (int) $l['id']); ?>'">
          <td class="mono"><?php echo e($l['crm_id']); ?></td>
          <td>
            <strong><?php echo e($l['full_name']); ?></strong>
            <?php if (!empty($l['email'])): ?>
              <div class="text-muted text-sm"><?php echo e($l['email']); ?></div>
            <?php endif; ?>
          </td>
          <td><?php echo e($l['phone'] ?? '—'); ?></td>
          <td><?php echo e($l['source'] ?? '—'); ?></td>
          <td><?php echo status_badge($l['status']); ?></td>
          <td><?php echo e($l['counselor_name'] ?? '—'); ?></td>
          <td class="text-sm text-muted"><?php echo e(format_date($l['created_at'], 'M d, Y')); ?></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'leads/index.php'); ?>

<?php render_footer();
