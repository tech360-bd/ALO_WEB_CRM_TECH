<?php
/**
 * ALO Education CRM — Super Admin Dashboard / Command Center
 *
 * Shows:
 *   - 16 KPI cards (students, leads, applications, offers, CAS,
 *     visas, enrolments, tasks, communications, campaigns, revenue)
 *   - Recent activity feed
 *   - System alerts (pending tasks, overdue invoices)
 *   - Quick action buttons
 *   - 3 charts: lead pipeline, monthly applications, monthly revenue
 */
declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';
require_login();
require_once __DIR__ . '/app/layout.php';

/* ============================================================
   Helper — run a count query safely (returns 0 on error)
   ============================================================ */
function alo_count(string $sql, array $params = []): int
{
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $val = $stmt->fetchColumn();
        return $val === false ? 0 : (int) $val;
    } catch (Throwable $e) {
        return 0;
    }
}

function alo_sum(string $sql, array $params = []): float
{
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $val = $stmt->fetchColumn();
        return $val === false || $val === null ? 0.0 : (float) $val;
    } catch (Throwable $e) {
        return 0.0;
    }
}

function alo_rows(string $sql, array $params = []): array
{
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll() ?: [];
    } catch (Throwable $e) {
        return [];
    }
}

/* ============================================================
   Current user snapshot (safe-null)
   ============================================================ */
$currentUser = current_user();
$userId      = (int) ($currentUser['id'] ?? 0);
$userName    = $currentUser['name'] ?? 'User';

/* ============================================================
   KPI calculations
   ============================================================ */
$yearStart   = date('Y-01-01');
$monthStart  = date('Y-m-01');
$last30Start = date('Y-m-d', strtotime('-30 days'));

$totalStudents   = alo_count('SELECT COUNT(*) FROM students');
$totalLeads      = alo_count('SELECT COUNT(*) FROM leads');
$newLeads        = alo_count("SELECT COUNT(*) FROM leads WHERE status = 'NEW'");
$hotLeads        = alo_count('SELECT COUNT(*) FROM leads WHERE lead_score >= 70');
$totalApps       = alo_count('SELECT COUNT(*) FROM applications');
$offersCount     = alo_count("SELECT COUNT(*) FROM applications WHERE status IN ('CONDITIONAL_OFFER','UNCONDITIONAL_OFFER')");
$casCount        = alo_count("SELECT COUNT(*) FROM applications WHERE status IN ('CAS_PENDING','CAS_ISSUED')");
$visaAppsCount   = alo_count("SELECT COUNT(*) FROM applications WHERE status IN ('VISA_PENDING','VISA_GRANTED','VISA_REFUSED')");
$visaSuccess     = alo_count("SELECT COUNT(*) FROM applications WHERE status = 'VISA_GRANTED'");
$enrolments      = alo_count("SELECT COUNT(*) FROM applications WHERE status = 'ENROLLED'");
$totalTasks      = alo_count('SELECT COUNT(*) FROM tasks');
$pendingTasks    = alo_count("SELECT COUNT(*) FROM tasks WHERE status IN ('PENDING','IN_PROGRESS')");
$totalComms      = alo_count('SELECT COUNT(*) FROM communications');
$activeCampaigns = alo_count("SELECT COUNT(*) FROM marketing_campaigns WHERE status IN ('ACTIVE','PAUSED','DRAFT')");

// Revenue = sum of completed payments in current year
$revenue = alo_sum(
    "SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'COMPLETED' AND created_at >= :ys",
    [':ys' => $yearStart]
);

// Outstanding = sum of unpaid invoices
$outstanding = alo_sum(
    "SELECT COALESCE(SUM(amount),0) FROM invoices WHERE status IN ('PENDING','PARTIAL','OVERDUE')"
);

/* ============================================================
   Lead pipeline (status-wise counts) — for chart
   ============================================================ */
$leadStatuses = ['NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED'];
$leadPipeline = [];
foreach ($leadStatuses as $st) {
    $leadPipeline[$st] = alo_count("SELECT COUNT(*) FROM leads WHERE status = :s", [':s' => $st]);
}
$maxLeadPipeline = max(1, max($leadPipeline));

