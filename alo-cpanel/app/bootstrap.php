<?php
/**
 * ALO Education CRM — Application Bootstrap
 *
 * Includes:
 *   - config/config.php        (application constants)
 *   - config/database.php      (db()  PDO connection)
 *   - app/csrf.php
 *   - app/validation.php
 *   - app/permissions.php
 *   - app/auth.php
 *   - app/helpers.php
 *
 *   - starts a secure session
 *   - sets error_reporting based on APP_DEBUG
 *   - sets timezone to Asia/Dhaka
 *
 * After including this file the caller should run `csrf_check()` for routes
 * that accept POST/PUT/DELETE.
 */
declare(strict_types=1);

/* ------------------------------------------------------------
 * 1. Project paths
 * ----------------------------------------------------------- */
define('APP_ROOT',   dirname(__DIR__));
define('CONFIG_PATH', APP_ROOT . '/config/config.php');
define('APP_PATH',   __DIR__);

/* ------------------------------------------------------------
 * 2. Load configuration (if present — installer writes it later)
 * ----------------------------------------------------------- */
if (is_file(CONFIG_PATH)) {
    require_once CONFIG_PATH;
}

// Reasonable fallback defaults so bootstrap can be loaded
// even before the installer has written config.php.
if (!defined('APP_NAME'))   { define('APP_NAME',   'ALO Education'); }
if (!defined('APP_URL'))    { define('APP_URL',    'http://localhost'); }
if (!defined('APP_ENV'))    { define('APP_ENV',    'development'); }
if (!defined('APP_DEBUG'))  { define('APP_DEBUG',  APP_ENV === 'development'); }
if (!defined('APP_KEY'))    { define('APP_KEY',    ''); }
if (!defined('DB_CHARSET')){ define('DB_CHARSET', 'utf8mb4'); }
if (!defined('SESSION_LIFETIME')) { define('SESSION_LIFETIME', 7200); }
if (!defined('CSRF_TOKEN_NAME')) { define('CSRF_TOKEN_NAME', '_csrf_token'); }
if (!defined('MAX_LOGIN_ATTEMPTS')) { define('MAX_LOGIN_ATTEMPTS', 5); }
if (!defined('LOGIN_LOCKOUT_MINUTES')) { define('LOGIN_LOCKOUT_MINUTES', 15); }
if (!defined('MAX_UPLOAD_SIZE')) { define('MAX_UPLOAD_SIZE', 10485760); }
if (!defined('UPLOAD_DIR')) { define('UPLOAD_DIR', APP_ROOT . '/uploads/'); }
if (!defined('ALLOWED_EXTENSIONS')) {
    define('ALLOWED_EXTENSIONS', ['pdf','jpg','jpeg','png','gif','webp','doc','docx','xls','xlsx','csv','txt','zip']);
}

/* ------------------------------------------------------------
 * 3. Error reporting
 * ----------------------------------------------------------- */
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
}

/* ------------------------------------------------------------
 * 4. Timezone
 * ----------------------------------------------------------- */
date_default_timezone_set('Asia/Dhaka');

/* ------------------------------------------------------------
 * 5. Secure session
 * ----------------------------------------------------------- */
if (session_status() === PHP_SESSION_NONE) {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
              || (($_SERVER['SERVER_PORT'] ?? '') === 443);
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('ALO_SESS');
    session_start();

    // Rotate session ID every 30 minutes to reduce fixation risk
    if (!isset($_SESSION['__created'])) {
        $_SESSION['__created'] = time();
    } elseif (time() - $_SESSION['__created'] > 1800) {
        session_regenerate_id(true);
        $_SESSION['__created'] = time();
    }
}

/* ------------------------------------------------------------
 * 6. Load database connection helper
 * ----------------------------------------------------------- */
require_once APP_ROOT . '/config/database.php';

/* ------------------------------------------------------------
 * 7. Load CSRF, validation, permissions, auth, helpers
 * ----------------------------------------------------------- */
require_once APP_PATH . '/csrf.php';
require_once APP_PATH . '/validation.php';
require_once APP_PATH . '/permissions.php';
require_once APP_PATH . '/auth.php';
require_once APP_PATH . '/helpers.php';
require_once APP_PATH . '/layout.php';

/* ------------------------------------------------------------
 * 8. Run CSRF check on unsafe methods (can be disabled per-route
 *    by setting $GLOBALS['__skip_csrf'] = true before require).
 * ----------------------------------------------------------- */
if (empty($GLOBALS['__skip_csrf'])) {
    csrf_check();
}
