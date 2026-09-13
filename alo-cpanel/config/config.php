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

// ─── WhatsApp Cloud API (Meta Graph v20.0) — official 01805020100-019 pool ───
define('WHATSAPP_VERIFY_TOKEN', getenv('WHATSAPP_VERIFY_TOKEN') ?: 'CHANGE_ME');
define('WHATSAPP_ACCESS_TOKEN', getenv('WHATSAPP_ACCESS_TOKEN') ?: '');
define('WHATSAPP_PHONE_NUMBER_ID', getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '');
define('WHATSAPP_BUSINESS_ACCOUNT_ID', getenv('WHATSAPP_BUSINESS_ACCOUNT_ID') ?: '');
define('WHATSAPP_GRAPH_VERSION', getenv('WHATSAPP_GRAPH_VERSION') ?: 'v20.0');
define('WHATSAPP_APP_SECRET', getenv('WHATSAPP_APP_SECRET') ?: '');
define('WA_API_URL', 'https://graph.facebook.com/' . WHATSAPP_GRAPH_VERSION);
define('WA_API_TOKEN', WHATSAPP_ACCESS_TOKEN);
define('WA_PHONE_NUMBER', WHATSAPP_PHONE_NUMBER_ID);
// Legacy fallback
if (!defined('WHATSAPP_DEFAULT_PHONE_NUMBER_ID')) define('WHATSAPP_DEFAULT_PHONE_NUMBER_ID', WHATSAPP_PHONE_NUMBER_ID);
if (!defined('WHATSAPP_DEFAULT_BUSINESS_ACCOUNT_ID')) define('WHATSAPP_DEFAULT_BUSINESS_ACCOUNT_ID', WHATSAPP_BUSINESS_ACCOUNT_ID);

// ─── ALO Official Numbers (BD) ───
define('ALO_MAIN_WHATSAPP_NUMBER', getenv('ALO_MAIN_WHATSAPP_NUMBER') ?: '01805020100');
define('ALO_COMPLAINT_WHATSAPP_NUMBER', getenv('ALO_COMPLAINT_WHATSAPP_NUMBER') ?: '01805020100');
define('ALO_FOLLOWUP_WHATSAPP_NUMBER', getenv('ALO_FOLLOWUP_WHATSAPP_NUMBER') ?: '01805020100');
define('ALO_COO_WHATSAPP_NUMBER', getenv('ALO_COO_WHATSAPP_NUMBER') ?: '01805020101');
define('ALO_24_7_SUPPORT_NUMBER', getenv('ALO_24_7_SUPPORT_NUMBER') ?: '01805020101');
define('ALO_EMPLOYEE_WHATSAPP_START', getenv('ALO_EMPLOYEE_WHATSAPP_START') ?: '01805020102');
define('ALO_EMPLOYEE_WHATSAPP_END', getenv('ALO_EMPLOYEE_WHATSAPP_END') ?: '01805020119');

// ─── OpenRouter AI ───
define('OPENROUTER_API_KEY', getenv('OPENROUTER_API_KEY') ?: '');
define('OPENROUTER_MODEL', getenv('OPENROUTER_MODEL') ?: 'meta-llama/llama-3.1-8b-instruct:free');
define('OPENROUTER_SITE_URL', getenv('OPENROUTER_SITE_URL') ?: 'https://crm.aloeducation.com');
define('OPENROUTER_APP_NAME', getenv('OPENROUTER_APP_NAME') ?: 'ALO Education WhatsApp AI');

// ─── Office hours (Asia/Dhaka) ───
define('OFFICE_TIMEZONE', 'Asia/Dhaka');
define('OFFICE_START_TIME', '09:00');
define('OFFICE_END_TIME', '18:00');
define('OFFICE_CLOSED_DAY', 'Friday');
define('SLA_EMPLOYEE_MINUTES', 30);
define('SLA_BRANCH_MANAGER_MINUTES', 20);
define('SLA_CEO_MINUTES', 10);

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