/* ============================================================
   Monthly applications chart (last 6 months)
   ============================================================ */
$monthlyApps = [];
for ($i = 5; $i >= 0; $i--) {
    $mStart = date('Y-m-01', strtotime("-$i months"));
    $mEnd   = date('Y-m-t',  strtotime("-$i months"));
    $count  = alo_count(
        "SELECT COUNT(*) FROM applications WHERE application_date BETWEEN :s AND :e",
        [':s' => $mStart, ':e' => $mEnd]
    );
    $monthlyApps[] = [
        'label' => date('M', strtotime($mStart)),
        'value' => $count,
    ];
}
$maxMonthlyApps = max(1, max(array_map(fn($m) => $m['value'], $monthlyApps)));

/* ============================================================
   Monthly revenue chart (last 6 months)
   ============================================================ */
$monthlyRevenue = [];
for ($i = 5; $i >= 0; $i--) {
    $mStart = date('Y-m-01', strtotime("-$i months"));
    $mEnd   = date('Y-m-t',  strtotime("-$i months"));
    $sum    = alo_sum(
        "SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'COMPLETED' AND created_at BETWEEN :s AND :e",
        [':s' => $mStart, ':e' => $mEnd]
    );
    $monthlyRevenue[] = [
        'label' => date('M', strtotime($mStart)),
        'value' => $sum,
    ];
}
$maxMonthlyRevenue = max(1.0, max(array_map(fn($m) => $m['value'], $monthlyRevenue)));

/* ============================================================
   Recent activities (last 8)
   ============================================================ */
$recentActivities = alo_rows(
    "SELECT a.*, u.name AS user_name
     FROM activities a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT 8"
);

/* ============================================================
   System alerts: pending tasks (assigned to current user) & overdue invoices
   ============================================================ */
$myPendingTasks = alo_rows(
    "SELECT id, title, due_date, priority, status
     FROM tasks
     WHERE assigned_to = :uid AND status IN ('PENDING','IN_PROGRESS')
     ORDER BY (due_date IS NULL), due_date ASC
     LIMIT 6",
    [':uid' => $userId]
);

$overdueInvoices = alo_rows(
    "SELECT i.id, i.invoice_number, i.amount, i.currency, i.due_date,
            s.full_name AS student_name
     FROM invoices i
     JOIN students s ON s.id = i.student_id
     WHERE i.status IN ('PENDING','PARTIAL','OVERDUE')
       AND i.due_date IS NOT NULL
       AND i.due_date < CURDATE()
     ORDER BY i.due_date ASC
     LIMIT 6"
);

/* ============================================================
   Top sources (for sidebar mini-chart)
   ============================================================ */
$topSources = alo_rows(
    "SELECT source, COUNT(*) AS c
     FROM leads
     WHERE source IS NOT NULL AND source != ''
     GROUP BY source
     ORDER BY c DESC
     LIMIT 5"
);
$maxSourceCount = 1;
foreach ($topSources as $ts) {
    if ((int) $ts['c'] > $maxSourceCount) $maxSourceCount = (int) $ts['c'];
}

/* ============================================================
   Build & render
   ============================================================ */
$breadcrumbs = '<a href="' . e(url('index.php')) . '">Home</a> &rsaquo; Dashboard';

$actions = '';
if (has_permission('leads.create')) {
    $actions .= '<a href="' . e(url('leads/create.php')) . '" class="btn btn-primary btn-sm">+ Add Lead</a> ';
}
if (has_permission('students.create')) {
    $actions .= '<a href="' . e(url('students/create.php')) . '" class="btn btn-secondary btn-sm">+ Add Student</a>';
}

