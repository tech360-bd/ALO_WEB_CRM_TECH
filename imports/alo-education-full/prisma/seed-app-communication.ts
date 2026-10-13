import { db } from '../src/lib/db';

const STUDENTS = [
  { firstName: 'Rahim', lastName: 'Uddin', fullName: 'Rahim Uddin', email: 'rahim@student.com', mobile: '+8801711000001', studyDestination: 'UK' },
  { firstName: 'Fatima', lastName: 'Akter', fullName: 'Fatima Akter', email: 'fatima@student.com', mobile: '+8801711000002', studyDestination: 'UK' },
  { firstName: 'Karim', lastName: 'Hossain', fullName: 'Karim Hossain', email: 'karim@student.com', mobile: '+8801711000003', studyDestination: 'Australia' },
  { firstName: 'Nusrat', lastName: 'Jahan', fullName: 'Nusrat Jahan', email: 'nusrat@student.com', mobile: '+8801711000004', studyDestination: 'Canada' },
  { firstName: 'Tanvir', lastName: 'Islam', fullName: 'Tanvir Islam', email: 'tanvir@student.com', mobile: '+8801711000005', studyDestination: 'USA' },
];

const APPLICATIONS = [
  { studentEmail: 'rahim@student.com', university: 'University of Hertfordshire', course: 'MSc Computer Science', country: 'UK', intake: 'September 2026', studyLevel: 'Masters', stage: 'DOCUMENTATION', applicationId: 'APP-2025-001' },
  { studentEmail: 'rahim@student.com', university: 'University of Sunderland', course: 'MBA International Business', country: 'UK', intake: 'January 2026', studyLevel: 'MBA', stage: 'APPLICATION_SENT', applicationId: 'APP-2025-002' },
  { studentEmail: 'fatima@student.com', university: 'University of Hertfordshire', course: 'MSc Data Analytics', country: 'UK', intake: 'September 2026', studyLevel: 'Masters', stage: 'DOCUMENTATION', applicationId: 'APP-2025-003' },
  { studentEmail: 'karim@student.com', university: 'University of Dundee', course: 'MSc Petroleum Engineering', country: 'UK', intake: 'September 2026', studyLevel: 'Masters', stage: 'COUNSELING', applicationId: 'APP-2025-004' },
  { studentEmail: 'nusrat@student.com', university: 'University of Aberdeen', course: 'MSc Biomedical Sciences', country: 'UK', intake: 'January 2026', studyLevel: 'Masters', stage: 'DOCUMENTATION', applicationId: 'APP-2025-005' },
];

