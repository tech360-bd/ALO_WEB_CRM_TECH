<?php
/**
 * Reset Password page
 *
 * Verifies a token from ?token=XXX, then on POST (with CSRF) sets a new
 * password_hash, clears remember_token, redirects to login.
 */
declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';

if (is_logged_in()) {
    redirect('index.php');
}

$token = trim((string) ($_GET['token'] ?? ''));
$valid = false;
$userId = 0;
$userName = '';
$userEmail = '';
$errors = [];

if ($token === '' || strlen($token) < 32) {
    $errors[] = 'Invalid or missing reset token.';
} else {
    $tokenHash = hash('sha256', $token);
    try {
        $stmt = db()->prepare(
            "SELECT id, name, email, status, remember_token, updated_at
               FROM users
              WHERE remember_token = :t
              LIMIT 1"
        );
        $stmt->execute([':t' => $tokenHash]);
        $user = $stmt->fetch();
        if ($user && is_array($user)) {
            /* Validate token freshness (updated_at within last hour) */
            $updatedTs = strtotime((string) ($user['updated_at'] ?? ''));
            if ($updatedTs !== false && (time() - $updatedTs) <= 3600) {
                if (strtolower((string) $user['status']) === 'active') {
                    $valid = true;
                    $userId = (int) $user['id'];
                    $userName = (string) $user['name'];
                    $userEmail = (string) $user['email'];
                } else {
                    $errors[] = 'Your account is not active. Contact an administrator.';
                }
            } else {
                $errors[] = 'This reset link has expired. Please request a new one.';
            }
        } else {
            $errors[] = 'Invalid or expired reset token.';
        }
    } catch (Throwable $e) {
        $errors[] = 'Unable to verify reset token. Please try again.';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $valid) {
    $tokenPost = trim((string) ($_POST['token'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $confirm  = (string) ($_POST['password_confirm'] ?? '');

    if (!hash_equals($token, $tokenPost)) {
        $errors[] = 'Token mismatch. Please restart the reset flow.';
        $valid = false;
    } elseif (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters.';
    } elseif ($password !== $confirm) {
        $errors[] = 'Passwords do not match.';
    } elseif (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one letter and one number.';
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        try {
            $upd = db()->prepare(
                'UPDATE users
                    SET password_hash   = :h,
                        remember_token  = NULL,
                        updated_at      = NOW()
                  WHERE id = :id'
            );
            $upd->execute([':h' => $hash, ':id' => $userId]);

            log_audit('password_reset', 'users', $userId, null, [
                'email' => $userEmail,
            ]);

            flash('success', 'Your password has been reset. Please log in.');
            redirect('login.php');
        } catch (Throwable $e) {
            $errors[] = 'Failed to reset password: ' . $e->getMessage();
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password — <?php echo e(APP_NAME); ?> CRM</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="stylesheet" href="<?php echo e(asset('css/style.css')); ?>?v=<?php echo filemtime(APP_ROOT . '/assets/css/style.css'); ?>">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23E8501A'/><text x='50%25' y='55%25' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle' dominant-baseline='middle'>A</text></svg>">
</head>
<body class="auth-page">
<div class="auth-shell">
    <div class="auth-card">
        <div class="auth-brand">
            <div class="logo-mark">A</div>
            <strong><?php echo e(APP_NAME); ?> CRM</strong>
        </div>

        <h1>Reset Password</h1>

        <?php if ($errors): ?>
            <div class="alert alert-error">
                <ul style="margin:0;padding-left:20px">
                    <?php foreach ($errors as $er): ?>
                        <li><?php echo e($er); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <p style="margin-top:16px;">
                <a href="<?php echo e(url('forgot-password.php')); ?>" class="btn btn-primary">Request a new link</a>
            </p>
        <?php elseif ($valid): ?>
            <p style="color:var(--c-text-muted);margin-bottom:18px;">
                Welcome back, <strong><?php echo e($userName); ?></strong>. Set a new password below.
            </p>
            <form method="post" action="">
                <?php echo csrf_field(); ?>
                <input type="hidden" name="token" value="<?php echo e($token); ?>">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input type="password" name="password" id="password" required minlength="8" autofocus>
                    <small class="text-muted">Min 8 characters, must contain letters + numbers.</small>
                </div>
                <div class="form-group">
                    <label for="password_confirm">Confirm Password</label>
                    <input type="password" name="password_confirm" id="password_confirm" required minlength="8">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Reset Password</button>
            </form>
            <p style="margin-top:16px;text-align:center;">
                <a href="<?php echo e(url('login.php')); ?>">&larr; Back to Login</a>
            </p>
        <?php else: ?>
            <div class="alert alert-error">This reset link is invalid or has expired.</div>
            <p style="margin-top:16px;">
                <a href="<?php echo e(url('forgot-password.php')); ?>" class="btn btn-primary">Request a new link</a>
            </p>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
