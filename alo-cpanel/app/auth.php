<?php
/**
 * ALO Education CRM — Authentication & Authorisation
 *
 * Depends on:
 *   - config/config.php constants  (DB_*, SESSION_LIFETIME, MAX_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES)
 *   - config/database.php  -> db()  PDO connection
 *
 * All functions are defined unconditionally — bootstrap.php loads this file
 * BEFORE app/helpers.php so helpers.php's wrappers (if any) are skipped via
 * `if (!function_exists(...))` guards.
 */
declare(strict_types=1);

/**
 * Lazy memoised cache of the currently-authenticated user row.
 *
 * @var array<string,mixed>|null
 */
$GLOBALS['__alo_current_user'] = null;

/**
 * Attempt to authenticate a user with email + password.
 *
 * @param string $email
 * @param string $password
 * @param bool   $remember  (ignored if APP_KEY not set; future expansion)
 * @return bool
 */
function attempt_login(string $email, string $password, bool $remember = false): bool
{
    $email = strtolower(trim($email));
    if ($email === '' || $password === '') {
        return false;
    }

    if (!check_brute_force($email)) {
        return false;
    }

    try {
        $stmt = db()->prepare(
            'SELECT id, name, email, password_hash, role, phone, status, last_login_at
             FROM users
             WHERE email = :email
             LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch();
    } catch (Throwable $e) {
        record_login_attempt($email, false);
        return false;
    }

    if (!$row || !is_array($row)) {
        record_login_attempt($email, false);
        return false;
    }

    if (strtolower((string) $row['status']) !== 'active') {
        record_login_attempt($email, false);
        return false;
    }

    $hash = (string) ($row['password_hash'] ?? '');
    if ($hash === '' || !password_verify($password, $hash)) {
        record_login_attempt($email, false);
        return false;
    }

    // ---- Success ----------------------------------------------------
    record_login_attempt($email, true);
    regenerate_session();

    $_SESSION['user_id']     = (int) $row['id'];
    $_SESSION['user_role']   = (string) $row['role'];
    $_SESSION['user_email'] = (string) $row['email'];
    $_SESSION['ip']          = $_SERVER['REMOTE_ADDR'] ?? '';
    $_SESSION['ua']         = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $_SESSION['login_at']   = time();

    // Invalidate cached user row
    $GLOBALS['__alo_current_user'] = null;

    // Update last_login_at
    try {
        $upd = db()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id');
        $upd->execute([':id' => $row['id']]);
    } catch (Throwable $e) {
        // Ignore — login still succeeded
    }

    if ($remember) {
        $token = bin2hex(random_bytes(32));
        try {
            $upd = db()->prepare('UPDATE users SET remember_token = :t WHERE id = :id');
            $upd->execute([':t' => hash('sha256', $token), ':id' => $row['id']]);
            setcookie(
                'remember_me',
                $row['id'] . ':' . $token,
                [
                    'expires'  => time() + (86400 * 30),
                    'path'     => '/',
                    'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]
            );
        } catch (Throwable $e) {
            // Ignore remember-me failures
        }
    }

    return true;
}

/**
 * Has any user been logged in on this session?
 */
function is_logged_in(): bool
{
    return !empty($_SESSION['user_id']) && is_int($_SESSION['user_id']);
}

/**
 * Fetch the full current user row from the database (cached per request).
 * Returns null if not logged in or row not found.
 *
 * @return array<string,mixed>|null
 */
function current_user(): ?array
{
    if ($GLOBALS['__alo_current_user'] !== null) {
        return $GLOBALS['__alo_current_user'];
    }

    if (!is_logged_in()) {
        return null;
    }

    try {
        $stmt = db()->prepare(
            'SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.last_login_at,
                    u.created_at
             FROM users u
             WHERE u.id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $row = $stmt->fetch();
    } catch (Throwable $e) {
        return null;
    }

    if (!$row || !is_array($row)) {
        // Session has stale user_id — clean up
        unset($_SESSION['user_id'], $_SESSION['user_role'], $_SESSION['user_email']);
        return null;
    }

    $GLOBALS['__alo_current_user'] = $row;
    return $row;
}

/**
 * The role string of the current user (or empty string).
 */
function current_user_role(): string
{
    if (!is_logged_in()) {
        return '';
    }
    if (!empty($_SESSION['user_role']) && is_string($_SESSION['user_role'])) {
        return (string) $_SESSION['user_role'];
    }
    // Fallback — re-read from the DB row
    $u = current_user();
    return is_array($u) ? (string) ($u['role'] ?? '') : '';
}

/**
 * Destroy the current session + clear remember-me cookie.
 */
function logout(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        @session_start();
    }

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            [
                'expires'  => time() - 42000,
                'path'     => $p['path'],
                'domain'   => $p['domain'],
                'secure'   => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => $p['samesite'] ?? 'Lax',
            ]
        );
    }

    if (!empty($_COOKIE['remember_me'])) {
        setcookie('remember_me', '', [
            'expires'  => time() - 42000,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    @session_destroy();
}

/**
 * If the current request is not authenticated, redirect to login.php.
 */
function require_login(): void
{
    if (is_logged_in()) {
        return;
    }
    $login = defined('APP_URL') ? rtrim(APP_URL, '/') . '/login.php' : '/login.php';
    $target = $_SERVER['REQUEST_URI'] ?? '/';
    // Avoid redirect-loop if already on login page
    if (str_contains((string) $target, 'login.php')) {
        $target = '/';
    }
    header('Location: ' . $login . '?redirect=' . urlencode((string) $target));
    exit;
}

/**
 * If the current user's role is not in the supplied list, abort with 403.
 *
 * @param string ...$roles
 */
function require_role(string ...$roles): void
{
    require_login();
    $current = current_user_role();
    if ($current === '' || !in_array($current, $roles, true)) {
        http_response_code(403);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!doctype html><html><head><meta charset="utf-8">'
           . '<title>403 — Forbidden</title></head><body>'
           . '<h1>403 — Forbidden</h1>'
           . '<p>You do not have permission to access this page.</p>'
           . '<p><a href="' . htmlspecialchars((defined('APP_URL') ? APP_URL : '/')) . '">Go home</a></p>'
           . '</body></html>';
        exit;
    }
}

/**
 * Has the current user been granted a specific permission?
 *
 * Super Admins implicitly have every permission.  Otherwise the permission
 * must exist in role_permissions OR user_permissions for the user.
 *
 * @param string $permission  e.g. 'students.view'
 * @return bool
 */
function has_permission(string $permission): bool
{
    if (!is_logged_in()) {
        return false;
    }
    $role = current_user_role();
    if ($role === 'super_admin') {
        return true;
    }
    try {
        $stmt = db()->prepare(
            'SELECT 1
               FROM role_permissions rp
               JOIN roles r ON r.id = rp.role_id
               JOIN permissions p ON p.id = rp.permission_id
              WHERE r.name = :role AND p.name = :perm
              LIMIT 1
              UNION
             SELECT 1
               FROM user_permissions up
               JOIN permissions p ON p.id = up.permission_id
              WHERE up.user_id = :uid AND p.name = :perm2
              LIMIT 1'
        );
        $uid = (int) $_SESSION['user_id'];
        $stmt->bindParam(':role', $role);
        $stmt->bindParam(':perm', $permission);
        $stmt->bindParam(':uid',  $uid, PDO::PARAM_INT);
        $stmt->bindParam(':perm2',$permission);
        $stmt->execute();
        return $stmt->fetchColumn() !== false;
    } catch (Throwable $e) {
        return false;
    }
}

/**
 * Throttle login attempts by email.  Returns false if locked out.
 *
 * @param string $email
 * @return bool  true = OK to attempt, false = currently locked out
 */
function check_brute_force(string $email): bool
{
    $email = strtolower(trim($email));
    if ($email === '') {
        return false;
    }
    $max = defined('MAX_LOGIN_ATTEMPTS') ? MAX_LOGIN_ATTEMPTS : 5;
    $lockMinutes = defined('LOGIN_LOCKOUT_MINUTES') ? LOGIN_LOCKOUT_MINUTES : 15;

    if (session_status() !== PHP_SESSION_ACTIVE) {
        @session_start();
    }

    $key = '__login_attempts_' . md5($email);

    $attempts = $_SESSION[$key] ?? [];
    if (!is_array($attempts)) {
        $attempts = [];
    }
    $cutoff = time() - ($lockMinutes * 60);
    $attempts = array_values(array_filter($attempts, static function (int $t) use ($cutoff): bool {
        return $t > $cutoff;
    }));

    if (count($attempts) >= $max) {
        return false;
    }
    return true;
}

/**
 * Record the outcome of a login attempt (success clears the counter).
 *
 * @param string $email
 * @param bool   $success
 */
function record_login_attempt(string $email, bool $success): void
{
    $email = strtolower(trim($email));
    if ($email === '') {
        return;
    }
    if (session_status() !== PHP_SESSION_ACTIVE) {
        @session_start();
    }
    $key = '__login_attempts_' . md5($email);
    if ($success) {
        unset($_SESSION[$key]);
        return;
    }
    $attempts = $_SESSION[$key] ?? [];
    if (!is_array($attempts)) {
        $attempts = [];
    }
    $attempts[] = time();
    $_SESSION[$key] = $attempts;
}

/**
 * Regenerate the session ID and preserve existing data — used after
 * privilege change (login, role switch, etc.).
 */
function regenerate_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        @session_start();
    }
    $old = $_SESSION;
    session_regenerate_id(true);
    $_SESSION = $old;
}
