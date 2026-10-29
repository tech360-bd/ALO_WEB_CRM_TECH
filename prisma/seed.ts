/// <reference types="node" />
import { db } from '../src/lib/db';
import { seedOfficialNumberPool } from '../src/lib/whatsapp-number-pool';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[Seed] Starting production-safe MySQL seed...');

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
    where: { name: 'production-seed' },
    update: {},
    create: { name: 'production-seed' },
  });

  // Add only missing number-pool configuration rows. This is not an ownership,
  // credential, or Meta Cloud API connectivity assertion.
  const waPool = await seedOfficialNumberPool();
  console.log(`[Seed] WhatsApp number-pool configuration rows: ${waPool.count} total (${waPool.created} added; unverified).`);

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
      assignedBy: 'production-seed',
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
      assignedBy: 'production-seed',
    },
  });

  if (process.env.ENABLE_DEVELOPMENT_SAMPLE_DATA === 'true') {
    const samplePassword = process.env.DEVELOPMENT_SAMPLE_PASSWORD;
    if (!samplePassword || samplePassword.length < 12) {
      throw new Error('DEVELOPMENT_SAMPLE_PASSWORD must be set to at least 12 characters when sample data is enabled.');
    }

    await db.aloStudent.upsert({
      where: { studentId: 'DEV-STUDENT-0001' },
      update: {},
      create: {
        studentId: 'DEV-STUDENT-0001',
        studentType: 'development_sample',
        name: 'Development Sample Student',
        email: 'dev.student@example.invalid',
        phone: '+8801000000000',
        password: samplePassword,
        profileCompletion: 0,
        englishCredits: 0,
        englishCreditsUsed: 0,
        visaReadinessScore: 0,
      },
    });
  }

  console.log('[Seed] Completed production-safe MySQL seed. Credentials are supplied outside the seed process.');
}

seed()
  .catch((error) => {
    console.error('[Seed Error]', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
