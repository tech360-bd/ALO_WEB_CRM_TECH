<?php
/**
 * Leads — Detail / View page
 *
 * Renders the lead info card, status pipeline, score badge, and a tabbed
 * area (Profile, Activities, Communications, Tasks, Documents, Notes) plus
 * the activity timeline.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('leads.view');

$pdo = db();
$leadId = (int) ($_GET['id'] ?? 0);
if ($leadId <= 0) {
    flash('error', 'Invalid lead ID.');
    redirect('leads/index.php');
}

/* Fetch the lead */
$stmt = $pdo->prepare(
    'SELECT l.*, u.name AS counselor_name
       FROM leads l
  LEFT JOIN users u ON u.id = l.counselor_id
      WHERE l.id = :id'
);
$stmt->execute([':id' => $leadId]);
$lead = $stmt->fetch();
if (!$lead) {
    flash('error', 'Lead not found.');
    redirect('leads/index.php');
}

$lead = is_array($lead) ? $lead : [];
$crmId = (string) ($lead['crm_id'] ?? '');
$status = (string) ($lead['status'] ?? 'NEW');

/* Activities timeline */
$actsStmt = $pdo->prepare(
    'SELECT a.*, u.name AS user_name
       FROM activities a
  LEFT JOIN users u ON u.id = a.user_id
      WHERE a.lead_id = :id
   ORDER BY a.created_at DESC'
);
$actsStmt->execute([':id' => $leadId]);
$activities = $actsStmt->fetchAll();

/* Communications */
$commStmt = $pdo->prepare(
    'SELECT c.*, u.name AS user_name
       FROM communications c
  LEFT JOIN users u ON u.id = c.user_id
      WHERE c.lead_id = :id
   ORDER BY c.created_at DESC'
);
$commStmt->execute([':id' => $leadId]);
$communications = $commStmt->fetchAll();

/* Tasks */
$taskStmt = $pdo->prepare(
    'SELECT t.*, u.name AS assignee_name
       FROM tasks t
  LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.lead_id = :id
   ORDER BY t.due_date ASC, t.created_at DESC'
);
$taskStmt->execute([':id' => $leadId]);
$tasks = $taskStmt->fetchAll();

/* Documents (lead has no direct documents, but applications may have documents
   if the lead is converted — show student-level docs that point at this lead) */
$docStmt = $pdo->prepare(
    "SELECT d.*, u.name AS uploader_name
       FROM documents d
  LEFT JOIN users u ON u.id = d.uploaded_by
 INNER JOIN students s ON s.id = d.student_id
      WHERE s.lead_id = :id
   ORDER BY d.created_at DESC"
);
$docStmt->execute([':id' => $leadId]);
$documents = $docStmt->fetchAll();

/* Pipeline steps */
$pipeline = ['NEW','CONTACTED','QUALIFIED','COUNSELING','APPLICATION','OFFER','CAS','VISA','ENROLLED'];
$currentIdx = array_search($status, $pipeline, true);

/* Lead score badge colour */
$score = (int) ($lead['lead_score'] ?? 0);
if ($score >= 75)      $scoreCls = 'badge-green';
elseif ($score >= 50)  $scoreCls = 'badge-amber';
elseif ($score >= 25)  $scoreCls = 'badge-blue';
else                   $scoreCls = 'badge-gray';

render_header('Lead: ' . $lead['full_name']);
?>
<div class="toolbar">
  <div class="flex items-center gap-2">
    <h1><?php echo e($lead['full_name']); ?></h1>
    <span class="badge mono <?php echo $scoreCls; ?>">Score: <?php echo $score; ?></span>
    <?php echo status_badge($status); ?>
  </div>
  <div class="flex gap-2">
    <a href="<?php echo url('leads/index.php'); ?>" class="btn">&larr; Back</a>
    <?php if (has_permission('leads.edit')): ?>
      <a href="<?php echo url('leads/edit.php?id=' . $leadId); ?>" class="btn">✎ Edit</a>
    <?php endif; ?>
    <?php if (has_permission('students.create')): ?>
      <a href="<?php echo url('students/create.php?lead_id=' . $leadId); ?>" class="btn btn-success">→ Convert to Student</a>
    <?php endif; ?>
    <?php if (has_permission('tasks.create')): ?>
      <a href="<?php echo url('tasks/index.php?lead_id=' . $leadId); ?>" class="btn">+ Task</a>
    <?php endif; ?>
    <?php if (has_permission('communications.create')): ?>
      <a href="<?php echo url('communications/index.php?lead_id=' . $leadId); ?>" class="btn">+ Communication</a>
    <?php endif; ?>
  </div>
