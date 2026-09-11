<?php
/**
 * ALO Education — Configuration
 * Edit these values during installation.
 */

// ─── Application ───
define('APP_NAME', 'ALO Education');
define('APP_URL', 'https://aloeducation.com');
define('APP_KEY', 'change-this-to-a-random-32-char-string');
define('APP_ENV', 'production'); // production | development
define('APP_DEBUG', false);

// ─── Database ───
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_DATABASE', 'db_education');
define('DB_USERNAME', 'user_edu');
define('DB_PASSWORD', 'Alo_Edu_2026!');
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
