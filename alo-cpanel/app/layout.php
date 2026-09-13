<?php
/**
 * ALO Education CRM — Layout partial
 *
 * Provides render_header(), render_footer(), render_sidebar() and nav_item()
 * helpers used by every authenticated page.
 *
 * Usage (top of every page):
 *
 *   require_once __DIR__ . '/app/bootstrap.php';
 *   require_login();
 *   require_once __DIR__ . '/app/layout.php';
 *   render_header('Page Title');
 *   ?>
 *   ... page content ...
 *   <?php render_footer();
 *
 * This file is loaded AFTER bootstrap.php so all helper functions
 * (current_user, has_permission, asset, url, e, csrf_token …) are available.
 */
declare(strict_types=1);

/* ============================================================
   Navigation definition
   ------------------------------------------------------------
   Each entry: [url, label, icon, permission]
   Permission is checked via has_permission(); super_admin bypasses.
   ============================================================ */
if (!function_exists('alo_nav_sections')) {
    function alo_nav_sections(): array
    {
        return [
            'Main' => [
                ['index.php',          'Dashboard',       "\u{1F3E2}", 'dashboard.view'],
                ['leads/',             'Leads',            "\u{1F4C8}", 'leads.view'],
                ['students/',          'Students',         "\u{1F393}", 'students.view'],
            ],
            'Admissions' => [
                ['applications/',      'Applications',     "\u{1F4DD}", 'applications.view'],
                ['universities/',      'Universities',     "\u{1F3EB}", 'universities.view'],
                ['courses/',           'Courses',          "\u{1F4DA}", 'courses.view'],
                ['documents/',         'Documents',        "\u{1F4C1}", 'documents.view'],
            ],
            'Engagement' => [
                ['communications/',    'Communications',   "\u{1F4E7}", 'communications.view'],
                ['tasks/',             'Tasks',            "\u{2714}",   'tasks.view'],
                ['marketing/',         'Marketing',        "\u{1F4E1}", 'marketing.view'],
            ],
            'Finance & Insights' => [
                ['finance/',           'Finance',          "\u{1F4B0}", 'finance.view'],
                ['reports/',           'Reports',          "\u{1F4CA}", 'reports.view'],
            ],
            'Administration' => [
                ['users/',             'Users',            "\u{1F465}", 'users.view'],
                ['admin/audit.php',    'Audit Logs',      "\u{1F4CB}", 'audit.view'],
                ['settings/',          'Settings',         "\u{2699}",   'settings.view'],
            ],
        ];
    }
}

/* ============================================================
   nav_item() — render a single sidebar link.
   ============================================================ */
if (!function_exists('nav_item')) {
    function nav_item(string $url, string $label, string $icon = '', string $permission = ''): string
    {
        if ($permission !== '' && !has_permission($permission)) {
            return '';
        }
        $current = $GLOBALS['__alo_current_nav'] ?? '';
        $active  = '';
        // Match either exact or path-prefix (so sub-pages keep the parent active)
        $script = ltrim($_SERVER['SCRIPT_NAME'] ?? '', '/');
        $urlClean = ltrim($url, '/');

        if ($script === $urlClean) {
            $active = 'active';
        } elseif ($urlClean !== '' && $urlClean !== 'index.php'
                  && str_starts_with($script, dirname($urlClean))) {
            $active = 'active';
        } elseif ($current === $urlClean) {
            $active = 'active';
        }

        $iconHtml = $icon !== '' ? '<span class="nav-icon">' . $icon . '</span>' : '';
        return '<li><a href="' . e(url($url)) . '" class="' . $active . '">'
             . $iconHtml . '<span>' . e($label) . '</span></a></li>';
    }
}

/* ============================================================
   render_sidebar()
   ============================================================ */
if (!function_exists('render_sidebar')) {
    function render_sidebar(): void
    {
        $user = current_user();
        $role = $user ? ucfirst(str_replace('_', ' ', (string) ($user['role'] ?? ''))) : '';
        $name = $user ? ($user['name'] ?? 'User') : 'User';
        $initials = '';
        if ($name) {
            $parts = preg_split('/\s+/', trim($name));
            foreach ($parts as $p) {
                if ($p !== '') {
                    $initials .= strtoupper(substr($p, 0, 1));
                }
                if (strlen($initials) >= 2) break;
            }
        }
        if ($initials === '') $initials = 'A';
        ?>
<aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
        <div class="logo-mark">A</div>
        <div class="brand-text">
            <strong>ALO Education</strong>
            <span>CRM Command Center</span>
        </div>
    </div>
    <ul class="sidebar-nav">
        <?php foreach (alo_nav_sections() as $section => $items):
            // Only show a section if at least one item is visible
            $renderedItems = '';
            foreach ($items as $it) {
                $renderedItems .= nav_item($it[0], $it[1], $it[2], $it[3]);
            }
            if (trim($renderedItems) === '') continue; ?>
            <li class="nav-section-label"><?php echo e($section); ?></li>
            <?php echo $renderedItems; ?>
        <?php endforeach; ?>
    </ul>
    <div class="sidebar-footer">
        <div>Signed in as</div>
        <strong><?php echo e($name); ?></strong>
        <div><span class="role-badge"><?php echo e($role ?: 'Guest'); ?></span></div>
    </div>
</aside>
        <?php
    }
}

