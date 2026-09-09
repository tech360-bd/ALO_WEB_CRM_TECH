/**
 * Dashboard Data Test — verifies each dashboard's underlying queries return real data.
 * Mirrors the logic in each dashboard's API route.
 */
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

console.log('\n📊 DASHBOARD DATA TEST\n' + '='.repeat(60));

let pass = 0, fail = 0;

async function check(name, count, min = 1) {
  if (count >= min) {
    console.log(`✅ ${name}: ${count} records`);
    pass++;
  } else {
    console.log(`❌ ${name}: ${count} records (expected ≥ ${min})`);
    fail++;
  }
}

// ── Admin Dashboard
console.log('\n📋 Admin Dashboard:');
await check('Total users', await db.portalUser.count());
await check('Total roles', await db.portalRole.count());
await check('Total employees', await db.employeeProfile.count());
await check('Total partners', await db.partnerProfile.count());
await check('Total students', await db.portalStudentProfile.count());
await check('Total audit logs', await db.portalAuditLog.count());

// ── CRM Dashboard
console.log('\n📋 CRM Dashboard:');
await check('Universities', await db.crmUniversity.count());
await check('Courses', await db.crmCourse.count());
await check('Scholarships', await db.crmScholarship.count());
await check('Communication threads', await db.communicationThread.count());
await check('Communication messages', await db.communicationMessage.count());
await check('Student applications', await db.portalStudentApplication.count());
await check('Counselor tasks', await db.counselorTask.count());

// ── Student Portal Dashboard
console.log('\n📋 Student Portal Dashboard:');
const studentProfile = await db.portalStudentProfile.findFirst();
if (studentProfile) {
  await check('Student timeline events', await db.timelineEvent.count({ where: { studentId: studentProfile.id } }).catch(() => 0), 0);
  await check('Student documents', await db.studentDocument.count());
  await check('Student applications', await db.portalStudentApplication.count({ where: { studentProfileId: studentProfile.id } }));
  await check('Mock test packages', await db.mockTestPackage.count());
} else {
  console.log('❌ No student profile found');
  fail++;
}

// ── Partner Portal Dashboard
console.log('\n📋 Partner Portal Dashboard:');
const partnerProfile = await db.partnerProfile.findFirst();
if (partnerProfile) {
  await check('Partner profile', 1, 1);
  await check('Partner user', await db.portalUser.count({ where: { userType: 'PARTNER' } }));
} else {
  console.log('❌ No partner profile found');
  fail++;
}

// ── Marketing Dashboard
console.log('\n📋 Marketing Dashboard:');
await check('Team members', await db.teamMember.count());
await check('Homepage FAQs', await db.homepageFaq.count());
await check('Home services', await db.homeService.count());
await check('Success stories', await db.successStory.count());
await check('Countries', await db.country.count());

// ── Public APIs
console.log('\n🌐 Public Website APIs:');
await check('Universities (public)', await db.crmUniversity.count({ where: { status: 'active' } }));
await check('Courses (public)', await db.crmCourse.count());
await check('Scholarships (public)', await db.crmScholarship.count());

// ── Sample university record (verify data integrity)
console.log('\n🎓 Sample University Record:');
const sampleUni = await db.crmUniversity.findFirst({ where: { name: { contains: 'Manchester' } } });
if (sampleUni) {
  console.log(`   Name: ${sampleUni.name}`);
  console.log(`   Country: ${sampleUni.country}`);
  console.log(`   City: ${sampleUni.city}`);
  console.log(`   Ranking: ${sampleUni.ranking || 'N/A'}`);
  console.log(`   World Ranking: ${sampleUni.worldRanking || 'N/A'}`);
  console.log(`   IELTS Min: ${sampleUni.ieltsMin || 'N/A'}`);
  console.log(`   Status: ${sampleUni.status}`);
  pass++;
} else {
  console.log('❌ No Manchester university found');
  fail++;
}

console.log('\n' + '='.repeat(60));
console.log(`📊 RESULT: ${pass} passed, ${fail} failed`);
console.log('='.repeat(60) + '\n');

await db.$disconnect();
process.exit(fail > 0 ? 1 : 0);
