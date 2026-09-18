<?php
/**
 * Reports — Export CSV endpoint (GET)
 *
 * Supported report_type values:
 *   - leads          : all leads in date range
 *   - students       : all students in date range
 *   - applications   : all applications in date range
 *   - invoices       : all invoices in date range
 *   - communications : all communications in date range
 *   - tasks          : all tasks in date range
 *
 * Streams CSV to browser.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('reports.export');

$pdo = db();

$reportType = trim((string) ($_GET['report_type'] ?? ''));
$dateFrom   = trim((string) ($_GET['date_from'] ?? ''));
$dateTo     = trim((string) ($_GET['date_to'] ?? ''));

$validTypes = ['leads','students','applications','invoices','communications','tasks'];
if (!in_array($reportType, $validTypes, true)) {
    flash('error', 'Invalid report type.');
    redirect('reports/index.php');
}

/* Build date clause */
$args = [];
$dateClause = '';
if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
    $dateClause .= ' AND created_at >= :from';
    $args[':from'] = $dateFrom . ' 00:00:00';
}
if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
    $dateClause .= ' AND created_at <= :to';
    $args[':to'] = $dateTo . ' 23:59:59';
}

switch ($reportType) {
    case 'leads':
        $headers = ['ID','CRM ID','Full Name','Email','Phone','Source','Status','Counselor','Country','Course','Intake','Budget','IELTS','Lead Score','Follow Up','Created At'];
        $sql = "SELECT l.id, l.crm_id, l.full_name, l.email, l.phone, l.source, l.status,
                       u.name AS counselor, l.country, l.course, l.intake, l.budget, l.ielts_score,
                       l.lead_score, l.follow_up_date, l.created_at
                  FROM leads l
             LEFT JOIN users u ON u.id = l.counselor_id
                 WHERE 1=1 {$dateClause}
              ORDER BY l.created_at DESC";
        $filename = 'leads_' . date('Ymd_His') . '.csv';
        break;

    case 'students':
        $headers = ['ID','CRM ID','Full Name','Email','Phone','DOB','Gender','Nationality','Passport','Status','Counselor','Preferred Country','Preferred University','Preferred Course','Preferred Intake','IELTS','Created At'];
        $sql = "SELECT s.id, s.crm_id, s.full_name, s.email, s.phone, s.date_of_birth, s.gender,
                       s.nationality, s.passport_number, s.status,
                       u.name AS counselor, s.preferred_country, s.preferred_university,
                       s.preferred_course, s.preferred_intake, s.ielts_score, s.created_at
                  FROM students s
             LEFT JOIN users u ON u.id = s.counselor_id
                 WHERE 1=1 {$dateClause}
              ORDER BY s.created_at DESC";
        $filename = 'students_' . date('Ymd_His') . '.csv';
        break;

    case 'applications':
        $headers = ['ID','CRM ID','Student','University','Course','Intake','App Date','Status','Reference','Offer Date','CAS Date','Visa Date','Created At'];
        $sql = "SELECT a.id, a.crm_id, s.full_name AS student, u.name AS university,
                       c.name AS course, a.intake, a.application_date, a.status,
                       a.reference_number, a.offer_date, a.cas_date, a.visa_date, a.created_at
                  FROM applications a
             LEFT JOIN students s ON s.id = a.student_id
             LEFT JOIN universities u ON u.id = a.university_id
             LEFT JOIN courses c ON c.id = a.course_id
                 WHERE 1=1 {$dateClause}
              ORDER BY a.created_at DESC";
        $filename = 'applications_' . date('Ymd_His') . '.csv';
        break;

    case 'invoices':
        $headers = ['ID','Invoice #','Student','Amount','Currency','Status','Issue Date','Due Date','Paid Date','Application ID','Created At'];
        $sql = "SELECT i.id, i.invoice_number, s.full_name AS student, i.amount, i.currency,
                       i.status, i.issue_date, i.due_date, i.paid_date, i.application_id, i.created_at
                  FROM invoices i
             LEFT JOIN students s ON s.id = i.student_id
                 WHERE 1=1 {$dateClause}
              ORDER BY i.created_at DESC";
        $filename = 'invoices_' . date('Ymd_His') . '.csv';
        break;

    case 'communications':
        $headers = ['ID','CRM ID','Channel','Direction','Subject','Status','Student','Lead','User','Sent At','Created At'];
        $sql = "SELECT c.id, c.crm_id, c.channel, c.direction, c.subject, c.status,
                       s.full_name AS student, l.full_name AS lead,
                       u.name AS user, c.sent_at, c.created_at
                  FROM communications c
             LEFT JOIN students s ON s.id = c.student_id
             LEFT JOIN leads l ON l.id = c.lead_id
             LEFT JOIN users u ON u.id = c.user_id
                 WHERE 1=1 {$dateClause}
              ORDER BY c.created_at DESC";
        $filename = 'communications_' . date('Ymd_His') . '.csv';
        break;

    case 'tasks':
        $headers = ['ID','Title','Assignee','Student','Lead','Priority','Status','Due Date','Completed At','Created At'];
        $sql = "SELECT t.id, t.title, u.name AS assignee,
                       s.full_name AS student, l.full_name AS lead,
                       t.priority, t.status, t.due_date, t.completed_at, t.created_at
                  FROM tasks t
             LEFT JOIN users u ON u.id = t.assigned_to
             LEFT JOIN students s ON s.id = t.student_id
             LEFT JOIN leads l ON l.id = t.lead_id
                 WHERE 1=1 {$dateClause}
              ORDER BY t.created_at DESC";
        $filename = 'tasks_' . date('Ymd_His') . '.csv';
        break;

    default:
        flash('error', 'Unknown report type.');
        redirect('reports/index.php');
}

/* Fetch rows */
$rows = [];
try {
    $stmt = $pdo->prepare($sql);
    foreach ($args as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    flash('error', 'Failed to fetch report data: ' . $e->getMessage());
    redirect('reports/index.php');
}

/* Build generator for csv_output() */
$gen = static function () use ($rows): Generator {
    foreach ($rows as $r) {
        $out = [];
        foreach ($r as $v) {
            $out[] = $v === null ? '' : (string) $v;
        }
        yield $out;
    }
};

csv_output($filename, $headers, $gen());
