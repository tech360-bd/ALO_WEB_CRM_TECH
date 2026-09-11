<?php
/**
 * 404 — Not Found
 *
 * Renders a professional 404 page with a link back to the dashboard.
 */
declare(strict_types=1);

/* Load bootstrap (which starts a session + defines helpers) — config may not exist yet */
require_once __DIR__ . '/app/bootstrap.php';

http_response_code(404);

$isLoggedIn = is_logged_in();
$home = $isLoggedIn ? url('index.php') : url('login.php');
$homeLabel = $isLoggedIn ? 'Dashboard' : 'Login';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 — Not Found | <?php echo e(APP_NAME); ?> CRM</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="stylesheet" href="<?php echo e(asset('css/style.css')); ?>?v=<?php echo filemtime(APP_ROOT . '/assets/css/style.css'); ?>">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23E8501A'/><text x='50%25' y='55%25' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle' dominant-baseline='middle'>A</text></svg>">
    <style>
        body { margin:0; background:#f7f8fb; color:#0f172a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
        .err-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
        .err-card { background:#fff; padding:48px 64px; border-radius:14px; box-shadow:0 12px 40px rgba(15,23,42,0.08); max-width:520px; text-align:center; }
        .err-code { font-size:6rem; font-weight:800; line-height:1; color:#6366f1; letter-spacing:-3px; margin:0; }
        .err-title { font-size:1.4rem; margin:8px 0 12px; font-weight:700; }
        .err-msg { color:#64748b; margin-bottom:24px; line-height:1.55; }
        .err-actions a { display:inline-block; padding:10px 22px; border-radius:8px; text-decoration:none; font-weight:600; margin:0 8px; }
        .btn-primary { background:#6366f1; color:#fff; }
        .btn-secondary { background:#e2e8f0; color:#0f172a; }
        .err-actions a:hover { opacity:0.92; }
    </style>
</head>
<body>
<div class="err-wrap">
    <div class="err-card">
        <div class="err-code">404</div>
        <div class="err-title">Page not found</div>
        <p class="err-msg">
            The page you are looking for doesn't exist or has been moved.
            If you reached this page from a link inside the CRM, please
            report it to your administrator.
        </p>
        <div class="err-actions">
            <a href="<?php echo e($home); ?>" class="btn-primary">&larr; Go to <?php echo e($homeLabel); ?></a>
            <a href="javascript:history.back()" class="btn-secondary">Go back</a>
        </div>
    </div>
</div>
</body>
</html>
