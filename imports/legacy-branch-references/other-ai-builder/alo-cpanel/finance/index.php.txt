<?php
/**
 * Finance — Dashboard
 *
 * KPI cards: Total Revenue, Outstanding, Paid This Month, Commission Due.
 * Invoices table + Payments table with filters.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('finance.view');

$pdo = db();

$status   = trim($_GET['status']   ?? '');
$currency = trim($_GET['currency'] ?? '');

/* KPIs */
try {
    $totalRevenue = (float) $pdo->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'COMPLETED'")->fetchColumn();
} catch (Throwable $e) { $totalRevenue = 0.0; }

try {
    $outstanding = (float) $pdo->query("SELECT COALESCE(SUM(amount),0) FROM invoices WHERE status IN ('PENDING','PARTIAL','OVERDUE')")->fetchColumn();
} catch (Throwable $e) { $outstanding = 0.0; }

try {
    $stmt = $pdo->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'COMPLETED' AND MONTH(paid_at) = MONTH(CURRENT_DATE) AND YEAR(paid_at) = YEAR(CURRENT_DATE)");
    $paidThisMonth = (float) $stmt->fetchColumn();
} catch (Throwable $e) { $paidThisMonth = 0.0; }

try {
    $commissionDue = (float) $pdo->query("SELECT COALESCE(SUM(amount),0) FROM commissions WHERE status IN ('PENDING','APPROVED')")->fetchColumn();
} catch (Throwable $e) { $commissionDue = 0.0; }

/* Invoices */
$invWhere = []; $invArgs = [];
if ($status !== '')   { $invWhere[] = 'i.status = :status'; $invArgs[':status'] = $status; }
if ($currency !== '') { $invWhere[] = 'i.currency = :currency'; $invArgs[':currency'] = $currency; }
$invWhereSql = $invWhere ? ('WHERE ' . implode(' AND ', $invWhere)) : '';

$invSql = "SELECT i.*, s.full_name AS student_name, s.crm_id AS student_crm_id
             FROM invoices i
        LEFT JOIN students s ON s.id = i.student_id
            {$invWhereSql}
         ORDER BY i.issue_date DESC, i.created_at DESC
            LIMIT 25";
$stmt = $pdo->prepare($invSql);
$stmt->execute($invArgs);
$invoices = $stmt->fetchAll();

/* Payments */
$paySql = "SELECT p.*, s.full_name AS student_name, s.crm_id AS student_crm_id
             FROM payments p
        LEFT JOIN students s ON s.id = p.student_id
            {$invWhereSql}
         ORDER BY p.paid_at DESC, p.created_at DESC
            LIMIT 25";
$stmt2 = $pdo->prepare($paySql);
$stmt2->execute($invArgs);
$payments = $stmt2->fetchAll();

$statuses = ['PENDING','PARTIAL','PAID','OVERDUE','CANCELLED'];
$currencies = $pdo->query("SELECT DISTINCT currency FROM invoices ORDER BY currency")->fetchAll(PDO::FETCH_COLUMN);

render_header('Finance');
?>
<div class="toolbar">
  <h1>Finance</h1>
  <?php if (has_permission('finance.create')): ?>
    <a href="<?php echo url('finance/invoice_create.php'); ?>" class="btn btn-primary">+ Create Invoice</a>
  <?php endif; ?>
</div>

<div class="kpi-grid">
  <div class="kpi">
    <div class="lbl">Total Revenue</div>
    <div class="val"><?php echo format_currency($totalRevenue); ?></div>
    <div class="sub">Completed payments</div>
  </div>
  <div class="kpi">
    <div class="lbl">Outstanding</div>
    <div class="val"><?php echo format_currency($outstanding); ?></div>
    <div class="sub">Unpaid invoices</div>
  </div>
  <div class="kpi">
    <div class="lbl">Paid This Month</div>
    <div class="val"><?php echo format_currency($paidThisMonth); ?></div>
    <div class="sub"><?php echo e(date('F Y')); ?></div>
  </div>
  <div class="kpi">
    <div class="lbl">Commission Due</div>
    <div class="val"><?php echo format_currency($commissionDue, 'USD'); ?></div>
    <div class="sub">Pending + approved</div>
  </div>
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
    <label>Currency</label>
    <select name="currency">
      <option value="">All currencies</option>
      <?php foreach ($currencies as $cu): ?>
        <option value="<?php echo e($cu); ?>" <?php if ($currency === $cu) echo 'selected'; ?>><?php echo e($cu); ?></option>
      <?php endforeach; ?>
    </select>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <button type="submit" class="btn btn-primary">Filter</button>
  </div>
  <div class="form-field">
    <label>&nbsp;</label>
    <a href="<?php echo url('finance/index.php'); ?>" class="btn">Reset</a>
  </div>
</form>

<div class="card" style="margin-bottom:18px">
  <div class="card-head"><h3>Invoices</h3></div>
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Student</th>
          <th>Amount</th>
          <th>Currency</th>
          <th>Status</th>
          <th>Issue Date</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$invoices): ?>
          <tr><td colspan="7"><div class="empty">No invoices found.</div></td></tr>
        <?php else: foreach ($invoices as $i): ?>
          <tr onclick="window.location='<?php echo url('students/view.php?id=' . (int) $i['student_id']); ?>'">
            <td class="mono"><?php echo e($i['invoice_number']); ?></td>
            <td>
              <strong><?php echo e($i['student_name'] ?? '—'); ?></strong>
              <div class="text-muted text-sm"><?php echo e($i['student_crm_id'] ?? ''); ?></div>
            </td>
            <td><?php echo format_currency((float) $i['amount'], $i['currency']); ?></td>
            <td><?php echo e($i['currency']); ?></td>
            <td><?php echo status_badge($i['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($i['issue_date'])); ?></td>
            <td class="text-sm"><?php echo e(format_date($i['due_date'])); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="card">
  <div class="card-head"><h3>Payments</h3></div>
  <div class="card-body no-pad">
    <table class="data">
      <thead>
        <tr>
          <th>Student</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Transaction ID</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$payments): ?>
          <tr><td colspan="6"><div class="empty">No payments found.</div></td></tr>
        <?php else: foreach ($payments as $p): ?>
          <tr onclick="window.location='<?php echo url('students/view.php?id=' . (int) $p['student_id']); ?>'">
            <td><strong><?php echo e($p['student_name'] ?? '—'); ?></strong></td>
            <td><?php echo format_currency((float) $p['amount'], $p['currency']); ?></td>
            <td><?php echo e($p['payment_method'] ?? '—'); ?></td>
            <td class="mono text-sm"><?php echo e($p['transaction_id'] ?? '—'); ?></td>
            <td><?php echo status_badge($p['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($p['paid_at'])); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php render_footer();
