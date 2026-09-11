<?php
/**
 * ALO Education CRM — Installer
 *
 * Multi-step wizard:
 *   1. System requirements check
 *   2. Database credentials form + test connection
 *   3. Create tables (schema.sql) + seed data (seed.sql)
 *   4. Create Super Admin account
 *   5. Write config/config.php + create .installed file + show success
 *
 * The installer does NOT require config.php to be pre-configured.
 * After successful installation a `.installed` file is created in
 * APP_ROOT which prevents this script from running again.
 */
declare(strict_types=1);

// ---------------------------------------------------------------
// Standalone bootstrap (no config.php dependency)
// ---------------------------------------------------------------
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
date_default_timezone_set('Asia/Dhaka');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 1800,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('ALO_INSTALL');
    session_start();
}

define('APP_ROOT',       __DIR__);
define('CONFIG_FILE',    APP_ROOT . '/config/config.php');
define('SCHEMA_FILE',    APP_ROOT . '/database/schema.sql');
define('SEED_FILE',      APP_ROOT . '/database/seed.sql');
define('INSTALLED_FILE', APP_ROOT . '/.installed');

// ---------------------------------------------------------------
// If already installed, refuse to run
// ---------------------------------------------------------------
if (is_file(INSTALLED_FILE)) {
    render_already_installed();
    exit;
}

// ---------------------------------------------------------------
// Routing
// ---------------------------------------------------------------
$step = isset($_REQUEST['step']) ? (int) $_REQUEST['step'] : 1;
if ($step < 1 || $step > 5) {
    $step = 1;
}

$errors = [];
$messages = [];

switch ($step) {
    case 1:
        handle_step_requirements();
        break;
    case 2:
        handle_step_database($errors);
        break;
    case 3:
        handle_step_schema($errors);
        break;
    case 4:
        handle_step_admin($errors);
        break;
    case 5:
        handle_step_finish($errors);
        break;
}

// ===============================================================
// Step handlers
// ===============================================================

/**
 * STEP 1 — System requirements
 */
function handle_step_requirements(): void
{
    $checks = run_requirement_checks();

    // Decide whether to allow continuation
    $canContinue = true;
    foreach ($checks as $c) {
        if (!empty($c['required']) && !$c['ok']) {
            $canContinue = false;
            break;
        }
    }

    render_header('Step 1 — System Requirements');
    echo '<h2>System Requirements</h2>';
    echo '<table class="checks"><tbody>';
    foreach ($checks as $c) {
        $icon = $c['ok']
            ? '<span class="ok">✔</span>'
            : '<span class="fail">✘</span>';
        $req = !empty($c['required']) ? '<strong>(required)</strong>' : '<em>(recommended)</em>';
        echo '<tr><td class="icon">' . $icon . '</td>'
           . '<td><div class="name">' . e($c['name']) . '</div>'
           . '<div class="msg">' . e($c['msg']) . ' ' . $req . '</div></td></tr>';
    }
    echo '</tbody></table>';

    if (!$canContinue) {
        echo '<div class="alert error">Your server does not meet the minimum requirements. '
           . 'Please fix the failing items above and refresh this page.</div>';
        echo '<p><a class="btn" href="?step=1">Re-check</a></p>';
    } else {
        echo '<div class="alert success">All required checks passed. Click Continue to proceed.</div>';
        echo '<p><a class="btn primary" href="?step=2">Continue → Database Setup</a></p>';
    }

    render_footer();
}

/**
 * STEP 2 — Database credentials form + test connection
 *
 * @param array $errors
 */
