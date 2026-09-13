<?php
// Component: dashboard-alarm — renders global alarm banner + bell count
// Include in layout.php header: require_once __DIR__ . '/components/dashboard-alarm.php'; echo render_dashboard_alarm();
function render_dashboard_alarm(): string {
    if (!function_exists('db') || !is_logged_in()) return '';
    try {
        $pdo = db();
        $stmt = $pdo->query('SELECT COUNT(*) FROM dashboard_alarms WHERE alarm_status = "active"');
        $active = (int)$stmt->fetchColumn();
        $stmt2 = $pdo->query('SELECT COUNT(*) FROM dashboard_notifications WHERE is_read = 0');
        $unread = (int)$stmt2->fetchColumn();
        $out = '<div id="alo-alarm-bell" style="position:fixed;top:12px;right:16px;z-index:9999">';
        if ($active > 0) {
            $out .= '<a href="/api/dashboard-alarms.php" class="badge danger" style="padding:8px 12px;background:#dc2626;color:#fff;border-radius:999px;text-decoration:none;animation:pulse 1s infinite">🚨 GLOBAL ALARM ' . $active . '</a> ';
        }
        $out .= '<a href="/dashboard.php" class="badge" style="padding:6px 10px;background:#111;color:#fff;border-radius:999px;text-decoration:none">🔔 ' . $unread . '</a>';
        $out .= '</div>';
        // Audio for critical alarm (user must interact first due to browser autoplay policy — we play on load if flag)
        if ($active > 0) $out .= '<audio id="alo-alarm-audio" src="/assets/alarm.mp3" preload="auto"></audio><script>setTimeout(()=>{const a=document.getElementById("alo-alarm-audio"); if(a) a.play().catch(()=>{});}, 800);</script>';
        return $out;
    } catch (\Throwable $e) { return ''; }
}