render_header('Dashboard', [
    'breadcrumbs' => $breadcrumbs,
    'actions'      => $actions,
]);
?>
<div class="page-header">
    <div>
        <h1>Command Center</h1>
        <div class="breadcrumb">Welcome back, <strong><?php echo e($userName); ?></strong> &middot; <?php echo e(date('l, F j, Y')); ?></div>
    </div>
    <div class="actions">
        <?php if (has_permission('leads.create')): ?>
            <a href="<?php echo e(url('leads/create.php')); ?>" class="btn btn-primary btn-sm">+ Add Lead</a>
        <?php endif; ?>
        <?php if (has_permission('students.create')): ?>
            <a href="<?php echo e(url('students/create.php')); ?>" class="btn btn-secondary btn-sm">+ Add Student</a>
        <?php endif; ?>
        <?php if (has_permission('tasks.create')): ?>
            <a href="<?php echo e(url('tasks/create.php')); ?>" class="btn btn-secondary btn-sm">+ New Task</a>
        <?php endif; ?>
        <?php if (has_permission('communications.create')): ?>
            <a href="<?php echo e(url('communications/compose.php')); ?>" class="btn btn-info btn-sm">&#9993; Compose</a>
        <?php endif; ?>
    </div>
</div>

<!-- ============================================================
     System alerts
     ============================================================ -->
<?php if (!empty($myPendingTasks) || !empty($overdueInvoices)): ?>
<div class="alert alert-warning no-print" style="display:block;">
    <span style="font-size:1.2rem;">&#9888;</span>
    <div>
        <strong>Action required.</strong>
        <?php if (!empty($myPendingTasks)): ?>
            You have <strong><?php echo count($myPendingTasks); ?></strong> pending task(s).
        <?php endif; ?>
        <?php if (!empty($overdueInvoices)): ?>
            <?php echo count($overdueInvoices); ?> overdue invoice(s) need follow-up.
        <?php endif; ?>
    </div>
    <button class="close" onclick="this.parentNode.remove()">&times;</button>
</div>
<?php endif; ?>

<!-- ============================================================
     KPI cards (16)
     ============================================================ -->
<h3 style="margin-top:8px;color:var(--c-text-muted);font-size:.85rem;text-transform:uppercase;letter-spacing:.6px;">Key Metrics</h3>
<div class="grid grid-4 mb-24">
    <?php
    stat_card('Total Students', $totalStudents,   "\u{1F393}", 'info',     '+' . alo_count("SELECT COUNT(*) FROM students WHERE created_at >= :m", [':m' => $monthStart]) . ' this month', 'students/');
    stat_card('Total Leads',     $totalLeads,      "\u{1F4C8}", 'blue',    '+' . alo_count("SELECT COUNT(*) FROM leads WHERE created_at >= :m", [':m' => $monthStart]) . ' this month', 'leads/');
    stat_card('New Leads',       $newLeads,        "\u{2795}",  'orange',  $totalLeads > 0 ? round(($newLeads / max(1, $totalLeads)) * 100) . '% of total' : '—', 'leads/?status=NEW');
    stat_card('Hot Leads',        $hotLeads,        "\u{1F525}", 'danger',  'Score &ge; 70', 'leads/?hot=1');
    stat_card('Applications',     $totalApps,      "\u{1F4DD}", 'blue',    'All-time', 'applications/');
    stat_card('Offers',           $offersCount,    "\u{1F4E4}", 'success', 'Conditional + Unconditional', 'applications/?status=CONDITIONAL_OFFER');
    stat_card('CAS Issued',       $casCount,       "\u{1F4DC}", 'sunshine','Pending + Issued', 'applications/?status=CAS_ISSUED');
    stat_card('Visa Applications', $visaAppsCount,  "\u{1F6C2}", 'info',    'Pending + Granted + Refused', 'applications/?visa=1');
    stat_card('Visa Success',     $visaSuccess,    "\u{2705}",  'success', $visaAppsCount > 0 ? round(($visaSuccess / max(1, $visaAppsCount)) * 100) . '% success rate' : '—', 'applications/?status=VISA_GRANTED');
    stat_card('Enrolments',       $enrolments,     "\u{1F391}", 'success', 'Fully enrolled', 'applications/?status=ENROLLED');
    stat_card('Tasks',            $totalTasks,     "\u{2714}",  'blue',    'All tasks', 'tasks/');
    stat_card('Pending Tasks',    $pendingTasks,   "\u{23F3}",  'warning', $totalTasks > 0 ? round(($pendingTasks / max(1, $totalTasks)) * 100) . '% of total' : '—', 'tasks/?status=PENDING');
    stat_card('Communications',   $totalComms,     "\u{1F4E7}", 'info',    'All channels', 'communications/');
    stat_card('Marketing Campaigns', $activeCampaigns, "\u{1F4E1}", 'orange', 'Active + Drafted', 'marketing/');
    stat_card('Revenue (YTD)',    format_currency($revenue, 'BDT'), "\u{1F4B0}", 'success', 'Year-to-date collected', 'finance/');
    stat_card('Outstanding Payments', format_currency($outstanding, 'BDT'), "\u{1F4B8}", 'danger', 'Unpaid invoices', 'finance/?status=OVERDUE');
    ?>
