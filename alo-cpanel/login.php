<?php
/**
 * ALO Education CRM — Login page
 *
 * Standalone page (does NOT use render_header/render_footer).
 * Requires only the application bootstrap (DB + auth + CSRF).
 *
 * Features:
 *   - Email + password + remember-me form
 *   - CSRF protection (token is rendered in the form & verified
 *     automatically by bootstrap.php -> csrf_check())
 *   - Brute-force protection (handled inside attempt_login()
 *     via check_brute_force() — 5 attempts per 15 min by default)
 *   - Friendly error messages
 *   - Redirects to ?redirect= URL or index.php after success
 */
declare(strict_types=1);

/* Skip the automatic CSRF check on GET (we render the form) and
   handle POST validation explicitly so we can show a friendly
   error instead of a 419 page. */
$GLOBALS['__skip_csrf'] = true;

require_once __DIR__ . '/app/bootstrap.php';

/* Now run CSRF check manually so we can show a friendly message. */
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    $token = $_POST[CSRF_TOKEN_NAME] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($token) || !csrf_verify($token)) {
        $loginError = 'Your session has expired. Please refresh the page and try again.';
    }
}

/* ------------------------------------------------------------
   If already logged in, redirect away
   ------------------------------------------------------------ */
if (is_logged_in()) {
    $target = $_GET['redirect'] ?? '';
    if (is_string($target) && $target !== '' && !str_contains($target, 'login.php') && str_starts_with($target, '/')) {
        redirect($target);
    }
    redirect('index.php');
}

/* ------------------------------------------------------------
   Handle POST login attempt
   ------------------------------------------------------------ */
$loginError = $loginError ?? null;
$emailValue = '';
$max       = defined('MAX_LOGIN_ATTEMPTS') ? MAX_LOGIN_ATTEMPTS : 5;
$lockMins  = defined('LOGIN_LOCKOUT_MINUTES') ? LOGIN_LOCKOUT_MINUTES : 15;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && $loginError === null) {
    $email    = trim($_POST['email'] ?? '');
    $password = (string) ($_POST['password'] ?? '');
    $remember = !empty($_POST['remember']);
    $emailValue = $email;

    if ($email === '' || $password === '') {
        $loginError = 'Please enter both your email address and password.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $loginError = 'Please enter a valid email address.';
    } else {
        if (!check_brute_force($email)) {
            $loginError = 'Too many failed attempts. For your security this account is locked for '
                       . $lockMins . ' minutes. Please try again later.';
        } else {
            $ok = attempt_login($email, $password, $remember);
            if ($ok) {
                // Audit the login
                try {
                    log_audit('login', 'users', (int) ($_SESSION['user_id'] ?? 0));
                } catch (Throwable $e) { /* ignore */ }

                $target = $_GET['redirect'] ?? '';
                if (is_string($target) && $target !== ''
                    && !str_contains($target, 'login.php')
                    && !str_contains($target, 'logout.php')
                    && str_starts_with($target, '/')) {
                    redirect($target);
                }
                redirect('index.php');
            }
            // Determine if locked out due to this attempt
            if (!check_brute_force($email)) {
                $loginError = 'Too many failed attempts. For your security this account is locked for '
                           . $lockMins . ' minutes. Please try again later.';
            } else {
                $remaining = $max - count($_SESSION['__login_attempts_' . md5(strtolower($email))] ?? []);
                $loginError = 'Incorrect email or password. ';
                if ($remaining > 0 && $remaining <= 2) {
                    $loginError .= $remaining . ' attempt' . ($remaining === 1 ? '' : 's') . ' remaining before lockout.';
                } else {
                    $loginError .= 'Please try again.';
                }
            }
        }
    }
}

/* ------------------------------------------------------------
   HTML output
   ------------------------------------------------------------ */
$cssPath = __DIR__ . '/assets/css/style.css';
$jsPath  = __DIR__ . '/assets/js/app.js';
$cssV = is_file($cssPath) ? filemtime($cssPath) : '1';
$jsV  = is_file($jsPath)  ? filemtime($jsPath)  : '1';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Sign In &mdash; <?php echo e(APP_NAME); ?> CRM</title>
    <link rel="stylesheet" href="<?php echo e(asset('css/style.css')); ?>?v=<?php echo $cssV; ?>">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23E8501A'/><text x='50%25' y='55%25' font-family='Arial' font-size='18' font-weight='700' fill='%23fff' text-anchor='middle' dominant-baseline='middle'>A</text></svg>">
    <script>
        window.ALO_CSRF_TOKEN = '<?php echo e(csrf_token()); ?>';
        window.ALO_CSRF_NAME  = '<?php echo e(CSRF_TOKEN_NAME); ?>';
        window.ALO_BASE_URL   = '<?php echo e(rtrim(APP_URL, '/')); ?>';
        window.ALO_DEBUG      = <?php echo APP_DEBUG ? 'true' : 'false'; ?>;
    </script>
