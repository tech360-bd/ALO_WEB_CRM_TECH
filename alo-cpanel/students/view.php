<?php
/**
 * Students — Detail / View page
 *
 * Tabs: Personal Info, Passport, Contact, Academic, English Test,
 * Preferences, Applications, Documents, Tasks, Communications,
 * Finance, Timeline.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('students.view');

$pdo = db();
$studentId = (int) ($_GET['id'] ?? 0);
if ($studentId <= 0) { flash('error', 'Invalid student ID.'); redirect('students/index.php'); }

$stmt = $pdo->prepare(
    'SELECT s.*, u.name AS counselor_name
       FROM students s
  LEFT JOIN users u ON u.id = s.counselor_id
      WHERE s.id = :id'
);
$stmt->execute([':id' => $studentId]);
$student = $stmt->fetch();
if (!$student) { flash('error', 'Student not found.'); redirect('students/index.php'); }
$student = is_array($student) ? $student : [];

$crmId = (string) ($student['crm_id'] ?? '');

/* Applications */
$appsStmt = $pdo->prepare(
    'SELECT a.*, u.name AS university_name, c.name AS course_name
       FROM applications a
  LEFT JOIN universities u ON u.id = a.university_id
  LEFT JOIN courses c ON c.id = a.course_id
      WHERE a.student_id = :id
   ORDER BY a.application_date DESC'
);
$appsStmt->execute([':id' => $studentId]);
$applications = $appsStmt->fetchAll();

/* Documents */
$docStmt = $pdo->prepare(
    'SELECT d.*, u.name AS uploader_name
       FROM documents d
  LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.student_id = :id
   ORDER BY d.created_at DESC'
);
$docStmt->execute([':id' => $studentId]);
$documents = $docStmt->fetchAll();

/* Tasks */
$taskStmt = $pdo->prepare(
    'SELECT t.*, u.name AS assignee_name
       FROM tasks t
  LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.student_id = :id
   ORDER BY t.due_date ASC, t.created_at DESC'
);
$taskStmt->execute([':id' => $studentId]);
$tasks = $taskStmt->fetchAll();

/* Communications */
$commStmt = $pdo->prepare(
    'SELECT c.*, u.name AS user_name
       FROM communications c
  LEFT JOIN users u ON u.id = c.user_id
      WHERE c.student_id = :id
   ORDER BY c.created_at DESC'
);
$commStmt->execute([':id' => $studentId]);
$communications = $commStmt->fetchAll();

/* Finance — invoices + payments */
$invStmt = $pdo->prepare(
    'SELECT i.*, u.name AS updater
       FROM invoices i
      WHERE i.student_id = :id
   ORDER BY i.issue_date DESC'
);
$invStmt->execute([':id' => $studentId]);
$invoices = $invStmt->fetchAll();

$payStmt = $pdo->prepare(
    'SELECT p.*
       FROM payments p
      WHERE p.student_id = :id
   ORDER BY p.paid_at DESC, p.created_at DESC'
);
$payStmt->execute([':id' => $studentId]);
$payments = $payStmt->fetchAll();

/* Activities timeline */
$actStmt = $pdo->prepare(
    'SELECT a.*, u.name AS user_name
       FROM activities a
  LEFT JOIN users u ON u.id = a.user_id
      WHERE a.student_id = :id
   ORDER BY a.created_at DESC'
);
$actStmt->execute([':id' => $studentId]);
$activities = $actStmt->fetchAll();

$tabs = [
    'tab-personal', 'tab-passport', 'tab-contact', 'tab-academic',
    'tab-english', 'tab-preferences', 'tab-applications', 'tab-documents',
    'tab-tasks', 'tab-communications', 'tab-finance', 'tab-timeline',
];

render_header('Student: ' . $student['full_name']);
?>
<div class="toolbar">
  <div class="flex items-center gap-2">
    <h1><?php echo e($student['full_name']); ?></h1>
    <?php echo status_badge($student['status']); ?>
    <span class="badge badge-blue mono"><?php echo e($crmId); ?></span>
  </div>
  <div class="flex gap-2">
    <a href="<?php echo url('students/index.php'); ?>" class="btn">&larr; Back</a>
    <?php if (has_permission('students.edit')): ?>
      <a href="<?php echo url('students/edit.php?id=' . $studentId); ?>" class="btn">✎ Edit</a>
    <?php endif; ?>
    <?php if (has_permission('applications.create')): ?>
      <a href="<?php echo url('applications/create.php?student_id=' . $studentId); ?>" class="btn btn-primary">+ Application</a>
    <?php endif; ?>
    <?php if (has_permission('documents.upload')): ?>
      <a href="<?php echo url('documents/index.php?student_id=' . $studentId); ?>" class="btn">+ Document</a>
    <?php endif; ?>
    <?php if (has_permission('tasks.create')): ?>
      <a href="<?php echo url('tasks/index.php?student_id=' . $studentId); ?>" class="btn">+ Task</a>
    <?php endif; ?>
  </div>