</div>

<!-- ============================================================
     Quick Actions
     ============================================================ -->
<div class="card mb-24">
    <div class="card-header">
        <h3>Quick Actions</h3>
    </div>
    <div class="card-body">
        <div class="quick-actions">
            <?php if (has_permission('leads.create')): ?>
            <a class="quick-action" href="<?php echo e(url('leads/create.php')); ?>">
                <span class="qa-icon">+</span>
                <span>Add Lead</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('students.create')): ?>
            <a class="quick-action" href="<?php echo e(url('students/create.php')); ?>">
                <span class="qa-icon">&#127891;</span>
                <span>Add Student</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('tasks.create')): ?>
            <a class="quick-action" href="<?php echo e(url('tasks/create.php')); ?>">
                <span class="qa-icon">&#9989;</span>
                <span>New Task</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('communications.create')): ?>
            <a class="quick-action" href="<?php echo e(url('communications/compose.php')); ?>">
                <span class="qa-icon">&#9993;</span>
                <span>Compose Email</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('applications.create')): ?>
            <a class="quick-action" href="<?php echo e(url('applications/create.php')); ?>">
                <span class="qa-icon">&#128221;</span>
                <span>New Application</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('finance.create')): ?>
            <a class="quick-action" href="<?php echo e(url('finance/invoices/create.php')); ?>">
                <span class="qa-icon">&#129689;</span>
                <span>New Invoice</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('marketing.create')): ?>
            <a class="quick-action" href="<?php echo e(url('marketing/campaigns/create.php')); ?>">
                <span class="qa-icon">&#128227;</span>
                <span>New Campaign</span>
            </a>
            <?php endif; ?>
            <?php if (has_permission('reports.view')): ?>
            <a class="quick-action" href="<?php echo e(url('reports/')); ?>">
                <span class="qa-icon">&#128202;</span>
                <span>View Reports</span>
            </a>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- ============================================================
     Charts row
     ============================================================ -->
