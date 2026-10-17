<?php
/**
 * Finance — Create Invoice endpoint (POST)
 *
 * Inserts an invoice with auto-generated invoice_number, logs audit, redirects
 * back.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('finance.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('finance/index.php');
}

$studentId     = (int) ($_POST['student_id'] ?? 0);
$applicationId = (int) ($_POST['application_id'] ?? 0);
$amount        = trim((string) ($_POST['amount'] ?? ''));
$currency      = trim((string) ($_POST['currency'] ?? 'BDT'));
$dueDate       = trim((string) ($_POST['due_date'] ?? ''));
$issueDate     = trim((string) ($_POST['issue_date'] ?? date('Y-m-d')));
$notes         = trim((string) ($_POST['notes'] ?? ''));

$allowedCurrencies = ['BDT','USD','GBP','EUR','CAD','AUD'];

$errors = [];
if ($studentId <= 0) $errors[] = 'Student is required.';
if ($amount === '' || !is_numeric($amount) || (float) $amount <= 0) $errors[] = 'Amount must be a positive number.';
if (!in_array($currency, $allowedCurrencies, true)) $errors[] = 'Invalid currency.';
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $issueDate)) $errors[] = 'Issue date must be YYYY-MM-DD.';
if ($dueDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) $errors[] = 'Due date must be YYYY-MM-DD.';

if ($errors) {
    flash('error', implode(' ', $errors));
    redirect('finance/index.php');
}

$nullable = static fn($v) => $v !== '' ? $v : null;
$appVal = $applicationId > 0 ? $applicationId : null;

/* Generate invoice number: INV-YYYY-NNNNNN */
$year = date('Y');
try {
    $stmt = $pdo->prepare("SELECT invoice_number FROM invoices WHERE invoice_number LIKE :p ORDER BY invoice_number DESC LIMIT 1");
    $like = 'INV-' . $year . '-%';
    $stmt->bindParam(':p', $like);
    $stmt->execute();
    $row = $stmt->fetchColumn();
    $seq = 0;
    if ($row && preg_match('/(\d+)\s*$/', (string) $row, $m)) {
        $seq = (int) $m[1];
    }
    $invoiceNumber = 'INV-' . $year . '-' . str_pad((string) ($seq + 1), 6, '0', STR_PAD_LEFT);
} catch (Throwable $e) {
    $invoiceNumber = 'INV-' . $year . '-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
}

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO invoices
            (invoice_number, student_id, application_id, amount, currency,
             status, issue_date, due_date, paid_date, notes,
             created_at, updated_at)
         VALUES
            (:invoice_number, :student_id, :application_id, :amount, :currency,
             "PENDING", :issue_date, :due_date, NULL, :notes,
             NOW(), NOW())'
    );
    $stmt->bindParam(':invoice_number', $invoiceNumber);
    $stmt->bindParam(':student_id',     $studentId, PDO::PARAM_INT);
    $stmt->bindParam(':application_id', $appVal, $appVal === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $amountVal = (float) $amount;
    $stmt->bindParam(':amount',          $amountVal);
    $stmt->bindParam(':currency',        $currency);
    $stmt->bindParam(':issue_date',      $issueDate);
    $stmt->bindParam(':due_date',        $nullable($dueDate));
    $stmt->bindParam(':notes',           $nullable($notes));
    $stmt->execute();
    $invId = (int) $pdo->lastInsertId();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, student_id, crm_id, type, description, created_at)
         VALUES (:uid, :sid, NULL, :type, :desc, NOW())'
    );
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $type = 'invoice_created';
    $desc = 'Invoice created: ' . $invoiceNumber . ' (' . $currency . ' ' . number_format($amountVal, 2) . ')';
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':sid',  $studentId, PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('create', 'invoices', $invId, null, [
        'invoice_number' => $invoiceNumber, 'student_id' => $studentId,
        'amount' => $amountVal, 'currency' => $currency, 'due_date' => $nullable($dueDate),
    ]);

    flash('success', 'Invoice created — ' . $invoiceNumber);
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to create invoice: ' . $ex->getMessage());
}

redirect('finance/index.php');
