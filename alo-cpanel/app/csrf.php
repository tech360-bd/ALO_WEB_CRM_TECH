<?php
/**
 * ALO Education CRM — CSRF helpers
 *
 * csrf_token()   — return (and lazily create) the per-session CSRF token
 * csrf_verify()   — verify a supplied token against the session token
 * csrf_check()   — automatically verify POST/PUT/DELETE requests
 */
declare(strict_types=1);

if (!function_exists('csrf_token')) {
    /**
     * Get the CSRF token for the current session, creating one on demand.
     *
     * @return string  64-char hex token
     */
    function csrf_token(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }

        $key = defined('CSRF_TOKEN_NAME') ? CSRF_TOKEN_NAME : '_csrf_token';

        if (empty($_SESSION[$key]) || !is_string($_SESSION[$key])) {
            $_SESSION[$key] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION[$key];
    }
}

if (!function_exists('csrf_verify')) {
    /**
     * Verify a CSRF token against the value stored in the session.
     *
     * @param string $token
     * @return bool
     */
    function csrf_verify(string $token): bool
    {
        $key = defined('CSRF_TOKEN_NAME') ? CSRF_TOKEN_NAME : '_csrf_token';

        if (empty($_SESSION[$key]) || !is_string($_SESSION[$key])) {
            return false;
        }

        return hash_equals($_SESSION[$key], $token);
    }
}

if (!function_exists('csrf_check')) {
    /**
     * Run on every request to gate unsafe methods.
     * Validates the CSRF token from $_POST['_csrf_token'] or the
     * X-CSRF-Token header. Aborts with 419 if invalid.
     *
     * @return void
     */
    function csrf_check(): void
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        $token = $_POST['_csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

        if (!is_string($token) || !csrf_verify($token)) {
            http_response_code(419);
            header('Content-Type: text/html; charset=utf-8');
            echo '<!doctype html><html><head><meta charset="utf-8">'
               . '<title>419 — CSRF Token Mismatch</title></head><body>'
               . '<h1>419 — Page Expired</h1>'
               . '<p>Your session has expired. Please go back and try again.</p>'
               . '<p><a href="javascript:history.back()">Go back</a></p>'
               . '</body></html>';
            exit;
        }
    }
}