const DOCS_PER_APP: Record<string, { name: string; status: string; category: string }[]> = {
  'APP-2025-001': [
    { name: 'Passport Copy', status: 'MISSING', category: 'IDENTITY' },
    { name: 'IELTS Certificate', status: 'VERIFIED', category: 'ENGLISH' },
    { name: 'Bank Statement', status: 'MISSING', category: 'FINANCIAL' },
    { name: 'Parent Consent Letter', status: 'MISSING', category: 'CONSENT' },
    { name: 'Academic Transcript', status: 'VERIFIED', category: 'ACADEMIC' },
    { name: 'Degree Certificate', status: 'PENDING_REVIEW', category: 'ACADEMIC' },
    { name: 'Personal Statement', status: 'MISSING', category: 'APPLICATION' },
    { name: 'CV / Resume', status: 'VERIFIED', category: 'APPLICATION' },
    { name: 'Reference Letter 1', status: 'MISSING', category: 'APPLICATION' },
    { name: 'Reference Letter 2', status: 'MISSING', category: 'APPLICATION' },
  ],
  'APP-2025-002': [
    { name: 'Passport Copy', status: 'VERIFIED', category: 'IDENTITY' },
    { name: 'IELTS Certificate', status: 'VERIFIED', category: 'ENGLISH' },
    { name: 'Bank Statement', status: 'VERIFIED', category: 'FINANCIAL' },
    { name: 'Academic Transcript', status: 'VERIFIED', category: 'ACADEMIC' },
    { name: 'Degree Certificate', status: 'VERIFIED', category: 'ACADEMIC' },
  ],
  'APP-2025-003': [
    { name: 'Passport Copy', status: 'MISSING', category: 'IDENTITY' },
    { name: 'PTE Academic Certificate', status: 'MISSING', category: 'ENGLISH' },
    { name: 'Bank Statement', status: 'VERIFIED', category: 'FINANCIAL' },
    { name: 'Academic Transcript', status: 'PENDING_REVIEW', category: 'ACADEMIC' },
    { name: 'Personal Statement', status: 'MISSING', category: 'APPLICATION' },
    { name: 'CV / Resume', status: 'VERIFIED', category: 'APPLICATION' },
  ],
  'APP-2025-004': [
    { name: 'Passport Copy', status: 'VERIFIED', category: 'IDENTITY' },
    { name: 'IELTS Certificate', status: 'MISSING', category: 'ENGLISH' },
    { name: 'Bank Statement', status: 'MISSING', category: 'FINANCIAL' },
    { name: 'Sponsorship Letter', status: 'MISSING', category: 'FINANCIAL' },
    { name: 'Academic Transcript', status: 'VERIFIED', category: 'ACADEMIC' },
  ],
  'APP-2025-005': [
    { name: 'Passport Copy', status: 'VERIFIED', category: 'IDENTITY' },
    { name: 'TOEFL Certificate', status: 'MISSING', category: 'ENGLISH' },
    { name: 'Bank Statement', status: 'MISSING', category: 'FINANCIAL' },
    { name: 'Parent Consent Letter', status: 'MISSING', category: 'CONSENT' },
    { name: 'Academic Transcript', status: 'VERIFIED', category: 'ACADEMIC' },
    { name: 'Degree Certificate', status: 'VERIFIED', category: 'ACADEMIC' },
    { name: 'Personal Statement', status: 'MISSING', category: 'APPLICATION' },
  ],
};

async function main() {
  console.log('🌱 Seeding Application Communication data...');

  // Seed students
  for (const s of STUDENTS) {
    await db.student.upsert({
      where: { studentId: s.email },
      update: {},
      create: {
        studentId: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: s.fullName,
        email: s.email,
        mobile: s.mobile,
        nationality: 'Bangladeshi',
        studyDestination: s.studyDestination,
        profileCompletion: 60,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`  ✅ ${STUDENTS.length} students`);

  // Seed applications
  for (const a of APPLICATIONS) {
    const student = await db.student.findUnique({ where: { studentId: a.studentEmail } });
    if (!student) continue;

    await db.application.upsert({
      where: { applicationId: a.applicationId },
      update: {},
      create: {
        applicationId: a.applicationId,
        studentId: student.id,
        university: a.university,
        course: a.course,
        country: a.country,
        intake: a.intake,
        studyLevel: a.studyLevel,
        stage: a.stage,
      },
    });
  }
  console.log(`  ✅ ${APPLICATIONS.length} applications`);

  // Seed documents
  let docCount = 0;
  for (const [appId, docs] of Object.entries(DOCS_PER_APP)) {
    const app = await db.application.findUnique({ where: { applicationId: appId } });
    if (!app) continue;

    for (const doc of docs) {
      const existing = await db.applicationDocument.findFirst({
        where: { applicationId: app.applicationId, name: doc.name },
      });
      if (existing) continue;

      await db.applicationDocument.create({
        data: {
          applicationId: app.applicationId,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          verifiedAt: doc.status === 'VERIFIED' ? new Date() : null,
          verifiedBy: doc.status === 'VERIFIED' ? 'system' : null,
        },
      });
      docCount++;
    }
  }
  console.log(`  ✅ ${docCount} documents`);

  console.log('🎉 Application Communication seed complete!');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
