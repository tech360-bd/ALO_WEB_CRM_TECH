import { db } from '../src/lib/db.js';

async function main() {
  console.log('============================================================');
  console.log('ALO EDUCATION — EXACT DATABASE COUNTS AUDIT');
  console.log('============================================================');

  const countryCount = await db.country.count().catch(() => 0);
  const universityCount = await db.crmUniversity.count().catch(() => 0);
  const courseCount = await db.crmCourse.count().catch(() => 0);
  const intakeFeeCount = await db.crmCourseIntakeFee.count().catch(() => 0);
  const requirementCount = await db.crmCourseRequirement.count().catch(() => 0);
  const scholarshipCount = await db.crmScholarship.count().catch(() => 0);
  const sourceLogCount = await db.crmSourceLog.count().catch(() => 0);
  const importBatchCount = await db.crmImportBatch.count().catch(() => 0);
  const importErrorCount = await db.crmImportError.count().catch(() => 0);
  const approvalCount = await db.approvalRequest.count().catch(() => 0);
  const userCount = await db.user.count().catch(() => 0);

  console.log(`Countries: ${countryCount}`);
  console.log(`Universities (CrmUniversity): ${universityCount}`);
  console.log(`Courses (CrmCourse): ${courseCount}`);
  console.log(`Course Intake Fees (CrmCourseIntakeFee): ${intakeFeeCount}`);
  console.log(`Course Requirements (CrmCourseRequirement): ${requirementCount}`);
  console.log(`Scholarships (CrmScholarship): ${scholarshipCount}`);
  console.log(`Source Logs (CrmSourceLog): ${sourceLogCount}`);
  console.log(`Import Batches (CrmImportBatch): ${importBatchCount}`);
  console.log(`Import Errors (CrmImportError): ${importErrorCount}`);
  console.log(`Approval Requests (ApprovalRequest): ${approvalCount}`);
  console.log(`Users: ${userCount}`);

  console.log('\n--- UNIVERSITIES BY COUNTRY ---');
  const unisByCountry = await db.crmUniversity.groupBy({
    by: ['countryId'],
    _count: { id: true },
  }).catch(() => []);

  for (const group of unisByCountry) {
    const country = group.countryId ? await db.country.findUnique({ where: { id: group.countryId } }) : null;
    console.log(`Country: ${country ? country.name : 'Unassigned / Direct Text'} -> ${group._count.id} Universities`);
  }

  console.log('\n--- COURSES BY STUDY LEVEL ---');
  const coursesByLevel = await db.crmCourse.groupBy({
    by: ['studyLevel'],
    _count: { id: true },
  }).catch(() => []);

  for (const group of coursesByLevel) {
    console.log(`Study Level: ${group.studyLevel || 'Unspecified'} -> ${group._count.id} Courses`);
  }

  console.log('\n--- COURSES BY VERIFICATION STATUS ---');
  const coursesByStatus = await db.crmCourse.groupBy({
    by: ['verificationStatus'],
    _count: { id: true },
  }).catch(() => []);

  for (const group of coursesByStatus) {
    console.log(`Verification Status: ${group.verificationStatus || 'Default (VERIFIED)'} -> ${group._count.id} Courses`);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Database query error:', err.message);
  process.exit(1);
});
