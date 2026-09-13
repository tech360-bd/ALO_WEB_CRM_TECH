<?php
/**
 * ALO Education CRM — Logout
 *
 * Destroys the session and the remember-me cookie,
 * then redirects back to the login page.
 */
declare(strict_types=1);

// Bootstrap gives us session + helpers, but we want to skip the
// automatic CSRF check on logout so it works as a plain link.
$GLOBALS['__skip_csrf'] = true;

require_once __DIR__ . '/app/bootstrap.php';

// Capture the user id before destroying the session for audit logging
$userId = is_logged_in() ? (int) ($_SESSION['user_id'] ?? 0) : 0;

logout();

// Best-effort audit entry — never block logout on failure
if ($userId > 0) {
    try {
        log_audit('logout', 'users', $userId);
    } catch (Throwable $e) { /* ignore */ }
}

redirect('login.php');
