<?php
/**
 * Documents — List page
 *
 * Table of documents with type / status filters and an Upload button that
 * opens a modal with file picker, student selector and document type.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('documents.view');

$pdo = db();

$type   = trim($_GET['type']   ?? '');
$status = trim($_GET['status'] ?? '');
$search = trim($_GET['search'] ?? '');
$page   = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 20;

$where = []; $args = [];
if ($type !== '')   { $where[] = 'd.document_type = :type'; $args[':type'] = $type; }
if ($status !== '') { $where[] = 'd.status = :status'; $args[':status'] = $status; }
if ($search !== '')  {
    $where[] = '(d.file_name LIKE :q OR s.full_name LIKE :q OR s.crm_id LIKE :q)';
    $args[':q'] = '%' . $search . '%';
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM documents d LEFT JOIN students s ON s.id = d.student_id {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT d.*, s.full_name AS student_name, s.crm_id AS student_crm_id,
               u.name AS uploader_name
          FROM documents d
     LEFT JOIN students s ON s.id = d.student_id
     LEFT JOIN users u     ON u.id = d.uploaded_by
          {$whereSql}
      ORDER BY d.created_at DESC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$documents = $stmt->fetchAll();

$types    = ['PASSPORT','PHOTO','ACADEMIC_CERT','TRANSCRIPT','ENGLISH_CERT','CV','PERSONAL_STATEMENT','RECOMMENDATION','OFFER_LETTER','CAS','VISA','FINANCIAL','OTHER'];
$statuses = ['PENDING','VERIFIED','REJECTED'];
$students = $pdo->query("SELECT id, crm_id, full_name FROM students ORDER BY full_name")->fetchAll();

render_header('Documents');
?>
<div class="toolbar">
  <h1>Documents</h1>
  <?php if (has_permission('documents.upload')): ?>
    <button type="button" class="btn btn-primary" onclick="openModal('uploadModal')">↑ Upload Document</button>
  <?php endif; ?>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>Document Type</label>
    <select name="type">
      <option value="">All types</option>
      <?php foreach ($types as $t): ?>
        <option value="<?php echo e($t); ?>" <?php if ($type === $t) echo 'selected'; ?>><?php echo e(ucwords(strtolower(str_replace('_', ' ', $t)))); ?></option>
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
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="File name or student">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('documents/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Student</th>
          <th>Type</th>
          <th>File Name</th>
          <th>Status</th>
          <th>Uploaded By</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$documents): ?>
          <tr><td colspan="6"><div class="empty">No documents found.</div></td></tr>
        <?php else: foreach ($documents as $d): ?>
          <tr>
            <td>
              <?php if (!empty($d['student_id'])): ?>
                <a href="<?php echo url('students/view.php?id=' . (int) $d['student_id']); ?>"><?php echo e($d['student_name'] ?? '—'); ?></a>
                <div class="text-muted text-sm mono"><?php echo e($d['student_crm_id'] ?? ''); ?></div>
              <?php else: ?>—<?php endif; ?>
            </td>
            <td><?php echo e(ucwords(strtolower(str_replace('_', ' ', $d['document_type'])))); ?></td>
            <td>
              <a href="<?php echo e(url('uploads/' . ltrim((string) $d['file_path'], '/'))); ?>" target="_blank" rel="noopener"><?php echo e($d['file_name']); ?></a>
              <div class="text-muted text-sm"><?php echo number_format((int) $d['file_size']); ?> bytes</div>
            </td>
            <td><?php echo status_badge($d['status']); ?></td>
            <td><?php echo e($d['uploader_name'] ?? '—'); ?></td>
            <td class="text-sm"><?php echo e(format_date($d['created_at'], 'M d, Y H:i')); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'documents/index.php'); ?>

<!-- Upload modal -->
<?php if (has_permission('documents.upload')): ?>
<div class="modal-backdrop" id="uploadModal">
  <div class="modal">
    <div class="modal-head">
      <h3>Upload Document</h3>
      <button type="button" class="btn btn-ghost" data-modal-close>×</button>
    </div>
    <form method="post" action="<?php echo url('documents/upload.php'); ?>" enctype="multipart/form-data">
      <?php echo csrf_field(); ?>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group" style="grid-column:1 / -1">
            <label>Student <span class="req">*</span></label>
            <select name="student_id" required>
              <option value="">— Select student —</option>
              <?php foreach ($students as $s): ?>
                <option value="<?php echo (int) $s['id']; ?>"><?php echo e($s['full_name'] . ' (' . $s['crm_id'] . ')'); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Document Type <span class="req">*</span></label>
            <select name="document_type" required>
              <?php foreach ($types as $t): ?>
                <option value="<?php echo e($t); ?>"><?php echo e(ucwords(strtolower(str_replace('_', ' ', $t)))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group" style="grid-column:1 / -1">
            <label>File <span class="req">*</span></label>
            <input type="file" name="file" required>
            <div class="form-hint">Max <?php echo round(MAX_UPLOAD_SIZE / 1048576, 1); ?>MB · Allowed: <?php echo e(implode(', ', ALLOWED_EXTENSIONS)); ?></div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Upload</button>
      </div>
    </form>
  </div>
</div>
<?php endif; ?>

<?php render_footer();