</div>

<div class="tabs" data-tab-group="student">
  <a href="#tab-personal"        data-tab="tab-personal"        class="active">Personal</a>
  <a href="#tab-passport"        data-tab="tab-passport">         Passport</a>
  <a href="#tab-contact"        data-tab="tab-contact">          Contact</a>
  <a href="#tab-academic"        data-tab="tab-academic">         Academic</a>
  <a href="#tab-english"        data-tab="tab-english">          English Test</a>
  <a href="#tab-preferences"    data-tab="tab-preferences">       Preferences</a>
  <a href="#tab-applications"   data-tab="tab-applications">       Applications (<?php echo count($applications); ?>)</a>
  <a href="#tab-documents"      data-tab="tab-documents">          Documents (<?php echo count($documents); ?>)</a>
  <a href="#tab-tasks"          data-tab="tab-tasks">              Tasks (<?php echo count($tasks); ?>)</a>
  <a href="#tab-communications" data-tab="tab-communications">      Communications (<?php echo count($communications); ?>)</a>
  <a href="#tab-finance"        data-tab="tab-finance">            Finance</a>
  <a href="#tab-timeline"       data-tab="tab-timeline">            Timeline (<?php echo count($activities); ?>)</a>
</div>

<?php
// info_row() is now a global helper defined in app/layout.php.
?>
<!-- Personal -->
<div id="tab-personal" class="tab-panel active" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <div class="info-grid">
      <?php echo info_row('Full Name', $student['full_name']); ?>
      <?php echo info_row('Email', $student['email']); ?>
      <?php echo info_row('Phone', $student['phone']); ?>
      <?php echo info_row('Alt Phone', $student['alt_phone']); ?>
      <?php echo info_row('Date of Birth', format_date($student['date_of_birth'])); ?>
      <?php echo info_row('Gender', $student['gender'] ? ucwords((string) $student['gender']) : ''); ?>
      <?php echo info_row('Nationality', $student['nationality']); ?>
      <?php echo info_row('Counselor', $student['counselor_name']); ?>
      <?php echo info_row('Status', $student['status']); ?>
    </div>
  </div></div>
</div>

<div id="tab-passport" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <div class="info-grid">
      <?php echo info_row('Passport Number', $student['passport_number']); ?>
      <?php echo info_row('Passport Expiry', format_date($student['passport_expiry'])); ?>
    </div>
  </div></div>
</div>

<div id="tab-contact" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <div class="info-grid">
      <?php echo info_row('Present Address', $student['present_address']); ?>
      <?php echo info_row('Permanent Address', $student['permanent_address']); ?>
      <?php echo info_row('Guardian Name', $student['guardian_name']); ?>
      <?php echo info_row('Guardian Phone', $student['guardian_phone']); ?>
    </div>
  </div></div>
</div>

<div id="tab-academic" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <div class="info-grid">
      <?php echo info_row('SSC Result', $student['ssc_result']); ?>
      <?php echo info_row('HSC Result', $student['hsc_result']); ?>
    </div>
  </div></div>
</div>

<div id="tab-english" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <div class="info-grid">
      <?php echo info_row('IELTS Score', $student['ielts_score']); ?>
    </div>
  </div></div>
</div>

<div id="tab-preferences" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <div class="info-grid">
      <?php echo info_row('Preferred Country', $student['preferred_country']); ?>
      <?php echo info_row('Preferred University', $student['preferred_university']); ?>
      <?php echo info_row('Preferred Course', $student['preferred_course']); ?>
      <?php echo info_row('Preferred Intake', $student['preferred_intake']); ?>
    </div>
  </div></div>
</div>

