<?php
/**
 * Communications — Center
 *
 * Unified inbox with filters and a Compose button.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('communications.view');

$pdo = db();

$channel   = trim($_GET['channel']   ?? '');
$direction = trim($_GET['direction'] ?? '');
$status    = trim($_GET['status']    ?? '');
$search    = trim($_GET['search']    ?? '');
$page      = max(1, (int) ($_GET['page'] ?? 1));
$perPage   = 25;

$where = []; $args = [];
if ($channel !== '')   { $where[] = 'c.channel = :channel'; $args[':channel'] = $channel; }
if ($direction !== '') { $where[] = 'c.direction = :direction'; $args[':direction'] = $direction; }
if ($status !== '')     { $where[] = 'c.status = :status'; $args[':status'] = $status; }
if ($search !== '')     {
    $where[] = '(c.subject LIKE :q OR c.message LIKE :q OR c.crm_id LIKE :q OR s.full_name LIKE :q OR l.full_name LIKE :q)';
    $args[':q'] = '%' . $search . '%';
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM communications c
    LEFT JOIN students s ON s.id = c.student_id
    LEFT JOIN leads l ON l.id = c.lead_id {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT c.*, u.name AS user_name,
               s.full_name AS student_name, s.crm_id AS student_crm_id,
               l.full_name AS lead_name, l.crm_id AS lead_crm_id
          FROM communications c
     LEFT JOIN users u     ON u.id = c.user_id
     LEFT JOIN students s ON s.id = c.student_id
     LEFT JOIN leads l     ON l.id = c.lead_id
          {$whereSql}
      ORDER BY c.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$communications = $stmt->fetchAll();

$channels   = ['WHATSAPP','EMAIL','SMS','MESSENGER','PHONE','INTERNAL_NOTE'];
$directions = ['INBOUND','OUTBOUND'];
$statuses   = ['PENDING','SENT','DELIVERED','READ','FAILED'];

render_header('Communications');
?>
<div class="toolbar">
  <h1>Communications</h1>
  <?php if (has_permission('communications.create')): ?>
    <button type="button" class="btn btn-primary" onclick="openModal('composeModal')">✎ Compose</button>
  <?php endif; ?>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Channel</label>
    <select name="channel">
      <option value="">All channels</option>
      <?php foreach ($channels as $ch): ?>
        <option value="<?php echo e($ch); ?>" <?php if ($channel === $ch) echo 'selected'; ?>><?php echo e(ucwords(strtolower($ch))); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Direction</label>
    <select name="direction">
      <option value="">Both</option>
      <?php foreach ($directions as $d): ?>
        <option value="<?php echo e($d); ?>" <?php if ($direction === $d) echo 'selected'; ?>><?php echo e(ucwords(strtolower($d))); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
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
    <label>Search</label>
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="Subject, message, CRM ID">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('communications/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>CRM ID</th>
          <th>Student / Lead</th>
          <th>Channel</th>
          <th>Direction</th>
          <th>Subject</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$communications): ?>
          <tr><td colspan="7"><div class="empty">No communications found.</div></td></tr>
        <?php else: foreach ($communications as $c):
          $link = '';
          $label = '';
          if (!empty($c['student_id'])) {
            $link = url('students/view.php?id=' . (int) $c['student_id']);
            $label = $c['student_name'] ?? 'Student';
          } elseif (!empty($c['lead_id'])) {
            $link = url('leads/view.php?id=' . (int) $c['lead_id']);
            $label = $c['lead_name'] ?? 'Lead';
          }
          ?>
          <tr>
            <td class="mono text-sm"><?php echo e($c['crm_id'] ?? '—'); ?></td>
            <td>
              <?php if ($link): ?>
                <a href="<?php echo e($link); ?>"><?php echo e($label); ?></a>
                <div class="text-muted text-sm mono"><?php echo e($c['student_crm_id'] ?? $c['lead_crm_id'] ?? ''); ?></div>
              <?php else: ?>—<?php endif; ?>
            </td>
            <td><?php echo channel_icon($c['channel']); ?></td>
            <td><?php echo e(ucwords(strtolower($c['direction']))); ?></td>
            <td><?php echo e($c['subject'] ?? '(no subject)'); ?></td>
            <td><?php echo status_badge($c['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($c['created_at'], 'M d, Y H:i')); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'communications/index.php'); ?>

<!-- Compose modal -->
<?php if (has_permission('communications.create')): ?>
<div class="modal-backdrop" id="composeModal">
  <div class="modal">
    <div class="modal-head">
      <h3>Compose Message</h3>
      <button type="button" class="btn btn-ghost" data-modal-close>×</button>
    </div>
    <form method="post" action="<?php echo url('communications/send.php'); ?>" enctype="multipart/form-data">
      <?php echo csrf_field(); ?>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Channel <span class="req">*</span></label>
            <select name="channel" required>
              <?php foreach ($channels as $ch): ?>
                <option value="<?php echo e($ch); ?>"><?php echo e(ucwords(strtolower($ch))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Direction</label>
            <select name="direction">
              <option value="OUTBOUND">Outbound</option>
              <option value="INBOUND">Inbound</option>
            </select>
          </div>
          <div class="form-group">
            <label>Student</label>
            <input type="number" name="student_id" placeholder="Student ID (optional)">
          </div>
          <div class="form-group">
            <label>Lead</label>
            <input type="number" name="lead_id" placeholder="Lead ID (optional)">
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Subject</label>
            <input type="text" name="subject">
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Message <span class="req">*</span></label>
            <textarea name="message" required></textarea>
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>Attachment</label>
            <input type="file" name="attachment">
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Send</button>
      </div>
    </form>
  </div>
</div>
<?php endif; ?>

<?php render_footer();
