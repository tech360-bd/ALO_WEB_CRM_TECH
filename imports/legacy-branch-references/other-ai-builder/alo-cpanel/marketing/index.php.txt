<?php
/**
 * Marketing — Command Center
 *
 * Campaign cards + content queue (pending approval). Tabs:
 * Campaigns, Content, Calendar, Approvals. Create Campaign button.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('marketing.view');

$pdo = db();

$tab = $_GET['tab'] ?? 'campaigns';
if (!in_array($tab, ['campaigns','content','calendar','approvals'], true)) $tab = 'campaigns';

/* Campaigns */
$campaigns = $pdo->query(
    'SELECT mc.*, u.name AS creator_name,
            (SELECT COUNT(*) FROM marketing_content m WHERE m.campaign_id = mc.id) AS content_count
       FROM marketing_campaigns mc
  LEFT JOIN users u ON u.id = mc.created_by
   ORDER BY mc.created_at DESC'
)->fetchAll();

/* Content queue */
$contentStmt = $pdo->prepare(
    'SELECT m.*, u.name AS creator_name, c.name AS campaign_name,
            au.name AS approver_name
       FROM marketing_content m
  LEFT JOIN users u ON u.id = m.created_by
  LEFT JOIN marketing_campaigns c ON c.id = m.campaign_id
  LEFT JOIN users au ON au.id = m.approved_by
   ORDER BY m.created_at DESC'
);
$contentStmt->execute();
$content = $contentStmt->fetchAll();

/* Pending approvals */
$pendingApprovals = array_filter($content, fn($c) => $c['status'] === 'PENDING_APPROVAL');

/* Build calendar buckets: next 30 days of campaign start/end dates */
$calendar = [];
foreach ($campaigns as $c) {
    if (!empty($c['start_date'])) {
        $calendar[$c['start_date']][] = ['type' => 'start', 'name' => $c['name'], 'status' => $c['status']];
    }
    if (!empty($c['end_date'])) {
        $calendar[$c['end_date']][] = ['type' => 'end', 'name' => $c['name'], 'status' => $c['status']];
    }
}
ksort($calendar);

$statuses = ['DRAFT','ACTIVE','PAUSED','COMPLETED'];
$platforms = ['FACEBOOK','INSTAGRAM','WHATSAPP','MESSENGER','EMAIL','SMS'];

render_header('Marketing');
?>
<div class="toolbar">
  <h1>Marketing Command Center</h1>
  <?php if (has_permission('marketing.create')): ?>
    <button type="button" class="btn btn-primary" onclick="openModal('createCampaignModal')">+ Create Campaign</button>
  <?php endif; ?>
</div>

<div class="tabs" data-tab-group="mktg">
  <a href="?tab=campaigns"  data-tab="tab-campaigns"  class="<?php echo $tab === 'campaigns'  ? 'active' : ''; ?>">Campaigns (<?php echo count($campaigns); ?>)</a>
  <a href="?tab=content"    data-tab="tab-content"    class="<?php echo $tab === 'content'    ? 'active' : ''; ?>">Content (<?php echo count($content); ?>)</a>
  <a href="?tab=calendar"   data-tab="tab-calendar"    class="<?php echo $tab === 'calendar'   ? 'active' : ''; ?>">Calendar</a>
  <a href="?tab=approvals"  data-tab="tab-approvals"   class="<?php echo $tab === 'approvals'   ? 'active' : ''; ?>">Approvals (<?php echo count($pendingApprovals); ?>)</a>
</div>

<?php if ($tab === 'campaigns'): ?>
  <div class="cards-grid">
    <?php if (!$campaigns): ?>
      <div class="card"><div class="card-body"><?php render_empty('No campaigns yet.'); ?></div></div>
    <?php else: foreach ($campaigns as $c): ?>
      <div class="card">
        <div class="card-head">
          <h3><?php echo e($c['name']); ?></h3>
          <?php echo status_badge($c['status']); ?>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-row"><span class="lbl">Platform</span><span class="val"><?php echo e(ucwords(strtolower($c['platform']))); ?></span></div>
            <div class="info-row"><span class="lbl">Budget / Spent</span><span class="val"><?php echo format_currency((float) $c['budget']); ?> / <?php echo format_currency((float) $c['spent']); ?></span></div>
            <div class="info-row"><span class="lbl">Reach</span><span class="val"><?php echo number_format((int) $c['reach']); ?></span></div>
            <div class="info-row"><span class="lbl">Engagement</span><span class="val"><?php echo number_format((int) $c['engagement']); ?></span></div>
            <div class="info-row"><span class="lbl">Leads</span><span class="val"><?php echo number_format((int) $c['leads']); ?></span></div>
            <div class="info-row"><span class="lbl">Conversions</span><span class="val"><?php echo number_format((int) $c['conversions']); ?></span></div>
            <div class="info-row"><span class="lbl">Created By</span><span class="val"><?php echo e($c['creator_name'] ?? '—'); ?></span></div>
            <div class="info-row"><span class="lbl">Content Items</span><span class="val"><?php echo (int) $c['content_count']; ?></span></div>
          </div>
        </div>
      </div>
    <?php endforeach; endif; ?>
  </div>