/* ============================================================
   render_header(string $title, array $opts = [])
   ------------------------------------------------------------
   Opens the HTML document, renders sidebar + top header and
   opens the .content wrapper. Page-specific content should be
   output after this call.
   ============================================================ */
if (!function_exists('render_header')) {
    function render_header(string $title = '', array $opts = []): void
    {
        $user = current_user();
        $name = $user ? ($user['name'] ?? 'User') : 'User';
        $initials = '';
        if ($name) {
            $parts = preg_split('/\s+/', trim($name));
            foreach ($parts as $p) {
                if ($p !== '') {
                    $initials .= strtoupper(substr($p, 0, 1));
                }
                if (strlen($initials) >= 2) break;
            }
        }
        if ($initials === '') $initials = 'A';

        // Unread notifications count
        $notifCount = 0;
        if ($user) {
            try {
                $stmt = db()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = :u AND is_read = 0');
                $stmt->execute([':u' => $user['id']]);
                $notifCount = (int) $stmt->fetchColumn();
            } catch (Throwable $e) { /* ignore */ }
        }

        $pageTitle = $title !== '' ? $title . ' — ' . APP_NAME : APP_NAME . ' CRM';
        ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <meta name="robots" content="noindex, nofollow">
    <title><?php echo e($pageTitle); ?></title>
    <link rel="stylesheet" href="<?php echo e(asset('css/style.css')); ?>?v=<?php echo filemtime(APP_ROOT . '/assets/css/style.css'); ?>">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23E8501A'/><text x='50%25' y='55%25' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle' dominant-baseline='middle'>A</text></svg>">
    <script>
        window.ALO_BASE_URL   = '<?php echo e(rtrim(APP_URL, '/')); ?>';
        window.ALO_CSRF_TOKEN = '<?php echo e(csrf_token()); ?>';
        window.ALO_CSRF_NAME  = '<?php echo e(CSRF_TOKEN_NAME); ?>';
        window.ALO_DEBUG      = <?php echo APP_DEBUG ? 'true' : 'false'; ?>;
    </script>
</head>
<body>
<div class="app-shell">
    <?php render_sidebar(); ?>
    <div class="main-area">
        <header class="top-header">
            <button class="menu-toggle" type="button" aria-label="Toggle menu" onclick="ALO.toggleSidebar()">&#9776;</button>
            <div class="global-search">
                <input type="search" id="globalSearch"
                       placeholder="Search leads, students, applications…"
                       aria-label="Global search">
            </div>
            <div class="header-actions">
                <a href="<?php echo e(url('tasks/')); ?>" class="icon-btn" title="My Tasks" aria-label="Tasks">&#9776;</a>
                <a href="<?php echo e(url('notifications.php')); ?>" class="icon-btn" title="Notifications" aria-label="Notifications">
                    &#128276;
                    <?php if ($notifCount > 0): ?>
                        <span class="dot"></span>
                    <?php endif; ?>
                </a>
                <div class="dropdown" id="userDropdown">
                    <a href="#" class="user-menu" data-toggle="dropdown" aria-label="User menu">
                        <span class="user-avatar"><?php echo e($initials); ?></span>
                        <span class="user-info">
                            <strong><?php echo e($name); ?></strong>
                            <small><?php echo e(ucfirst(str_replace('_', ' ', (string)($user['role'] ?? '')))); ?></small>
                        </span>
                    </a>
                    <div class="dropdown-menu" style="right:0;">
                        <div class="dropdown-header">Account</div>
                        <a href="<?php echo e(url('users/profile.php')); ?>">&#128100; My Profile</a>
                        <a href="<?php echo e(url('users/preferences.php')); ?>">&#9881; Preferences</a>
                        <div class="divider"></div>
                        <div class="dropdown-header">Support</div>
                        <a href="<?php echo e(url('help.php')); ?>">&#10067; Help Center</a>
                        <a href="<?php echo e(url('admin/audit.php')); ?>">&#128221; Activity Log</a>
                        <div class="divider"></div>
                        <a href="<?php echo e(url('logout.php')); ?>" style="color:var(--c-danger);">
                            &#8634; Sign out
                        </a>
                    </div>
                </div>
            </div>
        </header>
        <main class="content">
        <?php
        // Render any flash message
        $flashErr  = get_flash('error');
        $flashOk   = get_flash('success');
        $flashWarn = get_flash('warning');
        if ($flashErr): ?>
            <div class="alert alert-danger no-print"><?php echo e((string) $flashErr); ?>
                <button class="close" onclick="this.parentNode.remove()">&times;</button>
            </div>
        <?php endif;
        if ($flashOk): ?>
            <div class="alert alert-success no-print"><?php echo e((string) $flashOk); ?>
                <button class="close" onclick="this.parentNode.remove()">&times;</button>
            </div>
        <?php endif;
        if ($flashWarn): ?>
            <div class="alert alert-warning no-print"><?php echo e((string) $flashWarn); ?>
                <button class="close" onclick="this.parentNode.remove()">&times;</button>
            </div>
        <?php endif;
    }
}

