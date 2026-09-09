/**
 * Auth Flow Test — verifies login, session, RBAC without running the Next.js server.
 * Mirrors the logic in src/app/api/portal-auth/login/route.ts and src/lib/auth-middleware.ts.
 */
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

const bcrypt = (bcryptjs).default || bcryptjs;
const db = new PrismaClient();

const PASSWORD = 'SET_VIA_ENVIRONMENT_ONLY';
const EMAILS = [
  { email: 'admin@aloeducation.com',         portal: 'admin',   expectRole: 'super_admin' },
  { email: 'counselor@alo.edu.bd',      portal: 'admin',   expectRole: 'counselor' },
  { email: 'ceo@alo.edu.bd',            portal: 'admin',   expectRole: 'ceo' },
  { email: 'student@alo.edu.bd',        portal: 'student', expectRole: 'STUDENT' },
  { email: 'partner.global@alo.edu.bd', portal: 'partner', expectRole: 'PARTNER' },
];

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('\n🔐 AUTH FLOW TEST\n' + '='.repeat(50));

let pass = 0, fail = 0;
const tokens = {};

for (const { email, portal, expectRole } of EMAILS) {
  // 1. Find user
  const user = await db.portalUser.findUnique({ where: { email } });
  if (!user) { console.log(`❌ ${email}: user not found`); fail++; continue; }

  // 2. Verify password
  const ok = await bcrypt.compare(PASSWORD, user.passwordHash);
  if (!ok) { console.log(`❌ ${email}: password mismatch`); fail++; continue; }

  // 3. Verify portal match
  const portalMap = { admin: ['SUPER_ADMIN', 'ADMIN'], student: ['STUDENT'], partner: ['PARTNER'] };
  if (!portalMap[portal].includes(user.userType)) {
    console.log(`❌ ${email}: userType ${user.userType} not allowed for portal ${portal}`); fail++; continue;
  }

  // 4. Get roles
  const userRoles = await db.portalUserRole.findMany({
    where: { userId: user.id },
    include: { role: { select: { name: true } } },
  });
  const roleNames = userRoles.map(ur => ur.role.name);
  if (!roleNames.includes(expectRole)) {
    console.log(`❌ ${email}: expected role ${expectRole} not in [${roleNames.join(',')}]`); fail++; continue;
  }

  // 5. Generate session token
  const token = makeToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.portalSession.create({
    data: { userId: user.id, token, expiresAt, ipAddress: '127.0.0.1', userAgent: 'test-script' },
  });
  tokens[email] = token;

  console.log(`✅ ${email}: login OK, roles=[${roleNames.join(',')}], token=${token.slice(0,16)}...`);
  pass++;
}

// 6. Verify each token can be validated
console.log('\n🎫 TOKEN VALIDATION\n' + '-'.repeat(50));
for (const [email, token] of Object.entries(tokens)) {
  const session = await db.portalSession.findUnique({
    where: { token },
    include: { user: { select: { email: true, status: true, userType: true } } },
  });
  if (!session) { console.log(`❌ ${email}: session not found`); fail++; continue; }
  if (session.expiresAt < new Date()) { console.log(`❌ ${email}: session expired`); fail++; continue; }
  if (session.user.status !== 'active') { console.log(`❌ ${email}: user not active`); fail++; continue; }
  console.log(`✅ ${email}: session valid, expires=${session.expiresAt.toISOString()}`);
  pass++;
}

// 7. RBAC check — verify each role has expected permissions
console.log('\n🛡️  RBAC CHECK\n' + '-'.repeat(50));
const roleChecks = [
  { role: 'super_admin', expectMin: 60 },  // Super admin should have nearly all
  { role: 'counselor', expectMin: 10 },
  { role: 'STUDENT', expectMin: 5 },
  { role: 'PARTNER', expectMin: 5 },
];
for (const { role, expectMin } of roleChecks) {
  const rp = await db.portalRolePermission.count({ where: { roleName: role, granted: true } }).catch(() => null);
  // Fallback: count via role lookup
  const roleRec = await db.portalRole.findUnique({ where: { name: role } });
  if (!roleRec) { console.log(`❌ ${role}: role not found`); fail++; continue; }
  const count = await db.portalRolePermission.count({ where: { roleId: roleRec.id, granted: true } });
  if (count < expectMin) {
    console.log(`❌ ${role}: only ${count} permissions (expected ≥ ${expectMin})`); fail++;
  } else {
    console.log(`✅ ${role}: ${count} permissions granted`);
    pass++;
  }
}

// 8. Cleanup test sessions
console.log('\n🧹 Cleanup test sessions...');
const del = await db.portalSession.deleteMany({ where: { token: { in: Object.values(tokens) } } });
console.log(`   Deleted ${del.count} test sessions`);

console.log('\n' + '='.repeat(50));
console.log(`📊 RESULT: ${pass} passed, ${fail} failed`);
console.log('='.repeat(50) + '\n');

await db.$disconnect();
process.exit(fail > 0 ? 1 : 0);
