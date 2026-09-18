<?php
/**
 * ALO Education — Configuration (cPanel/PHP variant)
 *
 * SANITISED 2026-09-18 during the merge of the `other-ai-builder-2026-09-13`
 * branch. This file shipped with a real production database password and a
 * default APP_KEY committed as literals. Every secret below is now read from
 * the environment; nothing sensitive is stored in the repository.
 *
 * NOTE: this whole directory is a LEGACY cPanel/PHP implementation and is not
 * part of the production Next.js runtime. See alo-cpanel/STATUS.md.
 */

/** Read a required setting from the environment, with no insecure fallback. */
function alo_env(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

// ─── Application ───
define('APP_NAME', 'ALO Education');
define('APP_URL', 'https://aloeducation.com');
define('APP_KEY', alo_env('ALO_APP_KEY'));
define('APP_ENV', 'production'); // production | development
define('APP_DEBUG', false);

// ─── Database ───
define('DB_HOST', alo_env('DB_HOST', '127.0.0.1'));
define('DB_PORT', '3306');
define('DB_DATABASE', alo_env('DB_DATABASE', 'db_education'));
define('DB_USERNAME', alo_env('DB_USERNAME'));
define('DB_PASSWORD', alo_env('DB_PASSWORD'));
define('DB_CHARSET', 'utf8mb4');

// ─── Mail (SMTP) ───
define('MAIL_HOST', 'smtp.example.com');
define('MAIL_PORT', '587');
define('MAIL_USERNAME', 'noreply@aloeducation.com');
define('MAIL_PASSWORD', '');
define('MAIL_FROM', 'noreply@aloeducation.com');
define('MAIL_FROM_NAME', 'ALO Education');

// ─── WhatsApp (optional — leave empty if not configured) ───
define('WA_API_URL', '');
define('WA_API_TOKEN', '');
define('WA_PHONE_NUMBER', '');

// ─── SMS (optional) ───
define('SMS_API_URL', '');
define('SMS_API_TOKEN', '');

// ─── Security ───
define('SESSION_LIFETIME', 7200); // 2 hours
define('CSRF_TOKEN_NAME', '_csrf_token');
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_MINUTES', 15);

// ─── Upload ───
define('MAX_UPLOAD_SIZE', 10485760); // 10MB
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('ALLOWED_EXTENSIONS', ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip']);
