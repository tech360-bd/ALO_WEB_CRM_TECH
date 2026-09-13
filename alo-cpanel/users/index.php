<?php
/**
 * Users — Management page
 *
 * Lists users; only Super Admin / Admin can access. Add / Edit / Delete
 * actions are available.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_role('super_admin', 'admin');

$pdo = db();

$search = trim($_GET['search'] ?? '');
$role   = trim($_GET['role']   ?? '');
$status = trim($_GET['status'] ?? '');
$page   = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 25;

$where = []; $args = [];
if ($search !== '') {
    $where[] = '(name LIKE :q OR email LIKE :q)';
    $args[':q'] = '%' . $search . '%';
}
if ($role !== '')   { $where[] = 'role = :role'; $args[':role'] = $role; }
if ($status !== '') { $where[] = 'status = :status'; $args[':status'] = $status; }
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM users {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT id, name, email, role, status, last_login_at, created_at
          FROM users {$whereSql}
      ORDER BY created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$users = $stmt->fetchAll();

$roles   = ['super_admin','admin','manager','counselor','marketing','finance','documentation','agent','student'];
$statuses = ['active','inactive','suspended'];

function role_badge(string $r): string {
    $map = [
        'super_admin'    => 'badge-purple',
        'admin'           => 'badge-red',
        'manager'         => 'badge-amber',
        'counselor'       => 'badge-blue',
        'marketing'       => 'badge-pink',
        'finance'         => 'badge-green',
        'documentation'   => 'badge-teal',
        'agent'           => 'badge-indigo',
        'student'         => 'badge-gray',
    ];
    $cls = $map[$r] ?? 'badge-gray';
    return '<span class="badge ' . $cls . '">' . e(ucwords(str_replace('_', ' ', $r))) . '</span>';
}

render_header('Users');
?>
<div class="toolbar">
  <h1>Users</h1>
  <button type="button" class="btn btn-primary" onclick="openModal('addUserModal')">+ Add User</button>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Role</label>
    <select name="role">
      <option value="">All roles</option>
      <?php foreach ($roles as $r): ?>
        <option value="<?php echo e($r); ?>" <?php if ($role === $r) echo 'selected'; ?>><?php echo e(ucwords(str_replace('_', ' ', $r))); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Status</label>
    <select name="status">
      <option value="">All statuses</option>
      <?php foreach ($statuses as $s): ?>
        <option value="<?php echo e($s); ?>" <?php if ($status === $s) echo 'selected'; ?>><?php echo e(ucwords($s)); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Search</label>
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="Name or email">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('users/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Last Login</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$users): ?>
          <tr><td colspan="6"><div class="empty">No users found.</div></td></tr>
        <?php else: foreach ($users as $u): ?>
          <tr>
            <td><strong><?php echo e($u['name']); ?></strong></td>
            <td class="text-sm"><?php echo e($u['email']); ?></td>
            <td><?php echo role_badge($u['role']); ?></td>
            <td><?php echo status_badge($u['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($u['last_login_at'], 'M d, Y H:i')); ?></td>
            <td>
              <a href="<?php echo url('users/edit.php?id=' . (int) $u['id']); ?>" class="btn btn-sm">Edit</a>
              <?php if ((int) $u['id'] !== (int) ($_SESSION['user_id'] ?? 0)): ?>
                <a href="<?php echo url('users/delete.php?id=' . (int) $u['id']); ?>" class="btn btn-sm btn-danger" onclick="return confirm('Delete this user?')">Delete</a>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'users/index.php'); ?>

<!-- Add User modal -->
<div class="modal-backdrop" id="addUserModal">
  <div class="modal">
    <div class="modal-head">
      <h3>New User</h3>
      <button type="button" class="btn btn-ghost" data-modal-close>×</button>
    </div>
    <form method="post" action="<?php echo url('users/create.php'); ?>">
      <?php echo csrf_field(); ?>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group" style="grid-column:1 / -1">
            <label>Full Name <span class="req">*</span></label>
            <input type="text" name="name" maxlength="150" required>
          </div>
          <div class="form-group">
            <label>Email <span class="req">*</span></label>
            <input type="email" name="email" required>
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="text" name="phone">
          </div>
          <div class="form-group">
            <label>Role <span class="req">*</span></label>
            <select name="role" required>
              <?php foreach ($roles as $r): ?>
                <option value="<?php echo e($r); ?>" <?php if ($r === 'counselor') echo 'selected'; ?>><?php echo e(ucwords(str_replace('_', ' ', $r))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <?php foreach ($statuses as $s): ?>
                <option value="<?php echo e($s); ?>" <?php if ($s === 'active') echo 'selected'; ?>><?php echo e(ucwords($s)); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Password <span class="req">*</span></label>
            <input type="password" name="password" minlength="8" required>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Create User</button>
      </div>
    </form>
  </div>
</div>

<?php render_footer();