</head>
<body class="login-page">
    <section class="login-hero">
        <div class="hero-brand">
            <div class="logo-mark">A</div>
            <div>
                <strong style="font-size:1.2rem;display:block;"><?php echo e(APP_NAME); ?></strong>
                <span style="font-size:.82rem;opacity:.85;">CRM Command Center</span>
            </div>
        </div>
        <div class="hero-content">
            <h1>Manage your students &amp; leads<br>from a single command center.</h1>
            <p>Track leads, applications, offers, CAS, visa &amp; enrolment journeys for every student — all in one secure platform built for modern education agencies.</p>
            <div class="hero-stats">
                <div>
                    <strong>16</strong>
                    <span>Live KPIs</span>
                </div>
                <div>
                    <strong>360&deg;</strong>
                    <span>Student view</span>
                </div>
                <div>
                    <strong>7</strong>
                    <span>Role types</span>
                </div>
            </div>
        </div>
        <div class="hero-footer">
            &copy; <?php echo date('Y'); ?> <?php echo e(APP_NAME); ?>. All rights reserved.
        </div>
    </section>

    <section class="login-form-wrap">
        <div class="login-card">
            <h2>Welcome back</h2>
            <p class="sub">Sign in to your account to continue.</p>

            <?php if ($loginError !== null): ?>
                <div class="login-error" role="alert">
                    <span><?php echo e($loginError); ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" action="<?php echo e(url('login.php')); ?>" autocomplete="on" id="loginForm">
                <?php echo csrf_field(); ?>
                <?php if (!empty($_GET['redirect'])): ?>
                    <input type="hidden" name="redirect" value="<?php echo e((string) $_GET['redirect']); ?>">
                <?php endif; ?>
                <div class="form-group">
                    <label class="form-label" for="email">Email address <span class="required">*</span></label>
                    <input type="email" id="email" name="email"
                           value="<?php echo e($emailValue); ?>"
                           placeholder="you@example.com"
                           autocomplete="username"
                           required
                           autofocus
                           class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label" for="password">Password <span class="required">*</span></label>
                    <div class="input-with-icon">
                        <span class="icon">&#128274;</span>
                        <input type="password" id="password" name="password"
                               placeholder="Your password"
                               autocomplete="current-password"
                               required
                               class="form-control">
                    </div>
                </div>
                <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;">
                    <label class="form-check" style="margin:0;">
                        <input type="checkbox" name="remember" id="remember" value="1">
                        <span style="font-size:.84rem;">Keep me signed in</span>
                    </label>
                    <a href="<?php echo e(url('forgot-password.php')); ?>" class="forgot-link">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">
                    Sign in &nbsp;&rarr;
                </button>
            </form>

            <div class="brand-divider">or</div>

            <p style="text-align:center;font-size:.8rem;color:var(--c-text-muted);">
                Don't have an account?
                <a href="<?php echo e(url('register.php')); ?>">Contact your administrator</a>
            </p>

            <div class="login-footer">
                Protected by reCAPTCHA &middot; <?php echo e(APP_NAME); ?> CRM v1.0
            </div>
        </div>
    </section>

    <script src="<?php echo e(asset('js/app.js')); ?>?v=<?php echo $jsV; ?>"></script>
    <script>
    (function () {
        // Toggle password visibility
        var pwd = document.getElementById('password');
        var eye = document.createElement('button');
        eye.type = 'button';
        eye.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;cursor:pointer;color:var(--c-text-muted);font-size:.9rem;';
        eye.textContent = '\u{1F441}';
        eye.title = 'Show / hide password';
        eye.addEventListener('click', function () {
            pwd.type = (pwd.type === 'password') ? 'text' : 'password';
        });
        if (pwd && pwd.parentNode) {
            pwd.parentNode.appendChild(eye);
            pwd.style.paddingRight = '38px';
        }
        // Loading state on submit
        var form = document.getElementById('loginForm');
        var btn  = document.getElementById('loginBtn');
        if (form && btn) {
            form.addEventListener('submit', function () {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Signing in…';
            });
        }
    })();
    </script>
</body>
</html>