<div class="grid grid-3 mb-24">
    <!-- Lead pipeline -->
    <div class="card">
        <div class="card-header">
            <h3>Lead Pipeline</h3>
            <span class="badge badge-neutral"><?php echo array_sum($leadPipeline); ?> total</span>
        </div>
        <div class="card-body">
            <div class="bar-chart">
                <?php foreach ($leadPipeline as $status => $count):
                    $height = $maxLeadPipeline > 0 ? round(($count / $maxLeadPipeline) * 100) : 0;
                    $short = substr($status, 0, 4);
                ?>
                <div class="bar-col">
                    <div class="bar" style="height:<?php echo $height; ?>%;"
                         title="<?php echo e($status); ?>: <?php echo $count; ?>"></div>
                    <div class="bar-value"><?php echo $count; ?></div>
                    <div class="bar-label"><?php echo e(ucfirst(strtolower($short))); ?></div>
                </div>
                <?php endforeach; ?>
            </div>
            <div class="text-muted text-center" style="font-size:.74rem;margin-top:8px;">
                Distribution of leads by pipeline stage
            </div>
        </div>
    </div>

    <!-- Monthly applications -->
    <div class="card">
        <div class="card-header">
            <h3>Applications (6 mo)</h3>
            <span class="badge badge-info"><?php echo array_sum(array_map(fn($m) => $m['value'], $monthlyApps)); ?> total</span>
        </div>
        <div class="card-body">
            <div class="bar-chart primary">
                <?php foreach ($monthlyApps as $m):
                    $height = $maxMonthlyApps > 0 ? round(($m['value'] / $maxMonthlyApps) * 100) : 0;
                ?>
                <div class="bar-col">
                    <div class="bar" style="height:<?php echo $height; ?>%;"
                         title="<?php echo e($m['label']); ?>: <?php echo $m['value']; ?>"></div>
                    <div class="bar-value"><?php echo $m['value']; ?></div>
                    <div class="bar-label"><?php echo e($m['label']); ?></div>
                </div>
                <?php endforeach; ?>
            </div>
            <div class="text-muted text-center" style="font-size:.74rem;margin-top:8px;">
                Monthly application submissions
            </div>
        </div>
    </div>

    <!-- Monthly revenue -->
    <div class="card">
        <div class="card-header">
            <h3>Revenue (6 mo)</h3>
            <span class="badge badge-success"><?php echo format_currency(array_sum(array_map(fn($m) => $m['value'], $monthlyRevenue)), 'BDT'); ?></span>
        </div>
        <div class="card-body">
            <div class="bar-chart success">
                <?php foreach ($monthlyRevenue as $m):
                    $height = $maxMonthlyRevenue > 0 ? round(($m['value'] / $maxMonthlyRevenue) * 100) : 0;
                ?>
                <div class="bar-col">
                    <div class="bar" style="height:<?php echo $height; ?>%;"
                         title="<?php echo e($m['label']); ?>: <?php echo format_currency($m['value'], 'BDT'); ?>"></div>
                    <div class="bar-value"><?php echo $m['value'] >= 1000 ? round($m['value'] / 1000) . 'K' : (int) $m['value']; ?></div>
                    <div class="bar-label"><?php echo e($m['label']); ?></div>
                </div>
                <?php endforeach; ?>
            </div>
            <div class="text-muted text-center" style="font-size:.74rem;margin-top:8px;">
                Successful payments per month
            </div>
        </div>
    </div>
</div>

<!-- ============================================================
     Activity feed + alerts + top sources
     ============================================================ -->
<div class="grid grid-3 mb-24">
    <!-- Recent activity -->
    <div class="card" style="grid-column: span 2;">
        <div class="card-header">
            <h3>Recent Activity</h3>
            <a href="<?php echo e(url('admin/activity.php')); ?>" class="btn btn-link btn-sm">View all</a>
        </div>
        <div class="card-body card-body-flush">
            <?php if (empty($recentActivities)): ?>
                <div class="empty-state">
                    <div class="empty-icon">&#128203;</div>
                    <h3>No recent activity</h3>
                    <p>Actions performed by your team will appear here.</p>
                </div>
            <?php else: ?>
            <ul class="activity-feed" style="padding:0 18px;">
                <?php foreach ($recentActivities as $act):
                    $typeIcon = match ($act['type'] ?? 'system') {
                        'lead.created'      => "\u{1F4C8}",
                        'student.created'   => "\u{1F393}",
                        'application.created' => "\u{1F4DD}",
                        'task.completed'     => "\u{2705}",
                        'communication.sent' => "\u{1F4E7}",
                        'payment.received'   => "\u{1F4B0}",
                        default             => "\u{2139}",
                    };
                ?>
                <li>
                    <div class="activity-icon"><?php echo $typeIcon; ?></div>
                    <div style="flex:1;">
                        <div class="activity-text"><?php echo e($act['description'] ?? ''); ?></div>
                        <div class="activity-meta">
                            <?php if (!empty($act['user_name'])): ?>
                                <strong><?php echo e($act['user_name']); ?></strong> &middot;
                            <?php endif; ?>
                            <?php echo format_date($act['created_at'] ?? null, 'M d, Y g:i A'); ?>
                        </div>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
            <?php endif; ?>
        </div>
    </div>

    <!-- My pending tasks -->
    <div class="card">
        <div class="card-header">
            <h3>My Tasks</h3>
            <a href="<?php echo e(url('tasks/')); ?>" class="btn btn-link btn-sm">All</a>
        </div>
        <div class="card-body card-body-flush">
            <?php if (empty($myPendingTasks)): ?>
                <div class="empty-state" style="padding:24px;">
                    <div class="empty-icon">&#9989;</div>
                    <h3>All caught up!</h3>
                    <p>You have no pending tasks.</p>
                </div>
            <?php else: ?>
            <ul class="timeline" style="padding:14px 18px;">
                <?php foreach ($myPendingTasks as $task):
                    $isOverdue = !empty($task['due_date']) && strtotime($task['due_date']) < time();
                    $priorityCls = match ($task['priority'] ?? 'MEDIUM') {
                        'URGENT'  => 'danger',
                        'HIGH'    => 'warning',
                        'MEDIUM'  => 'info',
                        default   => '',
                    };
                ?>
                <li class="<?php echo $priorityCls; ?>">
                    <div class="timeline-title">
                        <a href="<?php echo e(url('tasks/view.php?id=' . (int) $task['id'])); ?>"><?php echo e($task['title']); ?></a>
                    </div>
                    <div class="timeline-meta">
                        <?php if (!empty($task['due_date'])): ?>
                            Due <?php echo format_date($task['due_date'], 'M d, Y g:i A'); ?>
                            <?php if ($isOverdue): ?>
                                <span class="badge badge-danger badge-sm">OVERDUE</span>
                            <?php endif; ?>
                        <?php else: ?>
                            No due date
                        <?php endif; ?>
                        &middot;
                        <span class="badge badge-sm"><?php echo e($task['priority']); ?></span>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- ============================================================
     Overdue invoices + Top sources
     ============================================================ -->
