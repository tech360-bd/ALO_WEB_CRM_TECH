import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV !== 'test') throw new Error('Legacy fixture seed requires NODE_ENV=test and an isolated approved test database');
  const fixturePassword = process.env.TEST_FIXTURE_PASSWORD;
  if (!fixturePassword || fixturePassword.length < 16) throw new Error('TEST_FIXTURE_PASSWORD must be supplied securely (16+ characters)');
  if (!process.env.SEED_SUPER_ADMIN_PASSWORD || process.env.SEED_SUPER_ADMIN_PASSWORD.length < 16) throw new Error('SEED_SUPER_ADMIN_PASSWORD must be supplied securely (16+ characters)');
  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@aloeducation.com';
  const adminPass = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const testPass = fixturePassword;

  const adminHash = await bcrypt.hash(adminPass, 12);
  const testHash = await bcrypt.hash(testPass, 12);

  const users = [
    {
      email: adminEmail,
      name: 'Super Admin',
      passwordHash: adminHash,
      userType: 'SUPER_ADMIN',
      status: 'active',
    },
    {
      email: 'student@test.com',
      name: 'Test Student',
      passwordHash: testHash,
      userType: 'STUDENT',
      status: 'active',
    },
    {
      email: 'partner@test.com',
      name: 'Test Partner',
      passwordHash: testHash,
      userType: 'PARTNER',
      status: 'active',
    },
    {
      email: 'employee@test.com',
      name: 'Test Employee',
      passwordHash: testHash,
      userType: 'EMPLOYEE',
      status: 'active',
    },
  ];

  for (const u of users) {
    const existing = await db.portalUser.findUnique({ where: { email: u.email } });
    if (existing) {
      await db.portalUser.update({
        where: { email: u.email },
        data: {
          passwordHash: u.passwordHash,
          userType: u.userType,
          status: u.status,
          name: u.name,
        },
      });
      console.log('✅ Updated:', u.email, u.userType);
    } else {
      await db.portalUser.create({ data: u });
      console.log('✅ Created:', u.email, u.userType);
    }
  }

  console.log('\n✅ All portal users ready!');
  await db.$disconnect();
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
