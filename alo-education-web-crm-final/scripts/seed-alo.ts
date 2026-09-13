import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seedAlo() {
  console.log('[Seed ALO] Starting production-safe seed helper...');

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
    where: { name: 'alo-seed-helper' },
    update: {},
    create: { name: 'alo-seed-helper' },
  });

  await db.portalUser.upsert({
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

  console.log('[Seed ALO] Completed without hardcoded login credentials.');
}

seedAlo()
  .catch((error) => {
    console.error('[Seed ALO Error]', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