<div class="grid grid-2">
    <!-- Overdue invoices -->
    <div class="card">
        <div class="card-header">
            <h3>Overdue Invoices</h3>
            <a href="<?php echo e(url('finance/invoices/?status=OVERDUE')); ?>" class="btn btn-link btn-sm">All</a>
        </div>
        <div class="card-body card-body-flush">
            <?php if (empty($overdueInvoices)): ?>
                <div class="empty-state" style="padding:24px;">
                    <div class="empty-icon">&#128176;</div>
                    <h3>No overdue invoices</h3>
                    <p>Everything is up to date.</p>
                </div>
            <?php else: ?>
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Student</th>
                            <th>Amount</th>
                            <th>Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($overdueInvoices as $inv): ?>
                        <tr>
                            <td><a href="<?php echo e(url('finance/invoices/view.php?id=' . (int) $inv['id'])); ?>"><?php echo e($inv['invoice_number']); ?></a></td>
                            <td><?php echo e($inv['student_name']); ?></td>
                            <td><strong><?php echo format_currency($inv['amount'], $inv['currency']); ?></strong></td>
                            <td><span class="badge badge-danger badge-sm"><?php echo format_date($inv['due_date']); ?></span></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Top lead sources -->
    <div class="card">
        <div class="card-header">
            <h3>Top Lead Sources</h3>
            <a href="<?php echo e(url('reports/leads-by-source.php')); ?>" class="btn btn-link btn-sm">Report</a>
        </div>
        <div class="card-body">
            <?php if (empty($topSources)): ?>
                <div class="empty-state" style="padding:24px;">
                    <div class="empty-icon">&#128202;</div>
                    <h3>No data yet</h3>
                    <p>Lead source breakdown will appear here.</p>
                </div>
            <?php else: ?>
            <ul class="bar-list">
                <?php foreach ($topSources as $ts):
                    $pct = $maxSourceCount > 0 ? round(($ts['c'] / $maxSourceCount) * 100) : 0;
                ?>
                <li>
                    <span><?php echo e(ucfirst(strtolower((string) $ts['source']))); ?></span>
                    <div class="bar-track"><div class="bar-fill" style="width:<?php echo $pct; ?>%;"></div></div>
                    <strong><?php echo (int) $ts['c']; ?></strong>
                </li>
                <?php endforeach; ?>
            </ul>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php render_footer(); ?>