function handle_step_database(array &$errors): void
{
    // Pull submitted values (POST or session)
    $fields = ['db_host', 'db_port', 'db_name', 'db_user', 'db_pass', 'app_url', 'app_name'];
    $v = [];
    foreach ($fields as $f) {
        if (isset($_POST[$f])) {
            $v[$f] = trim((string) $_POST[$f]);
            $_SESSION['install'][$f] = $v[$f];
        } elseif (isset($_SESSION['install'][$f])) {
            $v[$f] = $_SESSION['install'][$f];
        } else {
            $v[$f] = $f === 'db_port' ? '3306' : ($f === 'app_url' ? 'https://localhost' : '');
        }
    }

    $testing = isset($_POST['test']) || isset($_POST['next']);
    $connected = false;
    $errorMsg = '';

    if ($testing) {
        if ($v['db_host'] === '' || $v['db_name'] === '' || $v['db_user'] === '') {
            $errors[] = 'Host, Database Name and Username are required.';
        } else {
            $result = try_db_connection($v);
            if ($result['ok']) {
                $connected = true;
                $_SESSION['install']['db_ok'] = true;
                $GLOBALS['messages'][] = 'Connected successfully to database "'
                    . e($v['db_name']) . '".';
            } else {
                $errorMsg = $result['error'];
                $errors[] = 'Database connection failed: ' . $result['error'];
                $_SESSION['install']['db_ok'] = false;
            }
        }
    }

    // If user clicked "Next" and connection was OK, advance
    if (isset($_POST['next']) && !empty($_SESSION['install']['db_ok'])) {
        header('Location: ?step=3');
        exit;
    }

    render_header('Step 2 — Database Configuration');
    echo '<h2>Database Configuration</h2>';

    if (!empty($errors)) {
        foreach ($errors as $e) {
            echo '<div class="alert error">' . e($e) . '</div>';
        }
    }
    if (!empty($GLOBALS['messages'])) {
        foreach ($GLOBALS['messages'] as $m) {
            echo '<div class="alert success">' . $m . '</div>';
        }
    }

    echo '<form method="post" action="?step=2" class="form">';
    echo '<input type="hidden" name="step" value="2">';

    echo '<div class="field"><label>Database Host</label>'
       . '<input type="text" name="db_host" value="' . e($v['db_host']) . '" placeholder="127.0.0.1" required></div>';

    echo '<div class="field"><label>Port</label>'
       . '<input type="text" name="db_port" value="' . e($v['db_port']) . '" placeholder="3306" required></div>';

    echo '<div class="field"><label>Database Name</label>'
       . '<input type="text" name="db_name" value="' . e($v['db_name']) . '" placeholder="db_education" required></div>';

    echo '<div class="field"><label>Database Username</label>'
       . '<input type="text" name="db_user" value="' . e($v['db_user']) . '" placeholder="user_edu" required></div>';

    echo '<div class="field"><label>Database Password</label>'
       . '<input type="password" name="db_pass" value="' . e($v['db_pass']) . '" autocomplete="new-password"></div>';

    echo '<hr><h3>Application</h3>';

    echo '<div class="field"><label>Application Name</label>'
       . '<input type="text" name="app_name" value="' . e($v['app_name']) . '" placeholder="ALO Education" required></div>';

    echo '<div class="field"><label>Application URL</label>'
       . '<input type="text" name="app_url" value="' . e($v['app_url']) . '" placeholder="https://aloeducation.com" required></div>';

    echo '<div class="actions">';
    echo '<a class="btn" href="?step=1">← Back</a> ';
    echo '<button type="submit" name="test" value="1" class="btn">Test Connection</button> ';
    echo '<button type="submit" name="next" value="1" class="btn primary"'
       . (empty($_SESSION['install']['db_ok']) ? ' disabled' : '')
       . '>Continue → Run Schema</button>';
    echo '</div>';

    echo '</form>';
    render_footer();
}

/**
 * STEP 3 — Create tables + seed data
 *
 * @param array $errors
 */
