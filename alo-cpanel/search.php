<?php
/**
 * Global Search page
 *
 * Accepts ?q=XX and queries across students, leads, applications, universities,
 * courses. Shows combined results.
 */
declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';
require_login();

$pdo = db();
$q = trim((string) ($_GET['q'] ?? ''));
$results = [
    'students'     => [],
    'leads'        => [],
    'applications' => [],
    'universities' => [],
    'courses'      => [],
];
$totalResults = 0;

if ($q !== '' && mb_strlen($q) >= 2) {
    $like = '%' . $q . '%';

    if (has_permission('students.view')) {
        $stmt = $pdo->prepare(
            'SELECT id, crm_id, full_name, email, phone, status
               FROM students
              WHERE full_name LIKE :q OR email LIKE :q2 OR phone LIKE :q3 OR crm_id LIKE :q4
              ORDER BY full_name ASC LIMIT 25'
        );
        $stmt->bindValue(':q', $like); $stmt->bindValue(':q2', $like);
        $stmt->bindValue(':q3', $like); $stmt->bindValue(':q4', $like);
        $stmt->execute();
        $results['students'] = $stmt->fetchAll();
        $totalResults += count($results['students']);
    }

    if (has_permission('leads.view')) {
        $stmt = $pdo->prepare(
            'SELECT id, crm_id, full_name, email, phone, status
               FROM leads
              WHERE full_name LIKE :q OR email LIKE :q2 OR phone LIKE :q3 OR crm_id LIKE :q4
              ORDER BY full_name ASC LIMIT 25'
        );
        $stmt->bindValue(':q', $like); $stmt->bindValue(':q2', $like);
        $stmt->bindValue(':q3', $like); $stmt->bindValue(':q4', $like);
        $stmt->execute();
        $results['leads'] = $stmt->fetchAll();
        $totalResults += count($results['leads']);
    }

    if (has_permission('applications.view')) {
        $stmt = $pdo->prepare(
            'SELECT a.id, a.crm_id, a.status, a.application_date,
                    s.full_name AS student_name, s.crm_id AS student_crm_id,
                    u.name AS university_name
               FROM applications a
          LEFT JOIN students s ON s.id = a.student_id
          LEFT JOIN universities u ON u.id = a.university_id
              WHERE a.crm_id LIKE :q OR a.reference_number LIKE :q2
                 OR s.full_name LIKE :q3
              ORDER BY a.created_at DESC LIMIT 25'
        );
        $stmt->bindValue(':q', $like); $stmt->bindValue(':q2', $like);
        $stmt->bindValue(':q3', $like);
        $stmt->execute();
        $results['applications'] = $stmt->fetchAll();
        $totalResults += count($results['applications']);
    }

    if (has_permission('universities.view')) {
        $stmt = $pdo->prepare(
            'SELECT id, name, country, city, status
               FROM universities
              WHERE name LIKE :q OR country LIKE :q2 OR city LIKE :q3
              ORDER BY name ASC LIMIT 25'
        );
        $stmt->bindValue(':q', $like); $stmt->bindValue(':q2', $like);
        $stmt->bindValue(':q3', $like);
        $stmt->execute();
        $results['universities'] = $stmt->fetchAll();
        $totalResults += count($results['universities']);
    }

    if (has_permission('courses.view')) {
        $stmt = $pdo->prepare(
            'SELECT c.id, c.name, c.level, c.tuition_fee, c.currency, c.status,
                    u.name AS university_name
               FROM courses c
          LEFT JOIN universities u ON u.id = c.university_id
              WHERE c.name LIKE :q OR c.level LIKE :q2 OR u.name LIKE :q3
              ORDER BY c.name ASC LIMIT 25'
        );
        $stmt->bindValue(':q', $like); $stmt->bindValue(':q2', $like);
        $stmt->bindValue(':q3', $like);
        $stmt->execute();
        $results['courses'] = $stmt->fetchAll();
        $totalResults += count($results['courses']);
    }
}

render_header('Search' . ($q !== '' ? ' — ' . $q : ''));
?>
<div class="page-header">
    <div>
        <h1>&#128270; Global Search</h1>
        <div class="breadcrumb">
            <a href="<?php echo e(url('index.php')); ?>">Home</a> &rsaquo; Search
        </div>
    </div>
</div>

<form method="get" action="" class="filters" style="margin-bottom:16px;">
    <div class="form-field" style="flex:1;min-width:280px;">
        <label for="q">Search query</label>
        <input type="search" id="q" name="q" value="<?php echo e($q); ?>" placeholder="Search by name, CRM ID, email, phone…" autofocus>
    </div>
    <div class="form-field">
        <label>&nbsp;</label>
        <button type="submit" class="btn btn-primary">Search</button>
    </div>
</form>

<?php if ($q === ''): ?>
    <div class="empty">Enter a search term above. Search covers students, leads, applications, universities, and courses.</div>
<?php elseif (mb_strlen($q) < 2): ?>
    <div class="alert alert-warning">Please enter at least 2 characters.</div>
