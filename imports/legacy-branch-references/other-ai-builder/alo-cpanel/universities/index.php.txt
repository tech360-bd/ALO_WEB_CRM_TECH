<?php
/**
 * Universities — List page (card grid)
 *
 * Card layout: logo, name, country, ranking, course count.
 * Filters: search by name + country.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('universities.view');

$pdo = db();

$search  = trim($_GET['search']  ?? '');
$country = trim($_GET['country'] ?? '');
$page    = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 12;

$where = []; $args = [];
if ($search !== '')  { $where[] = '(u.name LIKE :q OR u.city LIKE :q)'; $args[':q'] = '%' . $search . '%'; }
if ($country !== '')  { $where[] = 'u.country = :c'; $args[':c'] = $country; }
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM universities u {$whereSql}");
$countStmt->execute($args);
$total      = (int) $countStmt->fetchColumn();
$totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT u.*,
               (SELECT COUNT(*) FROM courses c WHERE c.university_id = u.id) AS course_count
          FROM universities u
          {$whereSql}
      ORDER BY u.name ASC
         LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($args as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$unis = $stmt->fetchAll();

$countries = $pdo->query("SELECT DISTINCT country FROM universities WHERE country IS NOT NULL AND country <> '' ORDER BY country")->fetchAll(PDO::FETCH_COLUMN);

render_header('Universities');
?>
<div class="toolbar">
  <h1>Universities</h1>
  <?php if (has_permission('universities.create')): ?>
    <a href="<?php echo url('universities/create.php'); ?>" class="btn btn-primary">+ Add University</a>
  <?php endif; ?>
</div>

<form class="filters" method="get">
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
    <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="University or city">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('universities/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<?php if (!$unis): ?>
  <div class="card"><div class="card-body"><?php render_empty('No universities found.'); ?></div></div>
<?php else: ?>
  <div class="cards-grid">
    <?php foreach ($unis as $u): ?>
      <a href="<?php echo url('universities/view.php?id=' . (int) $u['id']); ?>" class="uni-card">
        <div class="uni-logo"><?php echo e(mb_strtoupper(mb_substr((string) $u['name'], 0, 1))); ?></div>
        <div class="uni-name"><?php echo e($u['name']); ?></div>
        <div class="uni-meta">
          <?php echo e($u['country'] ?? '—'); ?>
          <?php if (!empty($u['city'])): ?> · <?php echo e($u['city']); ?><?php endif; ?>
        </div>
        <?php if (!empty($u['ranking'])): ?>
          <div class="uni-meta">Ranking: <span class="uni-rank">#<?php echo (int) $u['ranking']; ?></span></div>
        <?php endif; ?>
        <div class="uni-meta"><?php echo (int) $u['course_count']; ?> course<?php echo $u['course_count'] == 1 ? '' : 's'; ?></div>
        <?php if (!empty($u['website'])): ?>
          <div class="uni-meta text-sm"><a href="<?php echo e($u['website']); ?>" target="_blank" rel="noopener" onclick="event.stopPropagation();"><?php echo e($u['website']); ?></a></div>
        <?php endif; ?>
      </a>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<?php render_pagination($page, $totalPages, 'universities/index.php'); ?>

<?php render_footer();