</div>

<!-- Lead info card -->
<div class="card" style="margin-bottom:16px">
  <div class="card-body">
    <div class="info-grid">
      <div class="info-row"><span class="lbl">CRM ID</span><span class="val mono"><?php echo e($crmId); ?></span></div>
      <div class="info-row"><span class="lbl">Email</span><span class="val"><?php echo e($lead['email'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Phone</span><span class="val"><?php echo e($lead['phone'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Alt Phone</span><span class="val"><?php echo e($lead['alt_phone'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Source</span><span class="val"><?php echo e($lead['source'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Counselor</span><span class="val"><?php echo e($lead['counselor_name'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Country</span><span class="val"><?php echo e($lead['country'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Course</span><span class="val"><?php echo e($lead['course'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Intake</span><span class="val"><?php echo e($lead['intake'] ?? '—'); ?></span></div>
      <div class="info-row"><span class="lbl">Budget</span><span class="val"><?php echo $lead['budget'] !== null ? format_currency((float) $lead['budget']) : '—'; ?></span></div>
      <div class="info-row"><span class="lbl">IELTS Score</span><span class="val"><?php echo $lead['ielts_score'] !== null ? e((string) $lead['ielts_score']) : '—'; ?></span></div>
      <div class="info-row"><span class="lbl">Follow-up</span><span class="val"><?php echo e(format_date($lead['follow_up_date'] ?? '')); ?></span></div>
      <div class="info-row"><span class="lbl">Created</span><span class="val"><?php echo e(format_date($lead['created_at'] ?? '', 'M d, Y H:i')); ?></span></div>
    </div>
  </div>
</div>

<!-- Status pipeline -->
<div class="card" style="margin-bottom:16px">
  <div class="card-head"><h3>Status Pipeline</h3></div>
  <div class="card-body">
    <div class="pipeline">
      <?php foreach ($pipeline as $i => $step): ?>
        <?php
          $cls = '';
          if ($currentIdx !== false) {
              if ($i < $currentIdx) $cls = 'done';
              elseif ($i === $currentIdx) $cls = 'current';
          }
        ?>
        <span class="step <?php echo $cls; ?>"><?php echo e(ucwords(strtolower($step))); ?></span>
        <?php if ($i < count($pipeline) - 1): ?>
          <span class="arrow">→</span>
        <?php endif; ?>
      <?php endforeach; ?>
      <?php if ($status === 'LOST'): ?>
        <span class="step" style="background:#fee2e2;color:#991b1b;border-color:#fecaca">LOST</span>
      <?php endif; ?>
    </div>
  </div>
</div>

<!-- Tabs -->
<div class="tabs" data-tab-group="lead">
  <a href="#tab-profile"        data-tab="tab-profile"        class="active">Profile</a>
  <a href="#tab-activities"     data-tab="tab-activities">     Activities (<?php echo count($activities); ?>)</a>
  <a href="#tab-communications" data-tab="tab-communications"> Communications (<?php echo count($communications); ?>)</a>
  <a href="#tab-tasks"          data-tab="tab-tasks">           Tasks (<?php echo count($tasks); ?>)</a>
  <a href="#tab-documents"      data-tab="tab-documents">       Documents (<?php echo count($documents); ?>)</a>
  <a href="#tab-notes"          data-tab="tab-notes">           Notes</a>
</div>

<!-- Profile tab -->
<div id="tab-profile" class="tab-panel active" data-tab-panel-group="lead">
  <div class="card">
    <div class="card-head"><h3>Lead Profile</h3></div>
    <div class="card-body">
      <div class="info-grid">
        <div class="info-row"><span class="lbl">Full Name</span><span class="val"><?php echo e($lead['full_name']); ?></span></div>
        <div class="info-row"><span class="lbl">Email</span><span class="val"><?php echo e($lead['email'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Phone</span><span class="val"><?php echo e($lead['phone'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Alt Phone</span><span class="val"><?php echo e($lead['alt_phone'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Source</span><span class="val"><?php echo e($lead['source'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Country</span><span class="val"><?php echo e($lead['country'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Course</span><span class="val"><?php echo e($lead['course'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Intake</span><span class="val"><?php echo e($lead['intake'] ?? '—'); ?></span></div>
        <div class="info-row"><span class="lbl">Budget</span><span class="val"><?php echo $lead['budget'] !== null ? format_currency((float) $lead['budget']) : '—'; ?></span></div>
        <div class="info-row"><span class="lbl">IELTS Score</span><span class="val"><?php echo $lead['ielts_score'] !== null ? e((string) $lead['ielts_score']) : '—'; ?></span></div>
        <div class="info-row"><span class="lbl">Lead Score</span><span class="val"><?php echo (int) $score; ?></span></div>
        <div class="info-row"><span class="lbl">Counselor</span><span class="val"><?php echo e($lead['counselor_name'] ?? '—'); ?></span></div>
      </div>
    </div>
  </div>
</div>

<!-- Activities tab -->
<div id="tab-activities" class="tab-panel" data-tab-panel-group="lead">
  <div class="card">
    <div class="card-head"><h3>Activity Timeline</h3></div>
    <div class="card-body">
      <?php if (!$activities): render_empty('No activities yet.'); else: ?>
      <div class="timeline">
        <?php foreach ($activities as $a): ?>
          <div class="t-item">
            <div class="meta"><?php echo e(format_date($a['created_at'], 'M d, Y H:i')); ?> · <?php echo e($a['user_name'] ?? 'System'); ?> · <span class="mono"><?php echo e($a['type']); ?></span></div>
            <div class="body"><?php echo e($a['description']); ?></div>
          </div>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
    </div>
  </div>
</div>

<!-- Communications tab -->
<div id="tab-communications" class="tab-panel" data-tab-panel-group="lead">
  <div class="card">
    <div class="card-head"><h3>Communications</h3></div>
    <div class="card-body no-pad">
      <table class="data">
        <thead>
          <tr><th>Channel</th><th>Direction</th><th>Subject</th><th>Status</th><th>Date</th></tr>
        </thead>
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
    </div>
  </div>
</div>

<!-- Tasks tab -->
<div id="tab-tasks" class="tab-panel" data-tab-panel-group="lead">
  <div class="card">
    <div class="card-head"><h3>Tasks</h3></div>
    <div class="card-body no-pad">
      <table class="data">
        <thead>
          <tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th></tr>
        </thead>
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
    </div>
  </div>
</div>

<!-- Documents tab -->
<div id="tab-documents" class="tab-panel" data-tab-panel-group="lead">
  <div class="card">
    <div class="card-head"><h3>Documents</h3></div>
    <div class="card-body no-pad">
      <table class="data">
        <thead>
          <tr><th>Type</th><th>File</th><th>Status</th><th>Uploaded</th><th>By</th></tr>
        </thead>
        <tbody>
          <?php if (!$documents): ?>
            <tr><td colspan="5"><div class="empty">No documents yet. Documents will appear once this lead is converted to a student.</div></td></tr>
          <?php else: foreach ($documents as $d): ?>
            <tr>
              <td><?php echo e($d['document_type']); ?></td>
              <td><?php echo e($d['file_name']); ?></td>
              <td><?php echo status_badge($d['status']); ?></td>
              <td class="text-sm"><?php echo e(format_date($d['created_at'])); ?></td>
              <td><?php echo e($d['uploader_name'] ?? '—'); ?></td>
            </tr>
          <?php endforeach; endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Notes tab -->
<div id="tab-notes" class="tab-panel" data-tab-panel-group="lead">
  <div class="card">
    <div class="card-head"><h3>Notes</h3></div>
    <div class="card-body">
      <?php if (!empty($lead['notes'])): ?>
        <div style="white-space:pre-wrap"><?php echo e($lead['notes']); ?></div>
      <?php else: render_empty('No notes recorded.'); endif; ?>
    </div>
  </div>
</div>

<?php render_footer();
