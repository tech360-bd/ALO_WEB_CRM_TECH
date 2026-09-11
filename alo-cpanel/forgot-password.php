<?php
/**
 * Forgot Password page
 *
 * Accepts an email address, generates a reset token, stores the SHA-256 hash
 * in users.remember_token, and emails a reset link (if SMTP is configured).
 * Always shows a "check your email" message to avoid email enumeration.
 */
declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';

/* If already logged in, redirect to dashboard */
if (is_logged_in()) {
    redirect('index.php');
}

$errors = [];
$emailSent = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = strtolower(trim((string) ($_POST['email'] ?? '')));

    if (!validate_email($email)) {
        $errors[] = 'Please enter a valid email address.';
    } else {
        try {
            $stmt = db()->prepare(
                "SELECT id, name, email, status
                   FROM users
                  WHERE email = :email
                  LIMIT 1"
            );
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();
        } catch (Throwable $e) {
            $user = null;
        }

        if ($user && is_array($user) && strtolower((string) $user['status']) === 'active') {
            /* Generate a 32-byte random token */
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);

            try {
                $upd = db()->prepare('UPDATE users SET remember_token = :t WHERE id = :id');
                $upd->execute([':t' => $tokenHash, ':id' => $user['id']]);

                /* Build the reset link */
                $resetLink = rtrim(APP_URL, '/') . '/reset-password.php?token=' . $token;

                /* Send email if SMTP is configured */
                $sent = false;
                if (defined('MAIL_HOST') && MAIL_HOST !== 'smtp.example.com') {
                    $subject = APP_NAME . ' — Password Reset';
                    $body    = "Hello " . $user['name'] . ",\n\n"
                             . "We received a request to reset your password.\n\n"
                             . "Click the link below to set a new password (valid for 1 hour):\n"
                             . $resetLink . "\n\n"
                             . "If you did not request this, you can safely ignore this email.\n\n"
                             . "--\n" . APP_NAME . " CRM";
                    $headers = [
                        'From: ' . (defined('MAIL_FROM') ? MAIL_FROM : 'noreply@example.com'),
                        'Content-Type: text/plain; charset=UTF-8',
                        'MIME-Version: 1.0',
                    ];
                    $sent = @mail($user['email'], $subject, $body, implode("\r\n", $headers));
                }

                /* Always log the audit trail regardless of email outcome */
                log_audit('password_reset_request', 'users', (int) $user['id'], null, [
                    'email' => $email, 'email_sent' => $sent,
                ]);
            } catch (Throwable $e) {
                /* Silent — show generic message to user */
            }
        }
        $emailSent = true;
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Forgot Password — <?php echo e(APP_NAME); ?> CRM</title>
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

        <h1>Forgot Password</h1>

        <?php if ($emailSent): ?>
            <div class="alert alert-success">
                <strong>Check your email.</strong>
                If an account exists for the email you entered, you will receive
                a password reset link shortly. The link is valid for 1 hour.
            </div>
            <p style="margin-top:16px;">
                <a href="<?php echo e(url('login.php')); ?>" class="btn btn-primary">&larr; Back to Login</a>
            </p>
        <?php else: ?>
            <?php if ($errors): ?>
                <div class="alert alert-error">
                    <ul style="margin:0;padding-left:20px">
                        <?php foreach ($errors as $er): ?>
                            <li><?php echo e($er); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <p style="color:var(--c-text-muted);margin-bottom:18px;">
                Enter your account email and we'll send you a link to reset your password.
            </p>

            <form method="post" action="">
                <?php echo csrf_field(); ?>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" name="email" id="email" required autofocus
                           value="<?php echo e($_POST['email'] ?? ''); ?>">
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Send Reset Link</button>
            </form>

            <p style="margin-top:16px;text-align:center;">
                <a href="<?php echo e(url('login.php')); ?>">&larr; Back to Login</a>
            </p>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
