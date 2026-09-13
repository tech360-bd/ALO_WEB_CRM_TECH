/* eslint-disable @typescript-eslint/no-require-imports */
// Pure JavaScript / mysql2 Core Production Seeder for cPanel CloudLinux
// Bypasses Prisma Rust Engine Tokio timer panics in cPanel Jailshell

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDirectMySQL() {
  console.log('[Direct MySQL Seed] Starting production seed...');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in environment.');
  }

  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@aloeducation.com';
  let adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!adminPassword && fs.existsSync('.seed-admin-password')) {
    adminPassword = fs.readFileSync('.seed-admin-password', 'utf8').trim();
  }

  if (!adminPassword || adminPassword.length < 12) {
    adminPassword = 'AloAdminSecure2026!Pass';
  }

  const parsedUrl = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: parsedUrl.hostname || '127.0.0.1',
    port: parseInt(parsedUrl.port || '3306', 10),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: decodeURIComponent(parsedUrl.pathname.replace(/^\//, '')),
  });

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const now = new Date();

    // 1. User Table
    await connection.query(
      `INSERT INTO User (id, email, name, role, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, 'SUPER_ADMIN', ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = 'SUPER_ADMIN', permissions = VALUES(permissions), updatedAt = VALUES(updatedAt)`,
      ['usr_initial_super_admin', adminEmail, 'Initial Super Admin', JSON.stringify(['ALL']), now, now]
    );
    console.log('- User table: PASS');

    // 2. DeploymentSequence Table
    await connection.query(
      `INSERT INTO DeploymentSequence (name, createdAt)
       VALUES ('complete-production-seed', ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [now]
    );
    console.log('- DeploymentSequence table: PASS');

    // 3. PortalRole Table
    const roleId = 'role_super_admin';
    await connection.query(
      `INSERT INTO PortalRole (id, name, label, description, isSystem, createdAt, updatedAt)
       VALUES (?, 'SUPER_ADMIN', 'Super Admin', 'Initial system administrator role.', true, ?, ?)
       ON DUPLICATE KEY UPDATE label = 'Super Admin', isSystem = true, updatedAt = VALUES(updatedAt)`,
      [roleId, now, now]
    );
    console.log('- PortalRole table: PASS');

    // 4. PortalPermission Table
    const permId = 'perm_system_all_manage';
    await connection.query(
      `INSERT INTO PortalPermission (id, module, feature, action, description, createdAt, updatedAt)
       VALUES (?, 'system', 'all', 'manage', 'Full system administration permission.', ?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description), updatedAt = VALUES(updatedAt)`,
      [permId, now, now]
    );
    console.log('- PortalPermission table: PASS');

    // 5. PortalRolePermission Table
    await connection.query(
      `INSERT INTO PortalRolePermission (id, roleId, permissionId, granted, assignedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, true, 'complete-production-seed', ?, ?)
       ON DUPLICATE KEY UPDATE granted = true, updatedAt = VALUES(updatedAt)`,
      [`prp_${roleId}_${permId}`, roleId, permId, now, now]
    );
    console.log('- PortalRolePermission table: PASS');

    // 6. PortalUser Table
    const userId = 'pu_initial_super_admin';
    await connection.query(
      `INSERT INTO PortalUser (id, email, passwordHash, name, userType, status, firstLoginRequired, emailVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, 'Initial Super Admin', 'SUPER_ADMIN', 'active', false, true, ?, ?)
       ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash), userType = 'SUPER_ADMIN', status = 'active', updatedAt = VALUES(updatedAt)`,
      [userId, adminEmail, passwordHash, now, now]
    );
    console.log('- PortalUser table: PASS');

    // 7. PortalUserRole Table
    await connection.query(
      `INSERT INTO PortalUserRole (id, userId, roleId, assignedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, 'complete-production-seed', ?, ?)
       ON DUPLICATE KEY UPDATE assignedBy = VALUES(assignedBy), updatedAt = VALUES(updatedAt)`,
      [`pur_${userId}_${roleId}`, userId, roleId, now, now]
    );
    console.log('- PortalUserRole table: PASS');

    // 8. EmployeeCommunicationProfile Table
    await connection.query(
      `INSERT INTO EmployeeCommunicationProfile (id, employeeId, employeeName, officialEmail, officialPhone, whatsappAccess, facebookAccess, instagramAccess, emailAccess, assignedBranch, assignedDepartments, channelPermissions, workingHoursStart, workingHoursEnd, createdAt, updatedAt)
       VALUES (?, 'system-initial-admin', 'Initial Super Admin', ?, '', false, false, false, true, 'unassigned', ?, ?, '10:00', '18:00', ?, ?)
       ON DUPLICATE KEY UPDATE officialEmail = VALUES(officialEmail), updatedAt = VALUES(updatedAt)`,
      ['ecp_system_initial_admin', adminEmail, JSON.stringify(['Administration']), JSON.stringify({ email: true }), now, now]
    );
    console.log('- EmployeeCommunicationProfile table: PASS');

    console.log('[Direct MySQL Seed] COMPLETE! All core system roles and Super Admin created successfully.');
  } finally {
    await connection.end();
  }
}

seedDirectMySQL().catch((err) => {
  console.error('[Direct MySQL Seed Failed]', err);
  process.exit(1);
});
