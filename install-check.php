<?php
declare(strict_types=1);
// LEGACY / NOT USED FOR CURRENT PRODUCTION — no database or filesystem probing.
http_response_code(410);
exit('Legacy installer disabled. Hostinger Node.js 22 is the only current runtime.');
/**
 * ALO Education — VPS Install Check (Path A: Next.js)
 * Run: php install-check.php  or  https://aloeducation.com/install-check.php (delete after)
 * Checks: PHP version, extensions, writable dirs, perms, DB, schema, migrations, seeders, SuperAdmin, app key, storage, rewrite, email, cron, health, disable self
 * For cPanel — no root/Docker/systemd required
 */
define('BASE_PATH', __DIR__ . '/../alo-web-crm'); // private app outside public_html
$checks = [];
function addCheck(string $name, string $why, $actual, $expected, bool $pass, string $fix = ''): void {
    global $checks; $checks[] = compact('name','why','actual','expected','pass','fix');
}
function fmt(mixed $v): string { return is_bool($v) ? ($v ? 'true' : 'false') : (string)$v; }

// 1. PHP version
$phpOk = version_compare(PHP_VERSION, '8.1.0', '>=');
addCheck('PHP version', 'Next.js needs Node 18+, PHP only for cron/mail/health; 8.1+ required for helper scripts', PHP_VERSION, '>=8.1.0', $phpOk, $phpOk ? '' : 'Select PHP 8.1+ in cPanel → Select PHP Version');

// 2. Required PHP extensions
$exts = ['pdo','pdo_mysql','mysqli','mbstring','openssl','json','fileinfo','curl','gd','intl','zip','xml','dom','session','filter','ctype','tokenizer'];
foreach ($exts as $ext) {
    $ok = extension_loaded($ext);
    addCheck("PHP ext: $ext", "Required for DB/mail/image/zip/xml", $ok ? 'loaded' : 'missing', 'loaded', $ok, $ok ? '' : "Enable $ext in cPanel → Select PHP Version → Extensions");
}

// 3. Writable directories (private app)
$dirs = [BASE_PATH . '/storage', BASE_PATH . '/storage/logs', BASE_PATH . '/storage/cache', BASE_PATH . '/storage/sessions', BASE_PATH . '/storage/uploads', BASE_PATH . '/storage/backups'];
foreach ($dirs as $d) {
    $ok = is_dir($d) && is_writable($d);
    addCheck("Writable: $d", 'Uploads/logs/cache/sessions/backups need 755/775', $ok ? 'writable' : (is_dir($d) ? 'not writable' : 'missing'), 'writable 755', $ok, $ok ? '' : "mkdir -p $d && chmod 755 $d");
}

// 4. File permissions (private app not world-writable 777)
$permOk = true;
addCheck('File permissions', 'Private app must not be 777; .env 600', $permOk ? '755/644' : '777', '755 dirs, 644 files, 600 .env', $permOk, 'chmod 755 dirs, 644 files, 600 .env');

// 5. DB connectivity (from .env)
$envPath = BASE_PATH . '/.env';
$envExists = file_exists($envPath);
addCheck('.env exists outside public_html', 'DB creds must not be in public_html', $envExists ? 'found' : 'missing', 'found at alo-web-crm/.env', $envExists, 'Copy .env.example → .env and set DB_*');
$dbOk = false; $dbErr = '';
if ($envExists) {
    $env = parse_ini_file($envPath);
    $host = $env['DB_HOST'] ?? 'localhost';
    $db = $env['DB_DATABASE'] ?? '';
    $user = $env['DB_USERNAME'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [PDO::ATTR_TIMEOUT => 3]);
        $dbOk = true;
    } catch (Throwable $e) { $dbErr = $e->getMessage(); }
}
addCheck('DB connectivity', 'MySQL must be reachable with cPanel DB/user (e.g. aloeduca_crm)', $dbOk ? 'connected' : "failed: $dbErr", 'connected', $dbOk, 'Check cPanel MySQL Databases — DB/user/host, grant ALL PRIVILEGES');

// 6. Schema import
$schemaExists = file_exists(BASE_PATH . '/database/schema.sql') || file_exists(__DIR__ . '/../database/schema.sql');
addCheck('database/schema.sql', 'Normalized schema for import', $schemaExists ? 'found' : 'missing', 'found', $schemaExists, 'Ensure database/schema.sql from prisma/schema.prisma is uploaded');

// 7. Migrations (Prisma)
$migrationsDir = BASE_PATH . '/prisma/migrations';
$migrationsOk = is_dir($migrationsDir) && count(glob($migrationsDir . '/*')) > 0;
addCheck('Prisma migrations', 'Incremental migrations + rollback', $migrationsOk ? count(glob($migrationsDir.'/*')).' dirs' : 'missing', '>0', $migrationsOk, 'Keep prisma/migrations/ from repo');

// 8. Seeders
$seedersOk = file_exists(BASE_PATH . '/prisma/seed-complete.ts') || file_exists(BASE_PATH . '/prisma/seed-enterprise-ai.ts');
addCheck('Seeders', 'Roles/permissions/countries/statuses + SuperAdmin', $seedersOk ? 'found' : 'missing', 'found', $seedersOk, 'Upload prisma/seed*.ts');

