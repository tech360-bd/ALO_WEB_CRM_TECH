/**
 * Dev-only fixture for Super Admin runtime proof (SQLite sandbox).
 *
 * Creates, idempotently:
 *   • the SUPER_ADMIN RBAC role with a representative permission set;
 *   • a Super Admin portal user ("Super Admin") and an Employee row for it;
 *   • three employee logins (counselor, marketing manager, visa officer) that
 *     Acting-As can target;
 *   • a long-lived session token for the Super Admin so API probes can run
 *     without going through the login form.
 *
 * NEVER run against production: it requires a `file:` DATABASE_URL.
 */

import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL || '';
if (!url.startsWith('file:')) {
  console.error('Refusing to run: DATABASE_URL must be a file: SQLite URL (dev sandbox only).');
  process.exit(1);
}

const db = new PrismaClient();

const MODULES = ['students', 'leads', 'applications', 'visa', 'finance', 'marketing', 'hr', 'reports', 'settings', 'rbac'];
const ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export'];

async function main() {
  const permissions: Array<{ id: string }> = [];

  for (const moduleName of MODULES) {
    for (const action of ACTIONS) {
      const row = await db.portalPermission.upsert({
        where: { module_feature_action: { module: moduleName, feature: 'records', action } },
        update: {},
        create: {
          module: moduleName,
          feature: 'records',
          action,
          description: `${action} ${moduleName} records`,
        },
      });
      permissions.push({ id: row.id });
    }
  }

  const superRole = await db.portalRole.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { label: 'Super Admin' },
    create: { name: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full system authority', isSystem: true },
  });

  const otherRoles = [
    { name: 'COUNSELOR', label: 'Counselor' },
    { name: 'MARKETING_MANAGER', label: 'Marketing Manager' },
    { name: 'VISA_OFFICER', label: 'Visa Officer' },
    { name: 'APPLICATION_TEAM', label: 'Application Team' },
  ];
  const roleIds = new Map<string, string>();
  for (const role of otherRoles) {
    const row = await db.portalRole.upsert({
      where: { name: role.name },
      update: { label: role.label },
      create: { ...role, description: `${role.label} role`, isSystem: true },
    });
    roleIds.set(role.name, row.id);
  }
  roleIds.set('SUPER_ADMIN', superRole.id);

  for (const permission of permissions) {
    await db.portalRolePermission.upsert({
      where: { roleId_permissionId: { roleId: superRole.id, permissionId: permission.id } },
      update: { granted: true },
      create: { roleId: superRole.id, permissionId: permission.id, granted: true },
    });
  }

  const superUser = await db.portalUser.upsert({
    where: { email: 'super.admin@aloeducation.dev' },
    update: { status: 'active', emailVerified: true, userType: 'EMPLOYEE' },
    create: {
      email: 'super.admin@aloeducation.dev',
      name: 'Super Admin',
      userType: 'EMPLOYEE',
      status: 'active',
      emailVerified: true,
      passwordHash: '',
    },
  });
  await db.portalUserRole.upsert({
    where: { userId_roleId: { userId: superUser.id, roleId: superRole.id } },
    update: {},
    create: { userId: superUser.id, roleId: superRole.id },
  });

  await db.employee.upsert({
    where: { userId: superUser.id },
    update: { status: 'active', role: 'SUPER_ADMIN' },
    create: {
      userId: superUser.id,
      employeeId: 'ALO-EMP-SA-001',
      name: 'Super Admin',
      email: superUser.email,
      role: 'SUPER_ADMIN',
      department: 'Executive',
      branch: 'Dhaka HQ',
      status: 'active',
    },
  });

  const employees: Array<{ email: string; name: string; code: string; role: string; department: string }> = [
    { email: 'counselor@aloeducation.dev', name: 'Nusrat Jahan', code: 'ALO-EMP-C-101', role: 'COUNSELOR', department: 'Counseling' },
    { email: 'marketing.manager@aloeducation.dev', name: 'Rafiq Hasan', code: 'ALO-EMP-M-201', role: 'MARKETING_MANAGER', department: 'Marketing' },
    { email: 'visa.officer@aloeducation.dev', name: 'Tasnim Akter', code: 'ALO-EMP-V-301', role: 'VISA_OFFICER', department: 'Visa' },
  ];

  for (const person of employees) {
    const user = await db.portalUser.upsert({
      where: { email: person.email },
      update: { status: 'active', emailVerified: true, userType: 'EMPLOYEE' },
      create: {
        email: person.email,
        name: person.name,
        userType: 'EMPLOYEE',
        status: 'active',
        emailVerified: true,
        passwordHash: '',
      },
    });
    const roleId = roleIds.get(person.role);
    if (roleId) {
      await db.portalUserRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId },
      });
    }
    await db.employee.upsert({
      where: { userId: user.id },
      update: { status: 'active', role: person.role },
      create: {
        userId: user.id,
        employeeId: person.code,
        name: person.name,
        email: person.email,
        role: person.role,
        department: person.department,
        branch: 'Dhaka HQ',
        status: 'active',
      },
    });
  }

  const token = process.env.DEV_SUPER_ADMIN_TOKEN || 'dev-super-admin-token';
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const existing = await db.portalSession.findUnique({ where: { token } });
  if (!existing) {
    await db.portalSession.create({
      data: { userId: superUser.id, token, deviceName: 'dev-proof', expiresAt },
    });
  } else {
    await db.portalSession.update({ where: { token }, data: { userId: superUser.id, expiresAt, revokedAt: null } });
  }

  console.log(JSON.stringify({
    superAdminUserId: superUser.id,
    permissions: permissions.length,
    sessionToken: token,
    expiresAt: expiresAt.toISOString(),
  }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