function handle_step_schema(array &$errors): void
{
    if (empty($_SESSION['install']['db_ok'])) {
        header('Location: ?step=2');
        exit;
    }

    $v = [
        'db_host' => $_SESSION['install']['db_host'] ?? '',
        'db_port' => $_SESSION['install']['db_port'] ?? '3306',
        'db_name' => $_SESSION['install']['db_name'] ?? '',
        'db_user' => $_SESSION['install']['db_user'] ?? '',
        'db_pass' => $_SESSION['install']['db_pass'] ?? '',
    ];

    $run = isset($_POST['run']);
    $output = [];
    $success = false;

    if ($run) {
        // 1. Connect
        try {
            $dsn = 'mysql:host=' . $v['db_host'] . ';port=' . $v['db_port']
                 . ';dbname=' . $v['db_name'] . ';charset=utf8mb4';
            $pdo = new PDO($dsn, $v['db_user'], $v['db_pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES  => false,
            ]);
            $output[] = '✓ Connected to database "' . $v['db_name'] . '".';
        } catch (PDOException $e) {
            $errors[] = 'Connection failed: ' . $e->getMessage();
            render_schema_page($errors, $output, false);
            return;
        }

        // 2. Run schema.sql
        $output[] = 'Loading schema.sql…';
        $schema = @file_get_contents(SCHEMA_FILE);
        if ($schema === false) {
            $errors[] = 'Cannot read ' . SCHEMA_FILE;
            render_schema_page($errors, $output, false);
            return;
        }
        $stmts = split_sql($schema);
        $count = 0;
        try {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            foreach ($stmts as $stmt) {
                $stmt = trim($stmt);
                if ($stmt === '' || str_starts_with($stmt, '--')) continue;
                $pdo->exec($stmt);
                $count++;
            }
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
            $output[] = '✓ Executed ' . $count . ' schema statements.';
        } catch (PDOException $e) {
            $errors[] = 'Schema error: ' . $e->getMessage();
            render_schema_page($errors, $output, false);
            return;
        }

        // 3. Run seed.sql
        $output[] = 'Loading seed.sql…';
        $seed = @file_get_contents(SEED_FILE);
        if ($seed === false) {
            $errors[] = 'Cannot read ' . SEED_FILE;
            render_schema_page($errors, $output, false);
            return;
        }
        $stmts = split_sql($seed);
        $count = 0;
        try {
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
            foreach ($stmts as $stmt) {
                $stmt = trim($stmt);
                if ($stmt === '' || str_starts_with($stmt, '--')) continue;
                $pdo->exec($stmt);
                $count++;
            }
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
            $output[] = '✓ Executed ' . $count . ' seed statements.';
        } catch (PDOException $e) {
            $errors[] = 'Seed error: ' . $e->getMessage();
            render_schema_page($errors, $output, false);
            return;
        }

        $_SESSION['install']['schema_ok'] = true;
        $success = true;
        $output[] = '✓ Database is ready.';
    }

    render_schema_page($errors, $output, $success);
}

/**
 * STEP 4 — Create Super Admin
 *
 * @param array $errors
 */
