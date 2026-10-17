<?php
/**
 * Tasks — List page
 *
 * Task list with filters: status, priority, assigned_to.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('tasks.view');

$pdo = db();

$status     = trim($_GET['status']     ?? '');
$priority   = trim($_GET['priority']   ?? '');
$assignedTo = trim($_GET['assigned_to'] ?? '');
$page       = max(1, (int) ($_GET['page'] ?? 1));
$perPage    = 20;

$where = []; $args = [];
if ($status !== '')     { $where[] = 't.status = :status'; $args[':status'] = $status; }
if ($priority !== '')   { $where[] = 't.priority = :priority'; $args[':priority'] = $priority; }
if ($assignedTo !== '') { $where[] = 't.assigned_to = :aid'; $args[':aid'] = (int) $assignedTo; }
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM tasks t {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT t.*, u.name AS assignee_name,
               s.full_name AS student_name, s.crm_id AS student_crm_id,
               l.full_name AS lead_name, l.crm_id AS lead_crm_id
          FROM tasks t
     LEFT JOIN users u    ON u.id = t.assigned_to
     LEFT JOIN students s ON s.id = t.student_id
     LEFT JOIN leads l    ON l.id = t.lead_id
          {$whereSql}
      ORDER BY
          CASE t.status WHEN 'PENDING' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'COMPLETED' THEN 3 ELSE 4 END,
          CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
          t.due_date ASC, t.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$tasks = $stmt->fetchAll();

$statuses    = ['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'];
$priorities  = ['LOW','MEDIUM','HIGH','URGENT'];
$assignees   = $pdo->query("SELECT id, name FROM users WHERE status='active' ORDER BY name")->fetchAll();

render_header('Tasks');
?>
<div class="toolbar">
  <h1>Tasks</h1>
  <?php if (has_permission('tasks.create')): ?>
    <button type="button" class="btn btn-primary" onclick="openModal('addTaskModal')">+ Add Task</button>
  <?php endif; ?>
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
    <label>Priority</label>
    <select name="priority">
      <option value="">All priorities</option>
      <?php foreach ($priorities as $p): ?>
        <option value="<?php echo e($p); ?>" <?php if ($priority === $p) echo 'selected'; ?>><?php echo e(ucwords(strtolower($p))); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Assigned To</label>
    <select name="assigned_to">
      <option value="">Everyone</option>
      <?php foreach ($assignees as $a): ?>
        <option value="<?php echo (int) $a['id']; ?>" <?php if ((int) $assignedTo === (int) $a['id']) echo 'selected'; ?>><?php echo e($a['name']); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('tasks/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Title</th>
          <th>Assigned To</th>
          <th>Student / Lead</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$tasks): ?>
          <tr><td colspan="6"><div class="empty">No tasks found.</div></td></tr>
        <?php else: foreach ($tasks as $t):
          $crmLink = '';
          if (!empty($t['student_id'])) {
            $crmLink = url('students/view.php?id=' . (int) $t['student_id']);
            $crmLabel = ($t['student_name'] ?? 'Student') . ' (' . ($t['student_crm_id'] ?? '') . ')';
          } elseif (!empty($t['lead_id'])) {
            $crmLink = url('leads/view.php?id=' . (int) $t['lead_id']);
            $crmLabel = ($t['lead_name'] ?? 'Lead') . ' (' . ($t['lead_crm_id'] ?? '') . ')';
          }
          ?>
          <tr>
            <td><strong><?php echo e($t['title']); ?></strong></td>
            <td><?php echo e($t['assignee_name'] ?? '—'); ?></td>
            <td>
              <?php if ($crmLink): ?>
                <a href="<?php echo e($crmLink); ?>" onclick="event.stopPropagation();"><?php echo e($crmLabel); ?></a>
              <?php else: ?>—<?php endif; ?>
            </td>
            <td><?php echo priority_badge($t['priority']); ?></td>
            <td><?php echo status_badge($t['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($t['due_date'], 'M d, Y H:i')); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'tasks/index.php'); ?>

<!-- Add Task Modal -->
<?php if (has_permission('tasks.create')): ?>
<div class="modal-backdrop" id="addTaskModal">
  <div class="modal">
    <div class="modal-head">
      <h3>New Task</h3>
      <button type="button" class="btn btn-ghost" data-modal-close>×</button>
    </div>
    <form method="post" action="<?php echo url('tasks/create.php'); ?>">
      <?php echo csrf_field(); ?>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group" style="grid-column:1 / -1">
            <label>Title <span class="req">*</span></label>
            <input type="text" name="title" maxlength="190" required>
          </div>
          <div class="form-group">
            <label>Assignee</label>
            <select name="assigned_to">
              <option value="">— Select —</option>
              <?php foreach ($assignees as $a): ?>
                <option value="<?php echo (int) $a['id']; ?>"><?php echo e($a['name']); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select name="priority">
              <?php foreach ($priorities as $p): ?>
                <option value="<?php echo e($p); ?>" <?php if ($p === 'MEDIUM') echo 'selected'; ?>><?php echo e(ucwords(strtolower($p))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="datetime-local" name="due_date">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <?php foreach ($statuses as $s): ?>
                <option value="<?php echo e($s); ?>" <?php if ($s === 'PENDING') echo 'selected'; ?>><?php echo e(ucwords(strtolower($s))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Description</label>
            <textarea name="description"></textarea>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Create Task</button>
      </div>
    </form>
  </div>
</div>
<?php endif; ?>

<?php render_footer();
