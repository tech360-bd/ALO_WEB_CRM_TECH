<?php
/**
 * 500 — Internal Server Error
 *
 * Renders a professional 500 page. Triggered by web server on PHP fatal errors
 * (configured via .htaccess ErrorDocument 500 /500.php).
 */
declare(strict_types=1);

/* Suppress any further errors and send the right status */
http_response_code(500);

/* Try to load bootstrap for APP_NAME + asset() helper, but fail gracefully */
$appName = 'ALO Education';
$cssPath = '/assets/css/style.css';
try {
    if (is_file(__DIR__ . '/app/bootstrap.php')) {
        require_once __DIR__ . '/app/bootstrap.php';
        $appName = defined('APP_NAME') ? APP_NAME : 'ALO Education';
        $cssPath = asset('css/style.css');
    }
} catch (Throwable $e) {
    /* Ignore — fall through to hardcoded defaults */
}

/* If user was logged in, link to dashboard; else login */
$home = '/login.php';
$homeLabel = 'Login';
try {
    if (function_exists('is_logged_in') && is_logged_in()) {
        $home = function_exists('url') ? url('index.php') : '/index.php';
        $homeLabel = 'Dashboard';
    }
} catch (Throwable $e) { /* ignore */ }

/* App debug mode may show full error */
$debug = (defined('APP_DEBUG') && APP_DEBUG);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>500 — Server Error | <?php echo htmlspecialchars($appName, ENT_QUOTES); ?> CRM</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="stylesheet" href="<?php echo htmlspecialchars($cssPath, ENT_QUOTES); ?>">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23E8501A'/><text x='50%25' y='55%25' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle' dominant-baseline='middle'>A</text></svg>">
    <style>
        body { margin:0; background:#f7f8fb; color:#0f172a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
        .err-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
        .err-card { background:#fff; padding:48px 64px; border-radius:14px; box-shadow:0 12px 40px rgba(15,23,42,0.08); max-width:580px; text-align:center; }
        .err-code { font-size:6rem; font-weight:800; line-height:1; color:#dc2626; letter-spacing:-3px; margin:0; }
        .err-title { font-size:1.4rem; margin:8px 0 12px; font-weight:700; }
        .err-msg { color:#64748b; margin-bottom:24px; line-height:1.55; }
        .err-actions a { display:inline-block; padding:10px 22px; border-radius:8px; text-decoration:none; font-weight:600; margin:0 8px; }
        .btn-primary { background:#dc2626; color:#fff; }
        .btn-secondary { background:#e2e8f0; color:#0f172a; }
        .err-actions a:hover { opacity:0.92; }
        .err-debug { background:#1e293b; color:#f1f5f9; padding:14px 16px; border-radius:8px; margin-top:16px; text-align:left; font-family:'SFMono-Regular',Consolas,monospace; font-size:0.85rem; white-space:pre-wrap; overflow-x:auto; }
    </style>
</head>
<body>
<div class="err-wrap">
    <div class="err-card">
        <div class="err-code">500</div>
        <div class="err-title">Something went wrong</div>
        <p class="err-msg">
            An internal server error occurred. Our team has been notified.
            Please try again in a few moments — or contact your administrator
            if the problem persists.
        </p>
        <div class="err-actions">
            <a href="<?php echo htmlspecialchars($home, ENT_QUOTES); ?>" class="btn-primary">&larr; Go to <?php echo htmlspecialchars($homeLabel, ENT_QUOTES); ?></a>
            <a href="javascript:history.back()" class="btn-secondary">Go back</a>
        </div>
        <?php if ($debug && isset($e)): ?>
            <div class="err-debug"><?php echo htmlspecialchars((string) $e, ENT_QUOTES); ?></div>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