/* ============================================================
   render_footer()
   ------------------------------------------------------------
   Closes the .content / .main-area / .app-shell wrappers,
   renders footer + scripts.
   ============================================================ */
if (!function_exists('render_footer')) {
    function render_footer(): void
    {
        ?>
        </main>
        <footer class="app-footer">
            <?php echo e(APP_NAME); ?> CRM &mdash;
            &copy; <?php echo date('Y'); ?>
            &middot; v1.0
            &middot; <a href="<?php echo e(url('help.php')); ?>">Help</a>
            &middot; <a href="<?php echo e(url('privacy.php')); ?>">Privacy</a>
        </footer>
        </div><!-- /.main-area -->
    </div><!-- /.app-shell -->
    <div class="drawer-overlay" onclick="ALO.closeDrawer()"></div>
    <script src="<?php echo e(asset('js/app.js')); ?>?v=<?php echo filemtime(APP_ROOT . '/assets/js/app.js'); ?>"></script>
</body>
</html>
        <?php
    }
}

/* ============================================================
   Quick helpers for partials
   ============================================================ */
if (!function_exists('page_header')) {
    /**
     * Render a page header row with title, breadcrumb and actions.
     *
     * @param string $title
     * @param string $breadcrumb
     * @param string $actionsHtml  Optional HTML for the actions column.
     */
    function page_header(string $title, string $breadcrumb = '', string $actionsHtml = ''): void
    {
        echo '<div class="page-header">';
        echo '<div>';
        echo '<h1>' . e($title) . '</h1>';
        if ($breadcrumb !== '') {
            echo '<div class="breadcrumb">' . $breadcrumb . '</div>';
        }
        echo '</div>';
        if ($actionsHtml !== '') {
            echo '<div class="actions">' . $actionsHtml . '</div>';
        }
        echo '</div>';
    }
}

if (!function_exists('stat_card')) {
    /**
     * Render a single KPI/stat card.
     *
     * @param string $label
     * @param string|int|float $value
     * @param string $icon
     * @param string $colorClass
     * @param string $trend
     * @param string $link
     */
    function stat_card(string $label, $value, string $icon = '', string $colorClass = '', string $trend = '', string $link = ''): void
    {
        $cls = $colorClass !== '' ? ' ' . e($colorClass) : '';
        $open = $link !== '' ? '<a href="' . e(url($link)) . '" style="text-decoration:none;color:inherit;">' : '';
        $close = $link !== '' ? '</a>' : '';
        echo $open . '<div class="stat-card' . $cls . '">';
        if ($icon !== '') {
            echo '<div class="stat-label"><span class="stat-icon">' . $icon . '</span> ' . e($label) . '</div>';
        } else {
            echo '<div class="stat-label">' . e($label) . '</div>';
        }
        echo '<div class="stat-value">' . e((string) $value) . '</div>';
        if ($trend !== '') {
            echo '<div class="stat-trend">' . $trend . '</div>';
        }
        echo '</div>' . $close;
    }
}

/* ============================================================
   Permission gate
   ============================================================ */
