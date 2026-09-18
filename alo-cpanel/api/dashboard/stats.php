<?php
/**
 * API — Dashboard stats
 *
 * GET — returns the same KPI counts shown on the main dashboard.
 *
 * Returns JSON with all dashboard KPI counts:
 *   {
 *     students: int, leads: int, new_leads: int, hot_leads: int,
 *     applications: int, offers: int, cas: int, visas: int, visa_success: int,
 *     enrolments: int, tasks: int, pending_tasks: int,
 *     communications: int, active_campaigns: int,
 *     revenue_ytd: float, outstanding: float,
 *     lead_pipeline: {status: count, ...},
 *     monthly_applications: [{label, value}, ...],
 *     monthly_revenue: [{label, value}, ...]
 *   }
 */
declare(strict_types=1);

require_once __DIR__ . '/../../app/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    json_response(['error' => 'Authentication required'], 401);
}
if (!has_permission('dashboard.view')) {
    json_response(['error' => 'Forbidden'], 403);
}

$pdo = db();

$alo_count = static function (string $sql, array $params = []) use ($pdo): int {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $v = $stmt->fetchColumn();
        return $v === false ? 0 : (int) $v;
    } catch (Throwable $e) {
        return 0;
    }
};

$alo_sum = static function (string $sql, array $params = []) use ($pdo): float {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $v = $stmt->fetchColumn();
        return $v === false || $v === null ? 0.0 : (float) $v;
    } catch (Throwable $e) {
        return 0.0;
    }
};

$yearStart   = date('Y-01-01');
$monthStart  = date('Y-m-01');
$last30Start = date('Y-m-d', strtotime('-30 days'));

/* KPI counts */
$totalStudents   = $alo_count('SELECT COUNT(*) FROM students');
$totalLeads      = $alo_count('SELECT COUNT(*) FROM leads');
$newLeads        = $alo_count("SELECT COUNT(*) FROM leads WHERE status = 'NEW'");
$hotLeads        = $alo_count('SELECT COUNT(*) FROM leads WHERE lead_score >= 70');
$totalApps       = $alo_count('SELECT COUNT(*) FROM applications');
$offersCount     = $alo_count("SELECT COUNT(*) FROM applications WHERE status IN ('CONDITIONAL_OFFER','UNCONDITIONAL_OFFER')");
$casCount        = $alo_count("SELECT COUNT(*) FROM applications WHERE status IN ('CAS_PENDING','CAS_ISSUED')");
$visaAppsCount   = $alo_count("SELECT COUNT(*) FROM applications WHERE status IN ('VISA_PENDING','VISA_GRANTED','VISA_REFUSED')");
$visaSuccess     = $alo_count("SELECT COUNT(*) FROM applications WHERE status = 'VISA_GRANTED'");
$enrolments      = $alo_count("SELECT COUNT(*) FROM applications WHERE status = 'ENROLLED'");
$totalTasks      = $alo_count('SELECT COUNT(*) FROM tasks');
$pendingTasks    = $alo_count("SELECT COUNT(*) FROM tasks WHERE status IN ('PENDING','IN_PROGRESS')");
$totalComms      = $alo_count('SELECT COUNT(*) FROM communications');
$activeCampaigns = $alo_count("SELECT COUNT(*) FROM marketing_campaigns WHERE status IN ('ACTIVE','PAUSED','DRAFT')");

$revenue = $alo_sum(
    "SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'COMPLETED' AND created_at >= :ys",
    [':ys' => $yearStart]
);

$outstanding = $alo_sum(
    "SELECT COALESCE(SUM(amount),0) FROM invoices WHERE status IN ('PENDING','PARTIAL','OVERDUE')"
);

/* Lead pipeline */
$leadStatuses = ['NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED'];
$leadPipeline = [];
foreach ($leadStatuses as $st) {
    $leadPipeline[$st] = $alo_count("SELECT COUNT(*) FROM leads WHERE status = :s", [':s' => $st]);
}

/* Monthly applications (last 6 months) */
$monthlyApps = [];
for ($i = 5; $i >= 0; $i--) {
    $mStart = date('Y-m-01', strtotime("-$i months"));
    $mEnd   = date('Y-m-t',  strtotime("-$i months"));
    $monthlyApps[] = [
        'label' => date('M', strtotime($mStart)),
        'value' => $alo_count(
            "SELECT COUNT(*) FROM applications WHERE application_date BETWEEN :s AND :e",
            [':s' => $mStart, ':e' => $mEnd]
        ),
    ];
}

/* Monthly revenue (last 6 months) */
$monthlyRevenue = [];
for ($i = 5; $i >= 0; $i--) {
    $mStart = date('Y-m-01', strtotime("-$i months"));
    $mEnd   = date('Y-m-t',  strtotime("-$i months"));
    $monthlyRevenue[] = [
        'label' => date('M', strtotime($mStart)),
        'value' => $alo_sum(
            "SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'COMPLETED' AND created_at BETWEEN :s AND :e",
            [':s' => $mStart, ':e' => $mEnd]
        ),
    ];
}

json_response([
    'generated_at'         => date('c'),
    'students'             => $totalStudents,
    'leads'                => $totalLeads,
    'new_leads'            => $newLeads,
    'hot_leads'            => $hotLeads,
    'applications'         => $totalApps,
    'offers'               => $offersCount,
    'cas'                  => $casCount,
    'visas'                => $visaAppsCount,
    'visa_success'         => $visaSuccess,
    'enrolments'           => $enrolments,
    'tasks'                => $totalTasks,
    'pending_tasks'        => $pendingTasks,
    'communications'       => $totalComms,
    'active_campaigns'     => $activeCampaigns,
    'revenue_ytd'          => round($revenue, 2),
    'outstanding'          => round($outstanding, 2),
    'lead_pipeline'        => $leadPipeline,
    'monthly_applications' => $monthlyApps,
    'monthly_revenue'      => $monthlyRevenue,
], 200);
