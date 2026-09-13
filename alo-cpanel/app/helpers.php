<?php
/**
 * ALO Education CRM — Helper functions
 *
 * Every function here is wrapped in `if (!function_exists(...))` so that
 * the auth.php / csrf.php versions take precedence when both are loaded.
 */
declare(strict_types=1);

/* ============================================================
 * URL & Asset helpers
 * ============================================================ */

if (!function_exists('redirect')) {
    /**
     * Issue a 302 redirect and stop.
     *
     * @param string $path  Either absolute URL or root-relative path.
     */
    function redirect(string $path): void
    {
        if (preg_match('#^https?://#i', $path)) {
            header('Location: ' . $path);
        } else {
            // Root-relative — prepend APP_URL when available
            $base = defined('APP_URL') ? rtrim(APP_URL, '/') : '';
            header('Location: ' . $base . '/' . ltrim($path, '/'));
        }
        exit;
    }
}

if (!function_exists('url')) {
    /**
     * Build a fully-qualified application URL from a path.
     *
     * @param string $path
     * @return string
     */
    function url(string $path = ''): string
    {
        $base = defined('APP_URL') ? rtrim(APP_URL, '/') : '';
        if ($path === '') {
            return $base . '/';
        }
        return $base . '/' . ltrim($path, '/');
    }
}

if (!function_exists('asset')) {
    /**
     * Build a fully-qualified URL to a static asset under /assets.
     *
     * @param string $path
     * @return string
     */
    function asset(string $path): string
    {
        $base = defined('APP_URL') ? rtrim(APP_URL, '/') : '';
        $path = ltrim($path, '/');
        if (str_starts_with($path, 'assets/')) {
            return $base . '/' . $path;
        }
        return $base . '/assets/' . $path;
    }
}

/* ============================================================
 * Output helpers
 * ============================================================ */

if (!function_exists('e')) {
    /**
     * Escape a string for safe HTML output.
     *
     * @param string $value
     * @return string
     */
    function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }
}

if (!function_exists('csrf_field')) {
    /**
     * Render a hidden <input> for CSRF protection inside forms.
     *
     * @return string
     */
    function csrf_field(): string
    {
        $token = csrf_token();
        $name  = defined('CSRF_TOKEN_NAME') ? CSRF_TOKEN_NAME : '_csrf_token';
        return '<input type="hidden" name="' . htmlspecialchars($name, ENT_QUOTES)
             . '" value="' . htmlspecialchars($token, ENT_QUOTES) . '">';
    }
}

if (!function_exists('method_field')) {
    /**
     * Render a hidden <input> to spoof an HTTP method in forms.
     *
     * @param string $method  PUT|PATCH|DELETE
     * @return string
     */
    function method_field(string $method): string
    {
        $method = strtoupper($method);
        return '<input type="hidden" name="_method" value="' . htmlspecialchars($method, ENT_QUOTES) . '">';
    }
}

if (!function_exists('old')) {
    /**
     * Retrieve an "old" input value (from session flash) for form repopulation.
     *
     * @param string $key
     * @param mixed  $default
     * @return string
     */
    function old(string $key, $default = ''): string
    {
        if (!isset($_SESSION['_old_input'][$key])) {
            return is_string($default) ? $default : (string) $default;
        }
        $val = $_SESSION['_old_input'][$key];
        return is_array($val) ? '' : (string) $val;
    }
}

if (!function_exists('flash')) {
    /**
     * Store a flash value in the session (typically used for errors / success).
     *
     * @param string $key
     * @param mixed  $value
     */
    function flash(string $key, $value): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        $_SESSION['__flash'][$key] = $value;
    }
}

if (!function_exists('get_flash')) {
    /**
     * Read & clear a flash value from the session.
     *
     * @param string $key
     * @return mixed  null if not set
     */
    function get_flash(string $key)
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        $val = $_SESSION['__flash'][$key] ?? null;
        unset($_SESSION['__flash'][$key]);
        return $val;
    }
}