<?php elseif ($totalResults === 0): ?>
    <div class="empty">No results found for "<strong><?php echo e($q); ?></strong>".</div>
<?php else: ?>
    <p style="margin:8px 0 16px;color:var(--c-text-muted);">
        <?php echo $totalResults; ?> result(s) for "<strong><?php echo e($q); ?></strong>"
    </p>

    <?php if (!empty($results['students'])): ?>
        <div class="card" style="margin-bottom:16px;">
            <div class="card-head"><h3>Students (<?php echo count($results['students']); ?>)</h3></div>
            <div class="card-body no-pad">
                <table class="data">
                    <thead><tr><th>CRM ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
                    <tbody>
                    <?php foreach ($results['students'] as $s): ?>
                        <tr onclick="window.location='<?php echo e(url('students/view.php?id=' . (int) $s['id'])); ?>'">
                            <td class="mono"><?php echo e($s['crm_id']); ?></td>
                            <td><strong><?php echo e($s['full_name']); ?></strong></td>
                            <td><?php echo e($s['email'] ?? '—'); ?></td>
                            <td><?php echo e($s['phone'] ?? '—'); ?></td>
                            <td><?php echo status_badge($s['status']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

    <?php if (!empty($results['leads'])): ?>
        <div class="card" style="margin-bottom:16px;">
            <div class="card-head"><h3>Leads (<?php echo count($results['leads']); ?>)</h3></div>
            <div class="card-body no-pad">
                <table class="data">
                    <thead><tr><th>CRM ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
                    <tbody>
                    <?php foreach ($results['leads'] as $l): ?>
                        <tr onclick="window.location='<?php echo e(url('leads/view.php?id=' . (int) $l['id'])); ?>'">
                            <td class="mono"><?php echo e($l['crm_id']); ?></td>
                            <td><strong><?php echo e($l['full_name']); ?></strong></td>
                            <td><?php echo e($l['email'] ?? '—'); ?></td>
                            <td><?php echo e($l['phone'] ?? '—'); ?></td>
                            <td><?php echo status_badge($l['status']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

    <?php if (!empty($results['applications'])): ?>
        <div class="card" style="margin-bottom:16px;">
            <div class="card-head"><h3>Applications (<?php echo count($results['applications']); ?>)</h3></div>
            <div class="card-body no-pad">
                <table class="data">
                    <thead><tr><th>CRM ID</th><th>Student</th><th>University</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                    <?php foreach ($results['applications'] as $a): ?>
                        <tr>
                            <td class="mono"><?php echo e($a['crm_id']); ?></td>
                            <td><strong><?php echo e($a['student_name'] ?? '—'); ?></strong>
                                <?php if (!empty($a['student_crm_id'])): ?>
                                    <small class="text-muted">(<?php echo e($a['student_crm_id']); ?>)</small>
                                <?php endif; ?>
                            </td>
                            <td><?php echo e($a['university_name'] ?? '—'); ?></td>
                            <td><?php echo status_badge($a['status']); ?></td>
                            <td class="text-sm"><?php echo e(format_date($a['application_date'])); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

    <?php if (!empty($results['universities'])): ?>
        <div class="card" style="margin-bottom:16px;">
            <div class="card-head"><h3>Universities (<?php echo count($results['universities']); ?>)</h3></div>
            <div class="card-body no-pad">
                <table class="data">
                    <thead><tr><th>Name</th><th>Country</th><th>City</th><th>Status</th></tr></thead>
                    <tbody>
                    <?php foreach ($results['universities'] as $u): ?>
                        <tr onclick="window.location='<?php echo e(url('universities/view.php?id=' . (int) $u['id'])); ?>'">
                            <td><strong><?php echo e($u['name']); ?></strong></td>
                            <td><?php echo e($u['country'] ?? '—'); ?></td>
                            <td><?php echo e($u['city'] ?? '—'); ?></td>
                            <td><?php echo status_badge($u['status']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

    <?php if (!empty($results['courses'])): ?>
        <div class="card" style="margin-bottom:16px;">
            <div class="card-head"><h3>Courses (<?php echo count($results['courses']); ?>)</h3></div>
            <div class="card-body no-pad">
                <table class="data">
                    <thead><tr><th>Name</th><th>University</th><th>Level</th><th>Tuition</th><th>Status</th></tr></thead>
                    <tbody>
                    <?php foreach ($results['courses'] as $c): ?>
                        <tr onclick="window.location='<?php echo e(url('courses/view.php?id=' . (int) $c['id'])); ?>'">
                            <td><strong><?php echo e($c['name']); ?></strong></td>
                            <td><?php echo e($c['university_name'] ?? '—'); ?></td>
                            <td><?php echo e($c['level'] ?? '—'); ?></td>
                            <td><?php echo $c['tuition_fee'] !== null ? format_currency((float) $c['tuition_fee'], $c['currency'] ?? 'USD') : '—'; ?></td>
                            <td><?php echo status_badge($c['status']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>
<?php endif; ?>

<?php render_footer();
