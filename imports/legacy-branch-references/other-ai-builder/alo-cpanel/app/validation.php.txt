<?php
/**
 * ALO Education CRM — Validation helpers
 */
declare(strict_types=1);

if (!function_exists('validate_required')) {
    function validate_required($value): bool
    {
        if (is_array($value)) {
            return count($value) > 0;
        }
        if (is_string($value)) {
            return trim($value) !== '';
        }
        return $value !== null && $value !== false;
    }
}

if (!function_exists('validate_email')) {
    function validate_email(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}

if (!function_exists('validate_phone')) {
    /**
     * Accepts +, digits, spaces, dashes and parentheses; length 6–25.
     */
    function validate_phone(string $phone): bool
    {
        $phone = trim($phone);
        if ($phone === '') {
            return false;
        }
        if (!preg_match('/^\+?[0-9\(\)\-\s]{5,24}$/', $phone)) {
            return false;
        }
        $digits = preg_replace('/[^0-9]/', '', $phone);
        return strlen($digits) >= 6 && strlen($digits) <= 15;
    }
}

if (!function_exists('validate_min')) {
    function validate_min($value, int $min): bool
    {
        if (is_array($value)) {
            return count($value) >= $min;
        }
        if (is_int($value) || is_float($value)) {
            return $value >= $min;
        }
        return mb_strlen((string) $value) >= $min;
    }
}

if (!function_exists('validate_max')) {
    function validate_max($value, int $max): bool
    {
        if (is_array($value)) {
            return count($value) <= $max;
        }
        if (is_int($value) || is_float($value)) {
            return $value <= $max;
        }
        return mb_strlen((string) $value) <= $max;
    }
}

if (!function_exists('validate_in')) {
    /**
     * @param mixed  $value
     * @param array<int,string|int> $allowed
     */
    function validate_in($value, array $allowed): bool
    {
        return in_array($value, $allowed, true);
    }
}

if (!function_exists('validate_upload')) {
    /**
     * Inspect a $_FILES entry (single file).
     *
     * Returns:
     *   ['success' => bool, 'error' => string, 'info' => array]
     *
     * 'info' contains: name, type, tmp_name, error, size, ext
     *
     * @param array $file
     * @return array{success:bool,error:string,info:array}
     */
    function validate_upload(array $file): array
    {
        $max = defined('MAX_UPLOAD_SIZE') ? MAX_UPLOAD_SIZE : 10485760;
        $allowed = defined('ALLOWED_EXTENSIONS') ? ALLOWED_EXTENSIONS : [
            'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx',
            'xls', 'xlsx', 'csv', 'txt', 'zip',
        ];

        $result = [
            'success' => false,
            'error'   => '',
            'info'    => [
                'name'     => $file['name']     ?? '',
                'type'     => $file['type']     ?? '',
                'tmp_name' => $file['tmp_name'] ?? '',
                'error'    => (int)($file['error'] ?? UPLOAD_ERR_NO_FILE),
                'size'     => (int)($file['size'] ?? 0),
                'ext'      => '',
            ],
        ];

        if ($result['info']['error'] === UPLOAD_ERR_NO_FILE) {
            $result['error'] = 'No file was uploaded.';
            return $result;
        }

        if ($result['info']['error'] !== UPLOAD_ERR_OK) {
            $result['error'] = 'Upload error code ' . $result['info']['error'];
            return $result;
        }

        if ($result['info']['size'] <= 0) {
            $result['error'] = 'Uploaded file is empty.';
            return $result;
        }

        if ($result['info']['size'] > $max) {
            $result['error'] = 'File is too large. Maximum size is '
                . round($max / 1048576, 1) . ' MB.';
            return $result;
        }

        $ext = strtolower(pathinfo($result['info']['name'], PATHINFO_EXTENSION));
        $result['info']['ext'] = $ext;

        $allowedLower = array_map('strtolower', $allowed);
        if (!in_array($ext, $allowedLower, true)) {
            $result['error'] = 'File type ".' . $ext . '" is not allowed.';
            return $result;
        }

        if (!is_uploaded_file($result['info']['tmp_name'])) {
            $result['error'] = 'Invalid upload (security check failed).';
            return $result;
        }

        $result['success'] = true;
        return $result;
    }
}

if (!function_exists('sanitize_string')) {
    function sanitize_string($value): string
    {
        if (is_array($value)) {
            $value = implode(' ', $value);
        }
        $value = (string) $value;
        $value = trim($value);
        // Strip tags but keep basic line breaks
        $value = strip_tags($value);
        // Normalise control chars except \n,\r,\t
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? $value;
        return $value;
    }
}

if (!function_exists('sanitize_int')) {
    function sanitize_int($value): int
    {
        if (is_int($value)) {
            return $value;
        }
        if (is_float($value)) {
            return (int) $value;
        }
        if (is_array($value) || $value === null) {
            return 0;
        }
        $value = (string) $value;
        if (preg_match('/-?\d+/', $value, $m)) {
            return (int) $m[0];
        }
        return 0;
    }
}

if (!function_exists('sanitize_float')) {
    function sanitize_float($value): float
    {
        if (is_float($value) || is_int($value)) {
            return (float) $value;
        }
        if (is_array($value) || $value === null) {
            return 0.0;
        }
        $value = (string) $value;
        if (preg_match('/-?\d+(\.\d+)?/', $value, $m)) {
            return (float) $m[0];
        }
        return 0.0;
    }
}