/* ============================================================
 * Formatting helpers
 * ============================================================ */

if (!function_exists('format_date')) {
    /**
     * Format a date string into a human-readable format.
     *
     * @param string|int|null|\DateTimeInterface $date
     * @param string                              $format  PHP date() format
     * @return string
     */
    function format_date($date, string $format = 'M d, Y'): string
    {
        if ($date === null || $date === '' || $date === 0) {
            return '';
        }
        try {
            if ($date instanceof \DateTimeInterface) {
                return $date->format($format);
            }
            if (is_int($date)) {
                return date($format, $date);
            }
            $ts = strtotime((string) $date);
            return $ts === false ? '' : date($format, $ts);
        } catch (\Throwable $e) {
            return '';
        }
    }
}

if (!function_exists('format_currency')) {
    /**
     * Format a numeric amount with currency symbol & separators.
     *
     * @param float|int|string $amount
     * @param string           $currency  ISO 4217 code (BDT, USD, GBP, EUR, etc.)
     * @return string
     */
    function format_currency($amount, string $currency = 'BDT'): string
    {
        $value = is_numeric($amount) ? (float) $amount : 0.0;
        $symbols = [
            'BDT' => '৳',
            'USD' => '$',
            'GBP' => '£',
            'EUR' => '€',
            'CAD' => 'C$',
            'AUD' => 'A$',
        ];
        $symbol = $symbols[strtoupper($currency)] ?? ($currency . ' ');
        return $symbol . number_format($value, 2, '.', ',');
    }
}

/* ============================================================
 * ID generator
 * ============================================================ */

