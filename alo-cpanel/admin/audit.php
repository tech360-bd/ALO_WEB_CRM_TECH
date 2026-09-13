<?php
/**
 * Admin — Audit log viewer
 *
 * Table: Timestamp, User, Action, Entity, Entity ID, IP. Filters: action,
 * entity, user, date range. Only Super Admin can access.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_role('super_admin');

$pdo = db();

$action   = trim($_GET['action'] ?? '');
$entity   = trim($_GET['entity'] ?? '');
$userId   = trim($_GET['user_id'] ?? '');
$from     = trim($_GET['from'] ?? '');
$to       = trim($_GET['to']   ?? '');
$page     = max(1, (int) ($_GET['page'] ?? 1));
$perPage  = 50;

$where = []; $args = [];
if ($action !== '') { $where[] = 'a.action = :action'; $args[':action'] = $action; }
if ($entity !== '') { $where[] = 'a.entity_type = :entity'; $args[':entity'] = $entity; }
if ($userId !== '') { $where[] = 'a.user_id = :uid'; $args[':uid'] = (int) $userId; }
if ($from !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
    $where[] = 'a.created_at >= :from';
    $args[':from'] = $from . ' 00:00:00';
}
if ($to !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    $where[] = 'a.created_at <= :to';
    $args[':to'] = $to . ' 23:59:59';
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

/* CSV export */
if (($_GET['export'] ?? '') === 'csv') {
    $sql = "SELECT a.created_at, u.name AS user_name, u.email AS user_email,
                   a.action, a.entity_type, a.entity_id, a.ip_address,
                   a.before_values, a.after_values
              FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
              {$whereSql}
          ORDER BY a.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    $rows = $stmt->fetchAll();
    csv_output(
        'audit-log-' . date('Y-m-d') . '.csv',
        ['Timestamp','User','Email','Action','Entity Type','Entity ID','IP','Before','After'],
        array_map(static fn($r) => [
            $r['created_at'], $r['user_name'] ?? '', $r['user_email'] ?? '',
            $r['action'], $r['entity_type'], $r['entity_id'] ?? '',
            $r['ip_address'] ?? '', $r['before_values'] ?? '', $r['after_values'] ?? '',
        ], $rows)
    );
}

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM audit_logs a {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT a.*, u.name AS user_name, u.email AS user_email
          FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
          {$whereSql}
      ORDER BY a.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$logs = $stmt->fetchAll();

$actions   = $pdo->query("SELECT DISTINCT action FROM audit_logs ORDER BY action")->fetchAll(PDO::FETCH_COLUMN);
$entities  = $pdo->query("SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type")->fetchAll(PDO::FETCH_COLUMN);
$usersList = $pdo->query("SELECT DISTINCT u.id, u.name FROM users u INNER JOIN audit_logs a ON a.user_id = u.id ORDER BY u.name")->fetchAll();

render_header('Audit Logs');
?>
<div class="toolbar">
  <h1>Audit Logs</h1>
  <a href="?<?php echo http_build_query(array_merge($_GET, ['export' => 'csv'])); ?>" class="btn">⤓ Export CSV</a>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Action</label>
    <select name="action">
      <option value="">All actions</option>
      <?php foreach ($actions as $a): ?>
        <option value="<?php echo e($a); ?>" <?php if ($action === $a) echo 'selected'; ?>><?php echo e($a); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Entity</label>
    <select name="entity">
      <option value="">All entities</option>
      <?php foreach ($entities as $e): ?>
        <option value="<?php echo e($e); ?>" <?php if ($entity === $e) echo 'selected'; ?>><?php echo e($e); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>User</label>
    <select name="user_id">
      <option value="">All users</option>
      <?php foreach ($usersList as $u): ?>
        <option value="<?php echo (int) $u['id']; ?>" <?php if ((int) $userId === (int) $u['id']) echo 'selected'; ?>><?php echo e($u['name']); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>From</label>
    <input type="date" name="from" value="<?php echo e($from); ?>">
  </div>
  <div class="form-field">
    <label>To</label>
    <input type="date" name="to" value="<?php echo e($to); ?>">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('admin/audit.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>User</th>
          <th>Action</th>
          <th>Entity</th>
          <th>Entity ID</th>
          <th>IP</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$logs): ?>
          <tr><td colspan="7"><div class="empty">No audit log entries.</div></td></tr>
        <?php else: foreach ($logs as $log): ?>
          <tr>
            <td class="text-sm"><?php echo e(format_date($log['created_at'], 'M d, Y H:i:s')); ?></td>
            <td>
              <strong><?php echo e($log['user_name'] ?? '—'); ?></strong>
              <?php if (!empty($log['user_email'])): ?>
                <div class="text-muted text-sm"><?php echo e($log['user_email']); ?></div>
              <?php endif; ?>
            </td>
            <td><span class="badge badge-blue"><?php echo e($log['action']); ?></span></td>
            <td class="mono"><?php echo e($log['entity_type']); ?></td>
            <td class="mono"><?php echo $log['entity_id'] !== null ? (int) $log['entity_id'] : '—'; ?></td>
            <td class="mono text-sm"><?php echo e($log['ip_address'] ?? '—'); ?></td>
            <td class="text-sm">
              <?php if (!empty($log['after_values'])): ?>
                <details>
                  <summary>View</summary>
                  <pre style="font-size:.7rem;max-width:380px;overflow:auto"><?php echo e($log['after_values']); ?></pre>
                </details>
              <?php else: ?>—<?php endif; ?>
            </td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'admin/audit.php'); ?>

<?php render_footer();