if (!function_exists('require_permission')) {
    /**
     * If the current user lacks $permission, abort with 403.
     * Super Admins implicitly pass every check.
     */
    function require_permission(string $permission): void
    {
        require_login();
        if (!has_permission($permission)) {
            http_response_code(403);
            header('Content-Type: text/html; charset=utf-8');
            $home = defined('APP_URL') ? APP_URL : '/';
            echo '<!doctype html><html><head><meta charset="utf-8">'
               . '<title>403 — Forbidden</title></head><body>'
               . '<h1>403 — Forbidden</h1>'
               . '<p>You do not have permission to access this page.</p>'
               . '<p>Required permission: <code>' . htmlspecialchars($permission, ENT_QUOTES) . '</code></p>'
               . '<p><a href="' . htmlspecialchars($home, ENT_QUOTES) . '">Go home</a></p>'
               . '</body></html>';
            exit;
        }
    }
}

/* ============================================================
   Status / priority badges
   ============================================================ */
if (!function_exists('status_badge')) {
    /**
     * Render a coloured badge pill based on the value.
     *
     * @param string $status
     * @return string
     */
    function status_badge(string $status): string
    {
        $s = strtoupper(trim($status));
        $map = [
            'NEW'                 => ['New', 'badge-blue'],
            'CONTACTED'           => ['Contacted', 'badge-info'],
            'QUALIFIED'           => ['Qualified', 'badge-teal'],
            'COUNSELING'          => ['Counseling', 'badge-indigo'],
            'APPLICATION'         => ['Application', 'badge-violet'],
            'OFFER'               => ['Offer', 'badge-purple'],
            'CAS'                 => ['CAS', 'badge-pink'],
            'VISA'                => ['Visa', 'badge-amber'],
            'ENROLLED'            => ['Enrolled', 'badge-green'],
            'LOST'                => ['Lost', 'badge-red'],
            'PROSPECT'            => ['Prospect', 'badge-blue'],
            'LEAD'                => ['Lead', 'badge-info'],
            'APPLICANT'           => ['Applicant', 'badge-indigo'],
            'OFFERED'             => ['Offered', 'badge-purple'],
            'GRADUATED'           => ['Graduated', 'badge-green'],
            'WITHDRAWN'           => ['Withdrawn', 'badge-red'],
            'REJECTED'            => ['Rejected', 'badge-red'],
            'DRAFT'               => ['Draft', 'badge-gray'],
            'SUBMITTED'           => ['Submitted', 'badge-blue'],
            'UNDER_REVIEW'        => ['Under Review', 'badge-amber'],
            'CONDITIONAL_OFFER'   => ['Conditional Offer', 'badge-teal'],
            'UNCONDITIONAL_OFFER' => ['Unconditional Offer', 'badge-green'],
            'CAS_PENDING'         => ['CAS Pending', 'badge-amber'],
            'CAS_ISSUED'          => ['CAS Issued', 'badge-purple'],
            'VISA_PENDING'        => ['Visa Pending', 'badge-amber'],
            'VISA_GRANTED'        => ['Visa Granted', 'badge-green'],
            'VISA_REFUSED'        => ['Visa Refused', 'badge-red'],
            'PENDING'             => ['Pending', 'badge-amber'],
            'PARTIAL'             => ['Partial', 'badge-amber'],
            'PAID'                => ['Paid', 'badge-green'],
            'OVERDUE'             => ['Overdue', 'badge-red'],
            'CANCELLED'           => ['Cancelled', 'badge-red'],
            'COMPLETED'           => ['Completed', 'badge-green'],
            'IN_PROGRESS'         => ['In Progress', 'badge-blue'],
            'SENT'                => ['Sent', 'badge-blue'],
            'DELIVERED'           => ['Delivered', 'badge-teal'],
            'READ'                => ['Read', 'badge-green'],
            'FAILED'              => ['Failed', 'badge-red'],
            'VERIFIED'            => ['Verified', 'badge-green'],
            'APPROVED'            => ['Approved', 'badge-green'],
            'PUBLISHED'           => ['Published', 'badge-green'],
            'PENDING_APPROVAL'    => ['Pending Approval', 'badge-amber'],
            'ACTIVE'              => ['Active', 'badge-green'],
            'INACTIVE'            => ['Inactive', 'badge-gray'],
            'SUSPENDED'           => ['Suspended', 'badge-red'],
            'PAUSED'              => ['Paused', 'badge-amber'],
        ];
        [$label, $cls] = $map[$s] ?? [htmlspecialchars($status, ENT_QUOTES), 'badge-gray'];
        return '<span class="badge ' . $cls . '">' . htmlspecialchars($label, ENT_QUOTES) . '</span>';
    }
}