<?php elseif ($tab === 'content'): ?>
  <div class="card">
    <div class="card-body no-pad">
      <table class="data">
        <thead>
          <tr><th>Title</th><th>Campaign</th><th>Platform</th><th>Language</th><th>Status</th><th>Created By</th><th>Date</th></tr>
        </thead>
        <tbody>
          <?php if (!$content): ?>
            <tr><td colspan="7"><div class="empty">No content yet.</div></td></tr>
          <?php else: foreach ($content as $c): ?>
            <tr>
              <td><strong><?php echo e($c['title']); ?></strong></td>
              <td><?php echo e($c['campaign_name'] ?? '—'); ?></td>
              <td><?php echo e($c['platform'] ?? '—'); ?></td>
              <td><?php echo e(strtoupper($c['language'])); ?></td>
              <td><?php echo status_badge($c['status']); ?></td>
              <td><?php echo e($c['creator_name'] ?? '—'); ?></td>
              <td class="text-sm"><?php echo e(format_date($c['created_at'])); ?></td>
            </tr>
          <?php endforeach; endif; ?>
        </tbody>
      </table>
    </div>
  </div>

<?php elseif ($tab === 'calendar'): ?>
  <div class="card">
    <div class="card-head"><h3>Upcoming Campaign Milestones</h3></div>
    <div class="card-body">
      <?php if (!$calendar): render_empty('No scheduled campaign events in the next window.'); else: ?>
      <div class="timeline">
        <?php foreach ($calendar as $date => $events): foreach ($events as $ev): ?>
          <div class="t-item">
            <div class="meta"><?php echo e(format_date($date)); ?> · <?php echo e(ucwords($ev['type'])); ?> · <?php echo status_badge($ev['status']); ?></div>
            <div class="body"><strong><?php echo e($ev['name']); ?></strong></div>
          </div>
        <?php endforeach; endforeach; ?>
      </div>
      <?php endif; ?>
    </div>
  </div>

<?php elseif ($tab === 'approvals'): ?>
  <div class="card">
    <div class="card-head"><h3>Pending Approval</h3></div>
    <div class="card-body no-pad">
      <table class="data">
        <thead><tr><th>Title</th><th>Campaign</th><th>Creator</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          <?php if (!$pendingApprovals): ?>
            <tr><td colspan="5"><div class="empty">No pending approvals.</div></td></tr>
          <?php else: foreach ($pendingApprovals as $c): ?>
            <tr>
              <td><strong><?php echo e($c['title']); ?></strong></td>
              <td><?php echo e($c['campaign_name'] ?? '—'); ?></td>
              <td><?php echo e($c['creator_name'] ?? '—'); ?></td>
              <td class="text-sm"><?php echo e(format_date($c['created_at'])); ?></td>
              <td>
                <?php if (has_permission('marketing.approve')): ?>
                  <a href="<?php echo url('marketing/approve.php?id=' . (int) $c['id'] . '&action=approve'); ?>" class="btn btn-sm btn-success">Approve</a>
                  <a href="<?php echo url('marketing/approve.php?id=' . (int) $c['id'] . '&action=reject'); ?>" class="btn btn-sm btn-danger">Reject</a>
                <?php else: ?>—<?php endif; ?>
              </td>
            </tr>
          <?php endforeach; endif; ?>
        </tbody>
      </table>
    </div>
  </div>
<?php endif; ?>

<?php if (has_permission('marketing.create')): ?>
<!-- Create Campaign modal -->
<div class="modal-backdrop" id="createCampaignModal">
  <div class="modal">
    <div class="modal-head">
      <h3>New Campaign</h3>
      <button type="button" class="btn btn-ghost" data-modal-close>×</button>
    </div>
    <form method="post" action="<?php echo url('marketing/create.php'); ?>">
      <?php echo csrf_field(); ?>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group" style="grid-column:1 / -1">
            <label>Campaign Name <span class="req">*</span></label>
            <input type="text" name="name" maxlength="190" required>
          </div>
          <div class="form-group">
            <label>Platform <span class="req">*</span></label>
            <select name="platform" required>
              <?php foreach ($platforms as $p): ?>
                <option value="<?php echo e($p); ?>"><?php echo e(ucwords(strtolower($p))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <?php foreach ($statuses as $s): ?>
                <option value="<?php echo e($s); ?>" <?php if ($s === 'DRAFT') echo 'selected'; ?>><?php echo e(ucwords(strtolower($s))); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" name="start_date">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" name="end_date">
          </div>
          <div class="form-group">
            <label>Budget</label>
            <input type="number" step="0.01" name="budget">
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Create Campaign</button>
      </div>
    </form>
  </div>
</div>
<?php endif; ?>

<?php render_footer();
