<?php
/**
 * Notifications page
 *
 * Lists all notifications for the current user with a "mark as read" action.
 */
declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';
require_login();

$pdo = db();
$userId = (int) ($_SESSION['user_id'] ?? 0);

/* Mark-as-read action via GET (link click) */
$actionId = (int) ($_GET['mark_read'] ?? 0);
if ($actionId > 0) {
    try {
        $upd = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :uid');
        $upd->execute([':id' => $actionId, ':uid' => $userId]);
    } catch (Throwable $e) { /* ignore */ }

    /* If a link was stored, redirect there */
    try {
        $stmt = $pdo->prepare('SELECT link FROM notifications WHERE id = :id AND user_id = :uid');
        $stmt->execute([':id' => $actionId, ':uid' => $userId]);
        $link = (string) $stmt->fetchColumn();
        if ($link !== '') {
            redirect($link);
        }
    } catch (Throwable $e) { /* ignore */ }

    redirect('notifications.php');
}

/* Mark-all-as-read action */
if (isset($_GET['mark_all_read'])) {
    try {
        $upd = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND is_read = 0');
        $upd->execute([':uid' => $userId]);
        flash('success', 'All notifications marked as read.');
    } catch (Throwable $e) {
        flash('error', 'Failed to mark notifications as read.');
    }
    redirect('notifications.php');
}

$filter = trim((string) ($_GET['filter'] ?? ''));
$where = 'WHERE user_id = :uid';
$args = [':uid' => $userId];
if ($filter === 'unread') {
    $where .= ' AND is_read = 0';
} elseif ($filter === 'read') {
    $where .= ' AND is_read = 1';
}

$stmt = $pdo->prepare(
    "SELECT * FROM notifications
        {$where}
     ORDER BY is_read ASC, created_at DESC
     LIMIT 200"
);
$stmt->execute($args);
$notifications = $stmt->fetchAll();

/* Counts */
$unreadCount = 0;
$totalCount = 0;
try {
    $cStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = :uid');
    $cStmt->execute([':uid' => $userId]);
    $totalCount = (int) $cStmt->fetchColumn();

    $uStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND is_read = 0');
    $uStmt->execute([':uid' => $userId]);
    $unreadCount = (int) $uStmt->fetchColumn();
} catch (Throwable $e) { /* ignore */ }

render_header('Notifications');
?>
<div class="page-header">
    <div>
        <h1>&#128276; Notifications</h1>
        <div class="breadcrumb">
            <a href="<?php echo e(url('index.php')); ?>">Home</a> &rsaquo; Notifications
        </div>
    </div>
    <div class="actions">
        <?php if ($unreadCount > 0): ?>
            <a href="<?php echo e(url('notifications.php?mark_all_read=1')); ?>" class="btn btn-secondary btn-sm">Mark all read</a>
        <?php endif; ?>
    </div>
</div>

<div class="stats-grid" style="margin-bottom:16px">
    <?php echo stat_card('Total', $totalCount, "\u{1F4CB}", 'badge-blue'); ?>
    <?php echo stat_card('Unread', $unreadCount, "\u{1F514}", $unreadCount > 0 ? 'badge-amber' : 'badge-gray'); ?>
    <?php echo stat_card('Read', $totalCount - $unreadCount, "\u{2714}", 'badge-green'); ?>
</div>

<form class="filters" method="get">
    <div class="form-field">
        <label>Filter</label>
        <select name="filter">
            <option value="" <?php echo $filter === '' ? 'selected' : ''; ?>>All</option>
            <option value="unread" <?php echo $filter === 'unread' ? 'selected' : ''; ?>>Unread</option>
            <option value="read" <?php echo $filter === 'read' ? 'selected' : ''; ?>>Read</option>
        </select>
    </div>
    <div class="form-field">
        <label>&nbsp;</label>
        <button type="submit" class="btn btn-primary">Filter</button>
    </div>
</form>

<div class="card">
    <div class="card-body no-pad">
        <?php if (!$notifications): ?>
            <div class="empty">No notifications found.</div>
        <?php else: ?>
            <ul class="notif-list">
                <?php foreach ($notifications as $n): ?>
                    <li class="notif-item <?php echo !$n['is_read'] ? 'unread' : ''; ?>"
                        onclick="window.location='<?php echo e(url('notifications.php?mark_read=' . (int) $n['id'])); ?>'">
                        <div class="notif-icon type-<?php echo e($n['type']); ?>">
                            <?php
                            $icons = [
                                'info'    => '&#8505;',
                                'success' => '&#10004;',
                                'warning' => '&#9888;',
                                'danger'  => '&#10006;',
                            ];
                            echo $icons[$n['type']] ?? '&#128276;';
                            ?>
                        </div>
                        <div class="notif-body">
                            <strong><?php echo e($n['title']); ?></strong>
                            <?php if (!$n['is_read']): ?>
                                <span class="badge badge-amber">New</span>
                            <?php endif; ?>
                            <div class="text-muted text-sm"><?php echo e($n['message']); ?></div>
                            <div class="text-muted text-xs">
                                <?php echo e(format_date($n['created_at'], 'M d, Y H:i')); ?>
                                <?php if (!empty($n['link'])): ?> &middot; <a href="<?php echo e(url($n['link'])); ?>" onclick="event.stopPropagation();">Open</a><?php endif; ?>
                            </div>
                        </div>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
</div>

<style>
.notif-list { list-style:none; margin:0; padding:0; }
.notif-item {
    display:flex; gap:12px; padding:14px 16px; border-bottom:1px solid var(--c-border);
    cursor:pointer; transition:background 0.15s;
}
.notif-item:hover { background: var(--c-bg-hover); }
.notif-item.unread { background: var(--c-bg-info); }
.notif-icon {
    width:36px; height:36px; flex:0 0 36px;
    display:flex; align-items:center; justify-content:center;
    border-radius:50%; background:var(--c-bg); font-size:18px;
}
.notif-icon.type-success { background:#dcfce7; color:#16a34a; }
.notif-icon.type-warning { background:#fef3c7; color:#d97706; }
.notif-icon.type-danger  { background:#fee2e2; color:#dc2626; }
.notif-icon.type-info    { background:#dbeafe; color:#2563eb; }
.notif-body { flex:1; min-width:0; }
.notif-body strong { font-size:0.95rem; }
.notif-body .text-muted { margin-top:4px; }
</style>

<?php render_footer();
