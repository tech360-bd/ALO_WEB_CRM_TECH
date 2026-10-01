import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV !== 'test') throw new Error('Legacy fixture seed requires NODE_ENV=test and an isolated approved test database');
  const fixturePassword = process.env.TEST_FIXTURE_PASSWORD;
  if (!fixturePassword || fixturePassword.length < 16) throw new Error('TEST_FIXTURE_PASSWORD must be supplied securely (16+ characters)');
  if (!process.env.SEED_SUPER_ADMIN_PASSWORD || process.env.SEED_SUPER_ADMIN_PASSWORD.length < 16) throw new Error('SEED_SUPER_ADMIN_PASSWORD must be supplied securely (16+ characters)');
  const email = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@aloeducation.com';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  
  console.log('Seeding PortalUser:', email);
  
  const hash = await bcrypt.hash(password, 12);
  
  const user = await db.portalUser.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      status: 'active',
      userType: 'SUPER_ADMIN',
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
    },
    create: {
      email,
      name: 'Super Admin',
      passwordHash: hash,
      userType: 'SUPER_ADMIN',
      role: 'SUPER_ADMIN',
      status: 'active',
      permissions: JSON.stringify(['ALL']),
    },
  });
  
  console.log('✅ PortalUser ready:', user.email, user.userType, user.status);
  
  // Also create test users for each portal
  const testUsers = [
    { email: 'student@test.com', userType: 'STUDENT', role: 'student', name: 'Test Student' },
    { email: 'partner@test.com', userType: 'PARTNER', role: 'partner', name: 'Test Partner' },
    { email: 'employee@test.com', userType: 'EMPLOYEE', role: 'counselor', name: 'Test Employee' },
  ];
  
  const testPass = await bcrypt.hash(fixturePassword, 12);
  
  for (const u of testUsers) {
    await db.portalUser.upsert({
      where: { email: u.email },
      update: { passwordHash: testPass, status: 'active', userType: u.userType },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: testPass,
        userType: u.userType,
        role: u.role,
        status: 'active',
        permissions: JSON.stringify([]),
      },
    });
    console.log('✅ Test user:', u.email, u.userType);
  }
  
  await db.$disconnect();
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
