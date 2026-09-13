<?php
// View: WhatsApp Numbers management — admin only
require_once __DIR__ . '/../../app/bootstrap.php';
require_once __DIR__ . '/../../app/Services/AloWhatsAppNumberService.php';
if (!is_logged_in() || !has_permission('settings.view')) { redirect('/login.php'); }
$numbers = AloWhatsAppNumberService::getAllNumbers();
$users = [];
try { $stmt = db()->query('SELECT id, name, email, role FROM users ORDER BY name'); $users = $stmt->fetchAll(PDO::FETCH_ASSOC); } catch (\Throwable $e) {}
include __DIR__ . '/../../app/layout.php';
render_header('WhatsApp Numbers — ALO Education', 'settings');
?>
<div class="container">
  <h1>Official WhatsApp Numbers <small style="color:#666">Pool 01805020100-01805020119</small></h1>
  <div class="alert info">Main/Complaint/Follow-up: <strong>01805020100</strong> (default sender) • COO/24x7: <strong>01805020101</strong> • Employees: 01805020102-019</div>
  <table class="table">
    <thead><tr><th>Phone</th><th>Display</th><th>Owner Type</th><th>Flags</th><th>Owner</th><th>Assign</th></tr></thead>
    <tbody>
    <?php foreach ($numbers as $n): ?>
      <tr>
        <td><code><?=e($n['phone_number'])?></code><br><small><?=e($n['normalized_phone'])?></small></td>
        <td><?=e($n['display_name'])?></td>
        <td><span class="badge"><?=e($n['owner_type'])?></span></td>
        <td>
          <?php if ((int)$n['is_default_sender']) echo '<span class="badge success">default</span> '; ?>
          <?php if ((int)$n['is_complaint_number']) echo '<span class="badge warn">complaint</span> '; ?>
          <?php if ((int)$n['is_followup_sender']) echo '<span class="badge info">followup</span> '; ?>
          <?php if ((int)$n['is_24_7_support_number']) echo '<span class="badge danger">24/7</span> '; ?>
        </td>
        <td><?=e($n['owner_user_id'] ? ('User #'.$n['owner_user_id']) : '—')?></td>
        <td>
          <form method="post" action="/api/whatsapp-numbers.php" class="inline-assign" data-number-id="<?= (int)$n['id'] ?>">
            <?=csrf_field()?>
            <select name="user_id" required><option value="">Select user</option><?php foreach ($users as $u): ?><option value="<?= (int)$u['id'] ?>"><?=e($u['name'])?> (<?=e($u['role'])?>)</option><?php endforeach; ?></select>
            <select name="assignment_type"><option value="owner">owner</option><option value="sender">sender</option><option value="support_24_7">support_24_7</option></select>
            <button type="submit" class="btn small">Assign</button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <p><a href="/api/whatsapp-numbers.php" target="_blank">View JSON API</a> • <a href="/database/seed_alo_whatsapp_numbers.sql">Seed file</a></p>
</div>
<script>
document.querySelectorAll('.inline-assign').forEach(f=>{
  f.addEventListener('submit', async e=>{
    e.preventDefault();
    const fd = new FormData(f);
    const payload = {whatsapp_number_id: f.dataset.numberId, user_id: fd.get('user_id'), assignment_type: fd.get('assignment_type')};
    const r = await fetch('/api/whatsapp-numbers.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const j = await r.json();
    alert(j.success ? 'Assigned' : 'Error: '+(j.error||'')); location.reload();
  });
});
</script>
<?php render_footer(); ?>