if (!function_exists('generate_crm_id')) {
    /**
     * Generate the next sequential CRM ID in the form:
     *   <PREFIX>-<YEAR>-<000001>
     * e.g. ALO-CRM-2026-000001
     *
     * Scans every table that holds a crm_id column so the same prefix
     * never collides across leads / students / applications / communications.
     *
     * @param string $prefix
     * @return string
     */
    function generate_crm_id(string $prefix = 'ALO-CRM'): string
    {
        $year    = date('Y');
        $pattern = $prefix . '-' . $year . '-';
        $maxSeq  = 0;

        try {
            $pdo    = db();
            $tables = ['leads', 'students', 'applications', 'communications'];

            foreach ($tables as $table) {
                $stmt = $pdo->prepare(
                    'SELECT crm_id FROM ' . $table . '
                      WHERE crm_id LIKE :p
                      ORDER BY crm_id DESC
                      LIMIT 1'
                );
                $like = $pattern . '%';
                $stmt->bindParam(':p', $like);
                $stmt->execute();
                $row = $stmt->fetch();
                if (is_array($row) && !empty($row['crm_id'])) {
                    $crm = (string) $row['crm_id'];
                    if (preg_match('/(\d+)\s*$/', $crm, $m)) {
                        $n = (int) $m[1];
                        if ($n > $maxSeq) {
                            $maxSeq = $n;
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Ignore — fall through to random fallback
        }

        if ($maxSeq < 1) {
            // First CRM ID of the year
            $maxSeq = 0;
        }

        return $pattern . str_pad((string) ($maxSeq + 1), 6, '0', STR_PAD_LEFT);
    }
}

/* ============================================================
 * Sanitisation helper
 * ============================================================ */

if (!function_exists('sanitize')) {
    /**
     * Light sanitiser for generic text input.
     *
     * @param string $value
     * @return string
     */
    function sanitize(string $value): string
    {
        $value = trim($value);
        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? $value;
        return $value;
    }
}

/* ============================================================
 * Request helpers
 * ============================================================ */

if (!function_exists('is_ajax')) {
    /**
     * Was this request issued via XMLHttpRequest / fetch()?
     */
    function is_ajax(): bool
    {
        $h = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
        return strcasecmp((string) $h, 'xmlhttprequest') === 0;
    }
}

if (!function_exists('json_response')) {
    /**
     * Send a JSON response and stop.
     *
     * @param mixed $data
     * @param int   $status
     */
    function json_response($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

/* ============================================================
 * Auth wrappers (real implementations live in app/auth.php)
 * ============================================================ */

if (!function_exists('current_user')) {
    /** @return array<string,mixed>|null */
    function current_user(): ?array
    {
        return null;
    }
}

if (!function_exists('has_permission')) {
    function has_permission(string $permission): bool
    {
        return false;
    }
}

if (!function_exists('require_role')) {
    function require_role(string ...$roles): void
    {
        // Stub — real implementation in app/auth.php takes precedence
    }
}

/* ============================================================
 * Audit & notifications
 * ============================================================ */

if (!function_exists('log_audit')) {
    /**
     * Insert a row in audit_logs describing the change.
     *
     * @param string                    $action       e.g. 'create', 'update', 'delete'
     * @param string                    $entityType   e.g. 'students'
     * @param int|string|null          $entityId
     * @param array<string,mixed>|null $before
     * @param array<string,mixed>|null $after
     */
    function log_audit(
        string $action,
        string $entityType,
        $entityId = null,
        ?array $before = null,
        ?array $after = null
    ): void {
        $userId = is_logged_in() ? (int) ($_SESSION['user_id'] ?? 0) : null;
        if (!$userId) {
            $userId = null;
        }
        $ip  = $_SERVER['REMOTE_ADDR'] ?? null;
        $ua  = $_SERVER['HTTP_USER_AGENT'] ?? null;

        try {
            $stmt = db()->prepare(
                'INSERT INTO audit_logs
                    (user_id, action, entity_type, entity_id,
                     before_values, after_values, ip_address, user_agent, created_at)
                 VALUES
                    (:uid, :action, :entity, :eid,
                     :before, :after, :ip, :ua, NOW())'
            );

            $entityIdVal = ($entityId === null || $entityId === '') ? null : (int) $entityId;
            $beforeJson  = $before !== null ? json_encode($before, JSON_UNESCAPED_UNICODE) : null;
            $afterJson   = $after  !== null ? json_encode($after,  JSON_UNESCAPED_UNICODE) : null;

            $stmt->bindParam(':uid',    $userId,   PDO::PARAM_INT);
            $stmt->bindParam(':action',  $action);
            $stmt->bindParam(':entity',  $entityType);
            $stmt->bindParam(':eid',    $entityIdVal, PDO::PARAM_INT);
            $stmt->bindParam(':before',  $beforeJson);
            $stmt->bindParam(':after',   $afterJson);
            $stmt->bindParam(':ip',      $ip);
            $stmt->bindParam(':ua',       $ua);
            $stmt->execute();
        } catch (\Throwable $e) {
            // Never break the request flow because of audit failure
            if (defined('APP_DEBUG') && APP_DEBUG) {
                error_log('log_audit failed: ' . $e->getMessage());
            }
        }
    }
}

if (!function_exists('send_notification')) {
    /**
     * Insert a row in notifications.
     *
     * @param int    $userId
     * @param string $title
     * @param string $message
     * @param string $type    info|success|warning|danger
     * @param string $link    optional relative URL
     */
    function send_notification(
        int $userId,
        string $title,
        string $message,
        string $type = 'info',
        string $link = ''
    ): void {
        try {
            $stmt = db()->prepare(
                'INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
                 VALUES (:uid, :title, :msg, :type, 0, :link, NOW())'
            );
            $stmt->bindParam(':uid',   $userId, PDO::PARAM_INT);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':msg',   $message);
            $stmt->bindParam(':type',  $type);
            $stmt->bindParam(':link',  $link);
            $stmt->execute();
        } catch (\Throwable $e) {
            if (defined('APP_DEBUG') && APP_DEBUG) {
                error_log('send_notification failed: ' . $e->getMessage());
            }
        }
    }
}
