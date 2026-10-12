/**
 * Development-sandbox fixtures: counselor users for CRM auto-assignment
 * testing. Idempotent (upserts). Synthetic data only — clearly marked
 * @aloeducation.dev addresses, never used in production.
 *
 * Run:
 *   DATABASE_URL="file:$PWD/prisma/dev.db" npx tsx scripts/dev-sqlite/seed-dev-fixtures.ts
 */
import { db } from '../../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('DevCounselor2026!', 12);

  const counselors = [
    { email: 'counselor.one@aloeducation.dev', name: 'Dev Counselor One' },
    { email: 'counselor.two@aloeducation.dev', name: 'Dev Counselor Two' },
  ];

  for (const c of counselors) {
    const user = await db.user.upsert({
      where: { email: c.email },
      update: { role: 'COUNSELOR', status: 'ACTIVE' },
      create: {
        email: c.email,
        name: c.name,
        role: 'COUNSELOR',
        status: 'ACTIVE',
        passwordHash: password,
        permissions: JSON.stringify(['crm.leads', 'crm.students']),
      },
    });
    console.log(`Counselor user ready: ${user.email} (${user.id})`);
  }

  // Give the seeded super-admin a usable dev password when it has none.
  // (prisma/seed.ts requires SEED_SUPER_ADMIN_PASSWORD in real environments;
  // this fixture only patches an EMPTY hash in the local sandbox DB.)
  const devAdminPassword = process.env.DEV_ADMIN_PASSWORD;
  if (devAdminPassword) {
    const admin = await db.user.findUnique({ where: { email: 'admin@aloeducation.com' } });
    if (admin && admin.passwordHash === '') {
      await db.user.update({
        where: { id: admin.id },
        data: { passwordHash: await bcrypt.hash(devAdminPassword, 12) },
      });
      console.log('Dev admin password set (hash was empty).');
    } else if (admin) {
      console.log('Admin already has a password hash — left untouched.');
    }
  }

  console.log('Dev fixtures seeded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
