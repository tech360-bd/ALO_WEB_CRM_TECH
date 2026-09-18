<?php
/**
 * Users — Create endpoint (POST)
 *
 * Hashes password, inserts user, logs audit, redirects back.
 */
declare(strict_types=1);

require_once __DIR__ . '/../app/bootstrap.php';
require_login();
require_permission('users.create');

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    flash('error', 'Invalid request.');
    redirect('users/index.php');
}

$name     = trim((string) ($_POST['name'] ?? ''));
$email    = strtolower(trim((string) ($_POST['email'] ?? '')));
$role     = trim((string) ($_POST['role'] ?? 'counselor'));
$phone    = trim((string) ($_POST['phone'] ?? ''));
$password = (string) ($_POST['password'] ?? '');
$status   = trim((string) ($_POST['status'] ?? 'active'));

$allowedRoles   = ['super_admin','admin','manager','counselor','marketing','finance','documentation','agent','student'];
$allowedStatuses = ['active','inactive','suspended'];

$errors = [];
if (!validate_required($name)) $errors[] = 'Name is required.';
elseif (!validate_max($name, 150)) $errors[] = 'Name must be 150 characters or fewer.';
if (!validate_email($email)) $errors[] = 'A valid email is required.';
if (!in_array($role, $allowedRoles, true)) $errors[] = 'Invalid role.';
if (!in_array($status, $allowedStatuses, true)) $errors[] = 'Invalid status.';
if (strlen($password) < 8) $errors[] = 'Password must be at least 8 characters.';
if ($phone !== '' && !validate_phone($phone)) $errors[] = 'Phone is invalid.';

/* Email uniqueness */
if (!$errors) {
    $chk = $pdo->prepare('SELECT id FROM users WHERE email = :email');
    $chk->execute([':email' => $email]);
    if ($chk->fetch()) {
        $errors[] = 'A user with this email already exists.';
    }
}

if ($errors) {
    flash('error', implode(' ', $errors));
    redirect('users/index.php');
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$phoneVal = $phone !== '' ? $phone : null;

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO users
            (name, email, password_hash, role, phone, status, last_login_at, remember_token,
             created_at, updated_at)
         VALUES
            (:name, :email, :password_hash, :role, :phone, :status, NULL, NULL,
             NOW(), NOW())'
    );
    $stmt->bindParam(':name',          $name);
    $stmt->bindParam(':email',          $email);
    $stmt->bindParam(':password_hash',  $hash);
    $stmt->bindParam(':role',           $role);
    $stmt->bindParam(':phone',           $phoneVal);
    $stmt->bindParam(':status',          $status);
    $stmt->execute();
    $newId = (int) $pdo->lastInsertId();

    /* Activity log */
    $act = $pdo->prepare(
        'INSERT INTO activities
            (user_id, crm_id, type, description, created_at)
         VALUES (:uid, NULL, :type, :desc, NOW())'
    );
    $userId = (int) ($_SESSION['user_id'] ?? 0);
    $type = 'user_created';
    $desc = 'User created: ' . $name . ' (' . $email . ') — ' . $role;
    $act->bindParam(':uid',  $userId, PDO::PARAM_INT);
    $act->bindParam(':type', $type);
    $act->bindParam(':desc', $desc);
    $act->execute();

    $pdo->commit();

    log_audit('create', 'users', $newId, null, [
        'name' => $name, 'email' => $email, 'role' => $role, 'status' => $status,
    ]);

    flash('success', 'User created.');
} catch (Throwable $ex) {
    try { $pdo->rollBack(); } catch (Throwable $e) {}
    flash('error', 'Failed to create user: ' . $ex->getMessage());
}

redirect('users/index.php');