<div id="tab-applications" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body no-pad">
    <table class="data">
      <thead><tr><th>CRM ID</th><th>University</th><th>Course</th><th>Intake</th><th>Status</th><th>Applied</th></tr></thead>
      <tbody>
        <?php if (!$applications): ?>
          <tr><td colspan="6"><div class="empty">No applications yet.</div></td></tr>
        <?php else: foreach ($applications as $a): ?>
          <tr onclick="window.location='<?php echo url('applications/index.php?focus=' . (int) $a['id']); ?>'">
            <td class="mono"><?php echo e($a['crm_id']); ?></td>
            <td><?php echo e($a['university_name'] ?? '—'); ?></td>
            <td><?php echo e($a['course_name'] ?? '—'); ?></td>
            <td><?php echo e($a['intake'] ?? '—'); ?></td>
            <td><?php echo status_badge($a['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($a['application_date'])); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div></div>
</div>

<div id="tab-documents" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body no-pad">
    <table class="data">
      <thead><tr><th>Type</th><th>File</th><th>Status</th><th>Uploaded</th><th>By</th></tr></thead>
      <tbody>
        <?php if (!$documents): ?>
          <tr><td colspan="5"><div class="empty">No documents yet.</div></td></tr>
        <?php else: foreach ($documents as $d): ?>
          <tr>
            <td><?php echo e($d['document_type']); ?></td>
            <td><a href="<?php echo e(url('uploads/' . ltrim((string) $d['file_path'], '/'))); ?>" target="_blank"><?php echo e($d['file_name']); ?></a></td>
            <td><?php echo status_badge($d['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($d['created_at'])); ?></td>
            <td><?php echo e($d['uploader_name'] ?? '—'); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div></div>
</div>

<div id="tab-tasks" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body no-pad">
    <table class="data">
      <thead><tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead>
      <tbody>
        <?php if (!$tasks): ?>
          <tr><td colspan="5"><div class="empty">No tasks yet.</div></td></tr>
        <?php else: foreach ($tasks as $t): ?>
          <tr onclick="window.location='<?php echo url('tasks/index.php?focus=' . (int) $t['id']); ?>'">
            <td><?php echo e($t['title']); ?></td>
            <td><?php echo e($t['assignee_name'] ?? '—'); ?></td>
            <td><?php echo priority_badge($t['priority']); ?></td>
            <td><?php echo status_badge($t['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($t['due_date'])); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div></div>
</div>

<div id="tab-communications" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body no-pad">
    <table class="data">
      <thead><tr><th>Channel</th><th>Direction</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
        <?php if (!$communications): ?>
          <tr><td colspan="5"><div class="empty">No communications yet.</div></td></tr>
        <?php else: foreach ($communications as $c): ?>
          <tr>
            <td><?php echo channel_icon($c['channel']); ?></td>
            <td><?php echo e($c['direction']); ?></td>
            <td><?php echo e($c['subject'] ?? '(no subject)'); ?></td>
            <td><?php echo status_badge($c['status']); ?></td>
            <td class="text-sm"><?php echo e(format_date($c['created_at'], 'M d, Y H:i')); ?></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div></div>
</div>

<div id="tab-finance" class="tab-panel" data-tab-panel-group="student">
  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3>Invoices</h3></div>
    <div class="card-body no-pad">
      <table class="data">
        <thead><tr><th>Invoice #</th><th>Amount</th><th>Status</th><th>Issued</th><th>Due</th></tr></thead>
        <tbody>
          <?php if (!$invoices): ?>
            <tr><td colspan="5"><div class="empty">No invoices.</div></td></tr>
          <?php else: foreach ($invoices as $i): ?>
            <tr>
              <td class="mono"><?php echo e($i['invoice_number']); ?></td>
              <td><?php echo format_currency((float) $i['amount'], $i['currency']); ?></td>
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
        <thead><tr><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Status</th><th>Paid At</th></tr></thead>
        <tbody>
          <?php if (!$payments): ?>
            <tr><td colspan="5"><div class="empty">No payments.</div></td></tr>
          <?php else: foreach ($payments as $p): ?>
            <tr>
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
</div>

<div id="tab-timeline" class="tab-panel" data-tab-panel-group="student">
  <div class="card"><div class="card-body">
    <?php if (!$activities): render_empty('No activity yet.'); else: ?>
    <div class="timeline">
      <?php foreach ($activities as $a): ?>
        <div class="t-item">
          <div class="meta"><?php echo e(format_date($a['created_at'], 'M d, Y H:i')); ?> · <?php echo e($a['user_name'] ?? 'System'); ?> · <span class="mono"><?php echo e($a['type']); ?></span></div>
          <div class="body"><?php echo e($a['description']); ?></div>
        </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>
  </div></div>
</div>

<?php render_footer();
