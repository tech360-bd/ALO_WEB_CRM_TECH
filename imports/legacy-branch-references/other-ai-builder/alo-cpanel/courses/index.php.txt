<?php
/**
 * Courses — List page
 *
 * Table of courses with university and level filters.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('courses.view');

$pdo = db();

$universityId = trim($_GET['university'] ?? '');
$level        = trim($_GET['level']       ?? '');
$search       = trim($_GET['search']     ?? '');
$page         = max(1, (int) ($_GET['page'] ?? 1));
$perPage      = 20;

$where = []; $args = [];
if ($universityId !== '') { $where[] = 'c.university_id = :uid'; $args[':uid'] = (int) $universityId; }
if ($level !== '')         { $where[] = 'c.level = :level'; $args[':level'] = $level; }
if ($search !== '')         { $where[] = '(c.name LIKE :q OR c.description LIKE :q)'; $args[':q'] = '%' . $search . '%'; }
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM courses c {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT c.*, u.name AS university_name
          FROM courses c
     LEFT JOIN universities u ON u.id = c.university_id
          {$whereSql}
      ORDER BY u.name ASC, c.name ASC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$courses = $stmt->fetchAll();

$universities = $pdo->query("SELECT id, name FROM universities ORDER BY name")->fetchAll();
$levels = $pdo->query("SELECT DISTINCT level FROM courses WHERE level IS NOT NULL AND level <> '' ORDER BY level")->fetchAll(PDO::FETCH_COLUMN);

render_header('Courses');
?>
<div class="toolbar">
  <h1>Courses</h1>
  <?php if (has_permission('courses.create')): ?>
    <a href="<?php echo url('courses/create.php'); ?>" class="btn btn-primary">+ Add Course</a>
  <?php endif; ?>
</div>

<form class="filters" method="get">
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
    <label>Level</label>
    <select name="level">
      <option value="">All levels</option>
      <?php foreach ($levels as $lv): ?>
        <option value="<?php echo e($lv); ?>" <?php if ($level === $lv) echo 'selected'; ?>><?php echo e($lv); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>Search</label>
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="Course name">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('courses/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card">
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Course</th>
          <th>University</th>
          <th>Level</th>
          <th>Duration</th>
          <th>Tuition</th>
          <th>Intake</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$courses): ?>
          <tr><td colspan="6"><div class="empty">No courses found.</div></td></tr>
        <?php else: foreach ($courses as $c): ?>
          <tr onclick="window.location='<?php echo url('courses/view.php?id=' . (int) $c['id']); ?>'">
            <td><strong><?php echo e($c['name']); ?></strong></td>
            <td><?php echo e($c['university_name'] ?? '—'); ?></td>
            <td><?php echo e($c['level'] ?? '—'); ?></td>
            <td><?php echo e($c['duration'] ?? '—'); ?></td>
            <td>
              <?php if ($c['tuition_fee'] !== null): ?>
                <?php echo format_currency((float) $c['tuition_fee'], $c['currency'] ?? 'USD'); ?>
              <?php else: ?>
                —
              <?php endif; ?>
            </td>
            <td class="text-sm"><?php echo e($c['intake'] ?? '—'); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_pagination($page, $totalPages, 'courses/index.php'); ?>

<?php render_footer();
