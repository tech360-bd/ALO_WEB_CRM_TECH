<?php
/**
 * Reports — Dashboard
 *
 * Report cards for: Lead Conversion, Counselor Performance, University
 * Performance, Country Performance, Application Conversion, Visa
 * Conversion, Revenue, Commission. Each card has quick stats and CSV
 * export. Date-range filter at the top.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('reports.view');

$pdo = db();

$from = trim($_GET['from'] ?? '');
$to   = trim($_GET['to']   ?? '');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) $from = '';
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to))   $to   = '';

$dateWhere = '';
$dateArgs  = [];
if ($from !== '' && $to !== '') {
    $dateWhere = ' AND created_at BETWEEN :from AND :to';
    $dateArgs[':from'] = $from . ' 00:00:00';
    $dateArgs[':to']   = $to   . ' 23:59:59';
}

/* Aggregate KPIs for the cards */
$leadCount = (int) $pdo->query("SELECT COUNT(*) FROM leads WHERE 1=1" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$enrolledLeads = (int) $pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'ENROLLED'" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$leadConversion = $leadCount > 0 ? round(($enrolledLeads / $leadCount) * 100, 1) : 0;

$appCount = (int) $pdo->query("SELECT COUNT(*) FROM applications WHERE 1=1" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$enrolledApps = (int) $pdo->query("SELECT COUNT(*) FROM applications WHERE status = 'ENROLLED'" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$appConversion = $appCount > 0 ? round(($enrolledApps / $appCount) * 100, 1) : 0;

$visaApps = (int) $pdo->query("SELECT COUNT(*) FROM applications WHERE status IN ('VISA_GRANTED','VISA_REFUSED','ENROLLED')" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$visaGranted = (int) $pdo->query("SELECT COUNT(*) FROM applications WHERE status IN ('VISA_GRANTED','ENROLLED')" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$visaConversion = $visaApps > 0 ? round(($visaGranted / $visaApps) * 100, 1) : 0;

$totalRevenue = (float) $pdo->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='COMPLETED'" . ($from && $to ? ' AND paid_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();
$commissionDue = (float) $pdo->query("SELECT COALESCE(SUM(amount),0) FROM commissions WHERE status IN ('PENDING','APPROVED')" . ($from && $to ? ' AND created_at BETWEEN ' . $pdo->quote($from.' 00:00:00') . ' AND ' . $pdo->quote($to.' 23:59:59') : ''))->fetchColumn();

/* Reports catalog */
$reports = [
    [
        'id'    => 'lead_conversion',
        'title' => 'Lead Conversion',
        'desc'  => 'Conversion of leads through the pipeline to enrolment.',
        'icon'  => '&#128202;',
        'stats' => [
            ['Total Leads',     number_format($leadCount)],
            ['Enrolled Leads',   number_format($enrolledLeads)],
            ['Conversion Rate',  $leadConversion . '%'],
        ],
        'csv'   => 'lead-conversion',
    ],
    [
        'id'    => 'counselor_performance',
        'title' => 'Counselor Performance',
        'desc'  => 'Per-counselor breakdown of leads, students and conversion.',
        'icon'  => '&#11088;',
        'stats' => [],
        'csv'   => 'counselor-performance',
    ],
    [
        'id'    => 'university_performance',
        'title' => 'University Performance',
        'desc'  => 'Applications, offers and enrolments per university.',
        'icon'  => '&#127963;',
        'stats' => [],
        'csv'   => 'university-performance',
    ],
    [
        'id'    => 'country_performance',
        'title' => 'Country Performance',
        'desc'  => 'Leads and students by preferred country.',
        'icon'  => '&#127758;',
        'stats' => [],
        'csv'   => 'country-performance',
    ],
    [
        'id'    => 'application_conversion',
        'title' => 'Application Conversion',
        'desc'  => 'Applications vs enrolments.',
        'icon'  => '&#128203;',
        'stats' => [
            ['Total Applications', number_format($appCount)],
            ['Enrolled',            number_format($enrolledApps)],
            ['Conversion',          $appConversion . '%'],
        ],
        'csv'   => 'application-conversion',
    ],
    [
        'id'    => 'visa_conversion',
        'title' => 'Visa Conversion',
        'desc'  => 'Visa-granted vs visa-refused applications.',
        'icon'  => '&#128181;',
        'stats' => [
            ['Visa Applications', number_format($visaApps)],
            ['Visa Granted',      number_format($visaGranted)],
            ['Approval Rate',     $visaConversion . '%'],
        ],
        'csv'   => 'visa-conversion',
    ],
    [
        'id'    => 'revenue',
        'title' => 'Revenue',
        'desc'  => 'Completed payments by currency and month.',
        'icon'  => '&#128176;',
        'stats' => [
            ['Total Revenue', format_currency($totalRevenue)],
        ],
        'csv'   => 'revenue',
    ],
    [
        'id'    => 'commission',
        'title' => 'Commission',
        'desc'  => 'Commission due, approved and paid by agent.',
        'icon'  => '&#129534;',
        'stats' => [
            ['Commission Due', format_currency($commissionDue, 'USD')],
        ],
        'csv'   => 'commission',
    ],
];

render_header('Reports');
?>
<div class="toolbar">
  <h1>Reports</h1>
</div>

<form class="filters" method="get">
  <div class="form-field">
    <label>From Date</label>
    <input type="date" name="from" value="<?php echo e($from); ?>">
  </div>
  <div class="form-field">
    <label>To Date</label>
    <input type="date" name="to" value="<?php echo e($to); ?>">
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Apply Range</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('reports/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="cards-grid">
  <?php foreach ($reports as $r): ?>
    <div class="card">
      <div class="card-head">
        <h3><span style="margin-right:6px"><?php echo $r['icon']; ?></span><?php echo e($r['title']); ?></h3>
        <?php if (has_permission('reports.export')): ?>
          <a href="<?php echo url('reports/export.php?type=' . $r['csv'] . '&from=' . $from . '&to=' . $to); ?>" class="btn btn-sm">⤓ CSV</a>
        <?php endif; ?>
      </div>
      <div class="card-body">
        <p class="text-sm text-muted" style="margin:0 0 10px"><?php echo e($r['desc']); ?></p>
        <?php if (!empty($r['stats'])): ?>
          <div class="stat-row">
            <?php foreach ($r['stats'] as $st): ?>
              <div class="stat">
                <div class="v"><?php echo e($st[1]); ?></div>
                <div class="l"><?php echo e($st[0]); ?></div>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
        <a href="<?php echo url('reports/detail.php?type=' . $r['id'] . '&from=' . $from . '&to=' . $to); ?>" class="btn btn-sm">View details →</a>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<?php render_footer();