function handle_step_admin(array &$errors): void
{
    if (empty($_SESSION['install']['schema_ok'])) {
        header('Location: ?step=3');
        exit;
    }

    $fields = ['admin_name', 'admin_email', 'admin_pass', 'admin_pass_confirm'];
    $v = [];
    foreach ($fields as $f) {
        $v[$f] = isset($_POST[$f]) ? trim((string) $_POST[$f]) : '';
    }

    if (isset($_POST['create'])) {
        if ($v['admin_name'] === '') {
            $errors[] = 'Administrator name is required.';
        }
        if ($v['admin_email'] === '' || !filter_var($v['admin_email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'A valid administrator email is required.';
        }
        if (strlen($v['admin_pass']) < 8) {
            $errors[] = 'Password must be at least 8 characters.';
        }
        if ($v['admin_pass'] !== $v['admin_pass_confirm']) {
            $errors[] = 'Password confirmation does not match.';
        }

        if (empty($errors)) {
            // Insert super admin
            try {
                $pdo = install_pdo();
                $hash = password_hash($v['admin_pass'], PASSWORD_DEFAULT);

                // Check existing user
                $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
                $stmt->execute([$v['admin_email']]);
                if ($stmt->fetchColumn()) {
                    $errors[] = 'A user with that email already exists.';
                } else {
                    $stmt = $pdo->prepare(
                        'INSERT INTO users (name, email, password_hash, role, phone, status, last_login_at, created_at, updated_at)
                         VALUES (?, ?, ?, ?, NULL, ?, NULL, NOW(), NOW())'
                    );
                    $stmt->execute([
                        $v['admin_name'],
                        strtolower($v['admin_email']),
                        $hash,
                        'super_admin',
                        'active',
                    ]);
                    $uid = (int) $pdo->lastInsertId();

                    // Ensure Super Admin role has all permissions
                    $pdo->exec(
                        'INSERT IGNORE INTO role_permissions (role_id, permission_id)
                         SELECT 1, id FROM permissions'
                    );

                    $_SESSION['install']['admin_id']    = $uid;
                    $_SESSION['install']['admin_email'] = strtolower($v['admin_email']);
                    $_SESSION['install']['admin_name']  = $v['admin_name'];

                    header('Location: ?step=5');
                    exit;
                }
            } catch (PDOException $e) {
                $errors[] = 'Failed to create admin: ' . $e->getMessage();
            }
        }
    }

    render_header('Step 4 — Create Super Admin');
    echo '<h2>Create Super Admin Account</h2>';

    if (!empty($errors)) {
        foreach ($errors as $e) {
            echo '<div class="alert error">' . e($e) . '</div>';
        }
    }

    echo '<form method="post" action="?step=4" class="form">';
    echo '<input type="hidden" name="step" value="4">';

    echo '<div class="field"><label>Full Name</label>'
       . '<input type="text" name="admin_name" value="' . e($v['admin_name']) . '" required></div>';
    echo '<div class="field"><label>Email Address</label>'
       . '<input type="email" name="admin_email" value="' . e($v['admin_email']) . '" required></div>';
    echo '<div class="field"><label>Password <small>(min 8 characters)</small></label>'
       . '<input type="password" name="admin_pass" autocomplete="new-password" required></div>';
    echo '<div class="field"><label>Confirm Password</label>'
       . '<input type="password" name="admin_pass_confirm" autocomplete="new-password" required></div>';

    echo '<div class="actions">';
    echo '<a class="btn" href="?step=3">← Back</a> ';
    echo '<button type="submit" name="create" value="1" class="btn primary">Create Admin & Finish →</button>';
    echo '</div>';

    echo '</form>';
    render_footer();
}

/**
 * STEP 5 — Write config + create .installed + success page
 *
 * @param array $errors
 */
function handle_step_finish(array &$errors): void
{
    if (empty($_SESSION['install']['admin_id'])) {
        header('Location: ?step=4');
        exit;
    }

    $v = $_SESSION['install'];

    // Write config.php
    $configContent = build_config_file($v);
    $written = @file_put_contents(CONFIG_FILE, $configContent);
    if ($written === false) {
        $errors[] = 'Could not write to ' . CONFIG_FILE . '. Check file permissions.';
    }

    // Create .installed marker
    if (empty($errors)) {
        $marker = "installed=" . date('c') . "\nadmin_email=" . $v['admin_email'] . "\n";
        if (@file_put_contents(INSTALLED_FILE, $marker) === false) {
            $errors[] = 'Could not create .installed marker file at ' . INSTALLED_FILE;
        }
    }

    // Try to make uploads dir
    @mkdir(APP_ROOT . '/uploads', 0755, true);

    // Clear session install data
    $adminEmail = $v['admin_email'] ?? '';
    $adminName  = $v['admin_name']  ?? '';
    unset($_SESSION['install']);

    render_header('Step 5 — Installation Complete');
    echo '<h2>Installation Complete 🎉</h2>';

    if (!empty($errors)) {
        foreach ($errors as $e) {
            echo '<div class="alert error">' . e($e) . '</div>';
        }
        echo '<p>Some final steps failed. Please fix them manually.</p>';
    } else {
        echo '<div class="alert success">'
           . 'ALO Education CRM has been installed successfully.'
           . '</div>';
        echo '<div class="card">';
        echo '<h3>Super Admin Account</h3>';
        echo '<p><strong>Name:</strong> ' . e($adminName) . '</p>';
        echo '<p><strong>Email:</strong> ' . e($adminEmail) . '</p>';
        echo '<p class="muted">Keep these credentials safe — you will need them to sign in.</p>';
        echo '</div>';

        $loginUrl = 'login.php';
        echo '<p><a class="btn primary big" href="' . e($loginUrl) . '">Go to Login →</a></p>';

        echo '<div class="alert warning">'
           . '<strong>Security tip:</strong> delete <code>install.php</code> from your server now '
           . 'to prevent unauthorised re-installation.'
           . '</div>';
    }

    render_footer();
}

// ===============================================================
// Helper functions
// ===============================================================

/**
 * Run the requirement checks.
 *
 * @return array<int,array{name:string,msg:string,ok:bool,required?:bool}>
 */
function run_requirement_checks(): array
{
    $checks = [];

    // PHP version
    $checks[] = [
        'name'  => 'PHP version',
        'msg'   => 'Detected PHP ' . PHP_VERSION . ' — requires 8.2+',
        'ok'    => version_compare(PHP_VERSION, '8.2.0', '>='),
        'required' => true,
    ];

    // PDO
    $checks[] = [
        'name'  => 'PDO extension',
        'msg'   => extension_loaded('pdo') ? 'Loaded.' : 'Not loaded.',
        'ok'    => extension_loaded('pdo'),
        'required' => true,
    ];

    // PDO MySQL
    $checks[] = [
        'name'  => 'PDO MySQL driver',
        'msg'   => extension_loaded('pdo_mysql') ? 'Loaded.' : 'Not loaded.',
        'ok'    => extension_loaded('pdo_mysql'),
        'required' => true,
    ];

    // session
    $checks[] = [
        'name'  => 'Session support',
        'msg'   => extension_loaded('session') ? 'Loaded.' : 'Not loaded.',
        'ok'    => extension_loaded('session'),
        'required' => true,
    ];

    // mbstring
    $checks[] = [
        'name'  => 'mbstring extension',
        'msg'   => extension_loaded('mbstring') ? 'Loaded.' : 'Not loaded.',
        'ok'    => extension_loaded('mbstring'),
        'required' => true,
    ];

    // json
    $checks[] = [
        'name'  => 'JSON extension',
        'msg'   => function_exists('json_encode') ? 'Loaded.' : 'Not loaded.',
        'ok'    => function_exists('json_encode'),
        'required' => true,
    ];

    // ctype / tokenizer (recommended)
    $checks[] = [
        'name'  => 'ctype extension',
        'msg'   => extension_loaded('ctype') ? 'Loaded.' : 'Recommended for input validation.',
        'ok'    => extension_loaded('ctype'),
        'required' => false,
    ];

    // fileinfo
    $checks[] = [
        'name'  => 'fileinfo extension',
        'msg'   => extension_loaded('fileinfo') ? 'Loaded.' : 'Recommended for uploads.',
        'ok'    => extension_loaded('fileinfo'),
        'required' => false,
    ];

    // config/ writable
    $configDir = APP_ROOT . '/config';
    $checks[] = [
        'name'  => 'config/ directory writable',
        'msg'   => $configDir,
        'ok'    => is_writable($configDir),
        'required' => true,
    ];

    // database/ readable
    $dbDir = APP_ROOT . '/database';
    $checks[] = [
        'name'  => 'database/ directory readable',
        'msg'   => $dbDir,
        'ok'    => is_readable($dbDir) && is_file(SCHEMA_FILE) && is_file(SEED_FILE),
        'required' => true,
    ];

    // uploads/ writable (or creatable)
    $uploadsDir = APP_ROOT . '/uploads';
    $ok = is_writable($uploadsDir) || (!is_dir($uploadsDir) && is_writable(APP_ROOT));
    $checks[] = [
        'name'  => 'uploads/ directory writable (or creatable)',
        'msg'   => $uploadsDir,
        'ok'    => $ok,
        'required' => false,
    ];

    return $checks;
}

/**
 * Test a database connection using the supplied credentials.
 *
 * @param array $v
 * @return array{ok:bool,error:string}
 */
function try_db_connection(array $v): array
{
    if (!extension_loaded('pdo_mysql')) {
        return ['ok' => false, 'error' => 'PDO MySQL driver is not loaded.'];
    }
    try {
        $dsn = 'mysql:host=' . $v['db_host'] . ';port=' . $v['db_port']
             . ';dbname=' . $v['db_name'] . ';charset=utf8mb4';
        $pdo = new PDO($dsn, $v['db_user'], $v['db_pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES  => false,
        ]);
        // Make sure we can actually run a query
        $pdo->query('SELECT 1');
        return ['ok' => true, 'error' => ''];
    } catch (PDOException $e) {
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}

/**
 * Connect to the database using the session-stored credentials.
 *
 * @return PDO
 */
function install_pdo(): PDO
{
    $v = $_SESSION['install'];
    $dsn = 'mysql:host=' . $v['db_host'] . ';port=' . $v['db_port']
         . ';dbname=' . $v['db_name'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $v['db_user'], $v['db_pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES  => false,
    ]);
    return $pdo;
}

/**
 * Split an .sql file into individual statements.
 * Handles -- line comments and /* block comments * / and ";\n" terminators.
 *
 * @param string $sql
 * @return array<int,string>
 */
function split_sql(string $sql): array
{
    // Strip /* ... */ block comments
    $sql = preg_replace('!/\\*.*?\\*/!s', '', $sql) ?? $sql;

    // Remove -- and # line comments
    $lines = explode("\n", $sql);
    $cleaned = [];
    foreach ($lines as $line) {
        $trimmed = ltrim($line);
        if ($trimmed === '') { $cleaned[] = $line; continue; }
        if ($trimmed[0] === '-' && isset($trimmed[1]) && $trimmed[1] === '-') continue;
        if ($trimmed[0] === '#') continue;
        $cleaned[] = $line;
    }
    $sql = implode("\n", $cleaned);

    // Split on ; followed by whitespace/newline
    $parts = preg_split('/;\s*(\r?\n|$)/', $sql) ?: [];

    $stmts = [];
    foreach ($parts as $p) {
        $p = trim($p);
        if ($p === '') continue;
        // Add back the semicolon for completeness
        $stmts[] = $p . ';';
    }
    return $stmts;
}

/**
 * Build the new config/config.php file contents.
 *
 * @param array $v
 * @return string
 */
function build_config_file(array $v): string
{
    $host    = var_export($v['db_host'] ?? '127.0.0.1', true);
    $port    = var_export($v['db_port'] ?? '3306', true);
    $name     = var_export($v['db_name'] ?? '', true);
    $user    = var_export($v['db_user'] ?? '', true);
    $pass    = var_export($v['db_pass'] ?? '', true);
    $appName = var_export($v['app_name'] ?? 'ALO Education', true);
    $appUrl  = var_export($v['app_url']  ?? 'https://localhost', true);
    $appKey  = var_export(bin2hex(random_bytes(16)), true);
    $now     = date('Y-m-d H:i:s');

    $tpl = <<<'TPL'
<?php
/**
 * ALO Education — Configuration
 * Generated by installer on {NOW}
 */

// --- Application ---
define('APP_NAME', {APP_NAME});
define('APP_URL',  {APP_URL});
define('APP_KEY',  {APP_KEY});
define('APP_ENV',  'production');
define('APP_DEBUG', false);

// --- Database ---
define('DB_HOST',     {HOST});
define('DB_PORT',     {PORT});
define('DB_DATABASE', {NAME});
define('DB_USERNAME', {USER});
define('DB_PASSWORD', {PASS});
define('DB_CHARSET', 'utf8mb4');

// --- Mail (SMTP) ---
define('MAIL_HOST',     'smtp.example.com');
define('MAIL_PORT',     '587');
define('MAIL_USERNAME', 'noreply@aloeducation.com');
define('MAIL_PASSWORD', '');
define('MAIL_FROM',     'noreply@aloeducation.com');
define('MAIL_FROM_NAME','ALO Education');

// --- WhatsApp (optional) ---
define('WA_API_URL', '');
define('WA_API_TOKEN', '');
define('WA_PHONE_NUMBER', '');

// --- SMS (optional) ---
define('SMS_API_URL', '');
define('SMS_API_TOKEN', '');

// --- Security ---
define('SESSION_LIFETIME', 7200);
define('CSRF_TOKEN_NAME', '_csrf_token');
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_MINUTES', 15);

// --- Upload ---
define('MAX_UPLOAD_SIZE', 10485760);
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('ALLOWED_EXTENSIONS', ['pdf','jpg','jpeg','png','gif','webp','doc','docx','xls','xlsx','csv','txt','zip']);
TPL;

    return strtr($tpl, [
        '{NOW}'       => $now,
        '{APP_NAME}'  => $appName,
        '{APP_URL}'   => $appUrl,
        '{APP_KEY}'   => $appKey,
        '{HOST}'      => $host,
        '{PORT}'      => $port,
        '{NAME}'      => $name,
        '{USER}'      => $user,
        '{PASS}'      => $pass,
    ]);
}

/**
 * Render the schema step page.
 *
 * @param array $errors
 * @param array $output  log lines
 * @param bool  $success
 */
function render_schema_page(array $errors, array $output, bool $success): void
{
    render_header('Step 3 — Database Setup');
    echo '<h2>Create Tables &amp; Seed Data</h2>';

    if (!empty($errors)) {
        foreach ($errors as $e) {
            echo '<div class="alert error">' . e($e) . '</div>';
        }
    }

    if (!empty($output)) {
        echo '<div class="console">';
        foreach ($output as $line) {
            echo '<div>' . e($line) . '</div>';
        }
        echo '</div>';
    }

    if ($success) {
        echo '<div class="alert success">Schema &amp; seed completed successfully.</div>';
        echo '<form method="post" action="?step=4">';
        echo '<a class="btn" href="?step=2">← Back</a> ';
        echo '<button type="submit" class="btn primary">Continue → Create Admin</button>';
        echo '</form>';
    } else {
        echo '<p>The installer will run <code>database/schema.sql</code> and '
           . '<code>database/seed.sql</code> against your database.</p>';
        echo '<div class="alert warning">'
           . 'WARNING: this will DROP and re-create all CRM tables. '
           . 'Make sure the database "' . e($_SESSION['install']['db_name'] ?? '')
           . '" is the correct one.'
           . '</div>';
        echo '<form method="post" action="?step=3">';
        echo '<input type="hidden" name="run" value="1">';
        echo '<a class="btn" href="?step=2">← Back</a> ';
        echo '<button type="submit" class="btn primary">Run Schema &amp; Seed</button>';
        echo '</form>';
    }

    render_footer();
}

/**
 * Show "already installed" page.
 */
function render_already_installed(): void
{
    render_header('Already Installed');
    echo '<h2>ALO Education CRM is already installed</h2>';
    echo '<p>This installer has already been run. To re-install, delete the '
       . '<code>.installed</code> file from the project root.</p>';
    $loginUrl = 'login.php';
    echo '<p><a class="btn primary" href="' . e($loginUrl) . '">Go to Login →</a></p>';
    render_footer();
}

// ===============================================================
// Render helpers
// ===============================================================

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

function render_header(string $title): void
{
    $step = isset($_REQUEST['step']) ? (int) $_REQUEST['step'] : 1;
    if ($step < 1 || $step > 5) $step = 1;
    echo '<!doctype html>';
    echo '<html lang="en"><head>';
    echo '<meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>' . e($title) . ' — ALO Education CRM Installer</title>';
    echo '<style>' . install_css() . '</style>';
    echo '</head><body>';
    echo '<div class="wrap">';
    echo '<header><div class="brand">ALO Education CRM</div>'
       . '<div class="subtitle">Installer</div></header>';
    echo '<main>';
    echo '<div class="steps">';
    for ($i = 1; $i <= 5; $i++) {
        $cls = $i === $step ? 'active' : ($i < $step ? 'done' : '');
        echo '<span class="step ' . $cls . '">' . $i . '</span>';
    }
    echo '</div>';
}

function render_footer(): void
{
    echo '</main>';
    echo '<footer>ALO Education CRM &copy; ' . date('Y') . '</footer>';
    echo '</div>';
    echo '</body></html>';
}

function install_css(): string
{
    return <<<CSS
* { box-sizing: border-box; }
body {
  margin: 0; padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #f5f6fa; color: #2d3748; line-height: 1.55;
}
.wrap { max-width: 880px; margin: 0 auto; padding: 24px 16px 80px; }
header { padding: 24px 0 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px; }
.brand { font-size: 1.5rem; font-weight: 700; color: #4f46e5; }
.subtitle { color: #718096; font-size: 0.95rem; }
h2 { margin-top: 0; color: #1a202c; }
h3 { color: #2d3748; margin-bottom: 0.5rem; }
main { background: #fff; padding: 28px 32px; border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04); }
footer { margin-top: 24px; text-align: center; color: #a0aec0; font-size: 0.85rem; }
.form { display: grid; gap: 14px; }
.field label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; color: #4a5568; }
.field input[type="text"], .field input[type="email"], .field input[type="password"] {
  width: 100%; padding: 9px 11px; border: 1px solid #cbd5e0; border-radius: 6px;
  font-size: 0.95rem; background: #fff; transition: border-color .15s;
}
.field input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
.actions { margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
.btn {
  display: inline-block; padding: 9px 18px; background: #edf2f7; color: #2d3748;
  border: 1px solid #cbd5e0; border-radius: 6px; text-decoration: none;
  font-size: 0.92rem; cursor: pointer; transition: all .15s;
}
.btn:hover { background: #e2e8f0; }
.btn.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.btn.primary:hover { background: #4338ca; }
.btn.primary:disabled { background: #a0aec0; border-color: #a0aec0; cursor: not-allowed; }
.btn.big { padding: 12px 28px; font-size: 1rem; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
.alert { padding: 12px 16px; border-radius: 6px; margin: 14px 0; font-size: 0.92rem; }
.alert.success { background: #f0fff4; color: #22543d; border: 1px solid #9ae6b4; }
.alert.error   { background: #fff5f5; color: #742a2a; border: 1px solid #feb2b2; }
.alert.warning { background: #fffff0; color: #744210; border: 1px solid #f6e05e; }
.alert code, .card code, p code { background: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; }
.card { background: #f7fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0; }
.card h3 { margin-top: 0; }
.muted { color: #718096; font-size: 0.85rem; }
.checks { width: 100%; border-collapse: collapse; margin: 12px 0; }
.checks td { padding: 10px 6px; border-bottom: 1px solid #edf2f7; vertical-align: top; }
.checks td.icon { width: 32px; font-size: 1.1rem; }
.checks .ok { color: #38a169; font-weight: 700; }
.checks .fail { color: #e53e3e; font-weight: 700; }
.checks .name { font-weight: 600; }
.checks .msg { font-size: 0.85rem; color: #718096; }
.steps { display: flex; gap: 6px; margin-bottom: 18px; }
.step { width: 32px; height: 32px; border-radius: 50%; background: #edf2f7; color: #718096;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; }
.step.active { background: #4f46e5; color: #fff; }
.step.done { background: #38a169; color: #fff; }
.console { background: #1a202c; color: #d1d5db; padding: 16px; border-radius: 6px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.85rem; max-height: 320px; overflow: auto; margin: 14px 0; }
.console div { padding: 2px 0; }
CSS;
}
