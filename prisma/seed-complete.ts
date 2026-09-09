/// <reference types="node" />
import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seedComplete() {
  console.log('[Seed] Starting complete production-safe MySQL seed...');

  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@aloeducation.com';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('SEED_SUPER_ADMIN_PASSWORD must be set to a unique value with at least 12 characters.');
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'SUPER_ADMIN',
      permissions: JSON.stringify(['ALL']),
    },
    create: {
      email: adminEmail,
      name: 'Initial Super Admin',
      role: 'SUPER_ADMIN',
      permissions: JSON.stringify(['ALL']),
    },
  });

  await db.deploymentSequence.upsert({
    where: { name: 'complete-production-seed' },
    update: {},
    create: { name: 'complete-production-seed' },
  });

  const superAdminRole = await db.portalRole.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { label: 'Super Admin', isSystem: true },
    create: {
      name: 'SUPER_ADMIN',
      label: 'Super Admin',
      description: 'Initial system administrator role.',
      isSystem: true,
    },
  });

  const allPermission = await db.portalPermission.upsert({
    where: {
      module_feature_action: {
        module: 'system',
        feature: 'all',
        action: 'manage',
      },
    },
    update: {},
    create: {
      module: 'system',
      feature: 'all',
      action: 'manage',
      description: 'Full system administration permission.',
    },
  });

  await db.portalRolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: superAdminRole.id,
        permissionId: allPermission.id,
      },
    },
    update: { granted: true },
    create: {
      roleId: superAdminRole.id,
      permissionId: allPermission.id,
      granted: true,
      assignedBy: 'complete-production-seed',
    },
  });

  const portalAdmin = await db.portalUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      userType: 'SUPER_ADMIN',
      status: 'active',
      firstLoginRequired: true,
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Initial Super Admin',
      userType: 'SUPER_ADMIN',
      status: 'active',
      firstLoginRequired: true,
      emailVerified: true,
    },
  });

  await db.portalUserRole.upsert({
    where: {
      userId_roleId: {
        userId: portalAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: portalAdmin.id,
      roleId: superAdminRole.id,
      assignedBy: 'complete-production-seed',
    },
  });

  await db.employeeCommunicationProfile.upsert({
    where: { employeeId: 'system-initial-admin' },
    update: {},
    create: {
      employeeId: 'system-initial-admin',
      employeeName: 'Initial Super Admin',
      officialEmail: adminEmail,
      officialPhone: '',
      whatsappAccess: false,
      facebookAccess: false,
      instagramAccess: false,
      emailAccess: true,
      assignedBranch: 'unassigned',
      assignedDepartments: JSON.stringify(['Administration']),
      channelPermissions: JSON.stringify({ email: true }),
      workingHoursStart: '10:00',
      workingHoursEnd: '18:00',
    },
  });

  console.log('[Seed] Completed complete production-safe MySQL seed.');
}

seedComplete()
  .catch((error) => {
    console.error('[Seed Error]', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