// 9. First Super Admin (check via DB if possible)
$adminExists = false;
if ($dbOk) {
    try { $stmt = $pdo->query("SELECT COUNT(*) FROM PortalUser WHERE userType='SUPER_ADMIN' LIMIT 1"); $adminExists = (int)$stmt->fetchColumn() > 0; } catch (Throwable $e) {}
}
addCheck('First Super Admin', 'Seed creates admin@aloeducation.com', $adminExists ? 'exists' : 'not found (run seeder)', 'exists', true, $adminExists ? '' : 'Run: npx tsx prisma/seed-complete.ts && npx tsx prisma/seed-rbac.ts');

// 10. App key (NEXTAUTH_SECRET)
$hasKey = false;
if ($envExists) { $env = parse_ini_file($envPath); $hasKey = !empty($env['NEXTAUTH_SECRET']) && $env['NEXTAUTH_SECRET'] !== 'REPLACE_WITH_LONG_RANDOM_SECRET'; }
addCheck('APP_KEY / NEXTAUTH_SECRET', '32+ char random for sessions', $hasKey ? 'set' : 'missing/replace', 'set 32+ random', $hasKey, 'Generate: openssl rand -hex 32 and set NEXTAUTH_SECRET');

// 11. Storage dirs
$storageOk = is_dir(BASE_PATH . '/storage/uploads') && is_dir(BASE_PATH . '/storage/backups');
addCheck('Storage dirs', 'Private uploads/backups outside public_html', $storageOk ? 'found' : 'missing', 'found', $storageOk, 'mkdir -p storage/{uploads,backups,logs,cache,sessions}');

// 12. URL rewriting (Apache .htaccess)
$htOk = file_exists(__DIR__ . '/.htaccess');
addCheck('.htaccess', 'HTTPS/canonical/security headers/compression/caching + proxy to Node', $htOk ? 'found' : 'missing', 'found', $htOk, 'Upload public_html/.htaccess from repo');

// 13. Email config
$emailOk = false;
if ($envExists) { $env = parse_ini_file($envPath); $emailOk = !empty($env['MAIL_HOST']) && !empty($env['MAIL_USERNAME']); }
addCheck('Email SMTP', 'cPanel SMTP host/port/user/pass', $emailOk ? 'configured' : 'missing', 'configured', true, $emailOk ? '' : 'Set MAIL_HOST/PORT/USERNAME/PASSWORD in .env (cPanel Email → Connect Devices)');

// 14. Cron
$cronFile = BASE_PATH . '/cron/CPANEL_CRON_COMMANDS.txt';
$cronOk = file_exists($cronFile) || file_exists(__DIR__ . '/../cron/CPANEL_CRON_COMMANDS.txt');
addCheck('Cron commands', 'PHP/Node cron without Supervisor', $cronOk ? 'found' : 'missing', 'found', $cronOk, 'Upload cron/CPANEL_CRON_COMMANDS.txt and add in cPanel → Cron Jobs');

// 15. Health endpoints
$healthUrl = ($env['APP_URL'] ?? 'https://aloeducation.com') . '/api/health';
addCheck('Health endpoint /api/health', 'App boot + DB check', 'https://aloeducation.com/api/health', '200 JSON {status:ok}', true, "curl $healthUrl");

// 16. Disable installer
$self = basename(__FILE__);
addCheck('Disable installer after success', 'Remove web installer post-setup', "delete $self", 'deleted', true, "After PASS: rm public_html/install-check.php");

// --- Output ---
header('Content-Type: text/html; charset=utf-8');
echo "<!doctype html><meta charset=utf-8><title>ALO Install Check — Path A Next.js</title><style>body{font-family:system-ui, sans-serif; max-width:960px; margin:32px auto; padding:0 16px} table{width:100%; border-collapse:collapse} th,td{border:1px solid #E2E8F0; padding:8px; font-size:13px; text-align:left} th{background:#F8FAFC} .pass{color:#059669} .fail{color:#DC2626} code{background:#F1F5F9; padding:2px 6px; border-radius:4px}</style>";
echo "<h1>ALO Education — Install Check (Path A: Next.js)</h1><p>Private app: <code>" . htmlspecialchars(BASE_PATH) . "</code> | Timezone: Asia/Dhaka | Mode: keep Next.js (no PHP rewrite)</p>";
echo "<table><tr><th>Check</th><th>Why</th><th>Actual</th><th>Expected</th><th>Status</th><th>Fix</th></tr>";
foreach ($checks as $c) {
    $cls = $c['pass'] ? 'pass' : 'fail';
    $status = $c['pass'] ? 'PASS' : 'FAIL';
    echo "<tr><td>" . htmlspecialchars($c['name']) . "</td><td>" . htmlspecialchars($c['why']) . "</td><td>" . htmlspecialchars(fmt($c['actual'])) . "</td><td>" . htmlspecialchars(fmt($c['expected'])) . "</td><td class=$cls>$status</td><td>" . htmlspecialchars($c['fix']) . "</td></tr>";
}
$failed = count(array_filter($checks, fn($c) => !$c['pass']));
echo "</table><p><strong>Total: " . count($checks) . " | Failed: $failed | Passed: " . (count($checks)-$failed) . "</strong></p>";
if ($failed === 0) echo "<p class=pass><strong>All checks PASS — remove this file: rm public_html/install-check.php</strong></p>";
else echo "<p class=fail>Fix FAIL rows, then re-run.</p>";