if (!function_exists('priority_badge')) {
    function priority_badge(string $p): string
    {
        $p = strtoupper(trim($p));
        $map = [
            'LOW'    => ['badge-gray', 'Low'],
            'MEDIUM' => ['badge-blue', 'Medium'],
            'HIGH'   => ['badge-amber', 'High'],
            'URGENT' => ['badge-red', 'Urgent'],
        ];
        [$cls, $label] = $map[$p] ?? ['badge-gray', htmlspecialchars($p, ENT_QUOTES)];
        return '<span class="badge ' . $cls . '">' . $label . '</span>';
    }
}

if (!function_exists('channel_icon')) {
    function channel_icon(string $c): string
    {
        $c = strtoupper(trim($c));
        $map = [
            'WHATSAPP'       => '&#128241; WhatsApp',
            'EMAIL'          => '&#9993; Email',
            'SMS'            => '&#128172; SMS',
            'MESSENGER'      => '&#128172; Messenger',
            'PHONE'          => '&#9742; Phone',
            'INTERNAL_NOTE'  => '&#128221; Note',
        ];
        return $map[$c] ?? htmlspecialchars($c, ENT_QUOTES);
    }
}

/* ============================================================
   Render helpers
   ============================================================ */
if (!function_exists('render_empty')) {
    function render_empty(string $msg = 'No records found.'): void
    {
        echo '<div class="empty">' . e($msg) . '</div>';
    }
}

if (!function_exists('info_row')) {
    /** Render a labelled value row inside an .info-grid. */
    function info_row(string $label, $value, string $fmt = ''): string
    {
        $display = '';
        if ($value === null || $value === '') {
            $display = '—';
        } elseif ($fmt === 'date') {
            $display = e(format_date($value));
        } elseif ($fmt === 'datetime') {
            $display = e(format_date($value, 'M d, Y H:i'));
        } else {
            $display = e((string) $value);
        }
        return '<div class="info-row"><span class="lbl">' . e($label) . '</span>'
             . '<span class="val">' . $display . '</span></div>';
    }
}

if (!function_exists('render_pagination')) {
    /**
     * Render simple pagination links.
     *
     * @param int $page        Current page (1-based)
     * @param int $totalPages
     * @param string $base      Base URL (unused — query string is reused).
     */
    function render_pagination(int $page, int $totalPages, string $base = ''): void
    {
        if ($totalPages <= 1) return;
        $q = $_GET;
        echo '<div class="pagination">';
        if ($page > 1) {
            $q['page'] = $page - 1;
            echo '<a href="?' . http_build_query($q) . '">« Prev</a>';
        }
        $start = max(1, $page - 2);
        $end   = min($totalPages, $page + 2);
        for ($i = $start; $i <= $end; $i++) {
            if ($i === $page) {
                echo '<span class="current">' . $i . '</span>';
            } else {
                $q['page'] = $i;
                echo '<a href="?' . http_build_query($q) . '">' . $i . '</a>';
            }
        }
        if ($page < $totalPages) {
            $q['page'] = $page + 1;
            echo '<a href="?' . http_build_query($q) . '">Next »</a>';
        }
        echo '<span class="text-muted text-sm">Page ' . $page . ' of ' . $totalPages . '</span>';
        echo '</div>';
    }
}

if (!function_exists('csv_output')) {
    /**
     * Stream a CSV file to the browser and stop.
     *
     * @param string $filename
     * @param array<int,string> $headers
     * @param iterable<array<int,mixed>> $rows
     */
    function csv_output(string $filename, array $headers, iterable $rows): void
    {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');
        $fh = fopen('php://output', 'w');
        if ($fh === false) {
            return;
        }
        // BOM so Excel reads UTF-8
        fwrite($fh, "\xEF\xBB\xBF");
        fputcsv($fh, $headers);
        foreach ($rows as $row) {
            fputcsv($fh, array_map(static fn($v) => $v ?? '', $row));
        }
        fclose($fh);
        exit;
    }
}

if (!function_exists('nav_active')) {
    /** Echo "active" if the current script path matches $prefix. */
    function nav_active(string $prefix): string
    {
        $self = ltrim((string) ($_SERVER['PHP_SELF'] ?? ''), '/');
        $prefix = ltrim($prefix, '/');
        if ($self === $prefix) {
            return ' class="active"';
        }
        if (str_starts_with($self, $prefix . '/')) {
            return ' class="active"';
        }
        $topSelf = explode('/', $self)[0] ?? '';
        $topPrefix = explode('/', $prefix)[0] ?? '';
        if ($topSelf !== '' && $topSelf === $topPrefix) {
            return ' class="active"';
        }
        return '';
    }
}
