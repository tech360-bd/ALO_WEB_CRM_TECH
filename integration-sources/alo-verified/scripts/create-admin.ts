/**
 * Create the first super_admin user for a fresh production database.
 *
 * Usage:
 *   bun run src/scripts/create-admin.ts
 *
 * Prompts for email + password (or reads from env: ADMIN_EMAIL, ADMIN_PASSWORD).
 * Idempotent — if the user already exists, updates the password + ensures super_admin role.
 */
import { db } from '../lib/db';
import { hashPassword } from '../lib/auth';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@aloeducation.com';
  const password = process.env.ADMIN_PASSWORD || (() => {
    throw new Error('ADMIN_PASSWORD env var is required. Set it to a strong random value.');
  })();

  console.log(`Creating/Updating super_admin: ${email}`);

  const hashed = await hashPassword(password);

  // Upsert user
  const user = await db.user.upsert({
    where: { email },
    update: { password: hashed, status: 'active', forcePasswordChange: true },
    create: {
      email,
      password: hashed,
      name: 'Super Admin',
      userType: 'employee',
      status: 'active',
      forcePasswordChange: true,
    },
  });

  // Ensure super_admin role exists
  const role = await db.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access' },
  });

  // Assign role
  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  console.log(`✅ Super admin ready: ${email} (id: ${user.id})`);
  console.log('⚠️  forcePasswordChange=true — the admin must change password on first login.');
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
