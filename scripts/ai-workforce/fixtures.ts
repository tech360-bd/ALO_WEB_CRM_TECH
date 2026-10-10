/**
 * ALO AI Workforce — verification fixtures.
 *
 * Creates a small but realistic slice of ALO operating data (users across
 * every role, a verified university/course/scholarship catalogue, leads,
 * students, documents and applications) so the acceptance harness exercises
 * the AI Workforce against real relational rows rather than mocks.
 *
 * Verification only: this is never imported by the application.
 */
import { db } from '@/lib/db';

export interface FixtureIds {
  users: Record<string, string>;
  leadIds: string[];
  studentIds: string[];
  applicationIds: string[];
  universityIds: string[];
  courseIds: string[];
}

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86_400_000);
const daysAhead = (days: number) => new Date(now + days * 86_400_000);

export async function createFixtures(): Promise<FixtureIds> {
  // ── Users: one per ALO role, plus a second counsellor/student for
  //    cross-tenant access tests. ──
  const userSeeds = [
    { key: 'superAdmin', id: 'awf-user-superadmin', email: 'superadmin@aloeducation.test', name: 'ALO Super Admin', role: 'SUPER_ADMIN' },
    { key: 'admin', id: 'awf-user-admin', email: 'admin@aloeducation.test', name: 'ALO Admin', role: 'ADMIN' },
    { key: 'manager', id: 'awf-user-manager', email: 'manager@aloeducation.test', name: 'Branch Manager', role: 'MANAGER' },
    { key: 'counselor', id: 'awf-user-counselor', email: 'counselor@aloeducation.test', name: 'Senior Counsellor', role: 'COUNSELOR' },
    { key: 'counselor2', id: 'awf-user-counselor-2', email: 'counselor2@aloeducation.test', name: 'Second Counsellor', role: 'COUNSELOR' },
    { key: 'employee', id: 'awf-user-employee', email: 'employee@aloeducation.test', name: 'Office Employee', role: 'EMPLOYEE' },
    { key: 'partner', id: 'awf-user-partner', email: 'partner@aloeducation.test', name: 'B2B Partner', role: 'PARTNER' },
    { key: 'student', id: 'awf-user-student', email: 'student@aloeducation.test', name: 'Rafiq Hasan', role: 'STUDENT' },
    { key: 'student2', id: 'awf-user-student-2', email: 'student2@aloeducation.test', name: 'Nusrat Jahan', role: 'STUDENT' },
  ];
  const users: Record<string, string> = {};
  for (const seed of userSeeds) {
    await db.user.upsert({
      where: { id: seed.id },
      create: { id: seed.id, email: seed.email, name: seed.name, role: seed.role, status: 'ACTIVE', passwordHash: 'verification-fixture-no-login' },
      update: { role: seed.role, status: 'ACTIVE' },
    });
    users[seed.key] = seed.id;
  }

  // ── Verified catalogue ──
  const universities = [
    { universityId: 'AWF-UNI-UK-1', name: 'University of Leeds', country: 'United Kingdom', city: 'Leeds', worldRanking: 75, ieltsMin: 6.5, officialUrl: 'https://www.leeds.ac.uk/' },
    { universityId: 'AWF-UNI-UK-2', name: 'Coventry University', country: 'United Kingdom', city: 'Coventry', worldRanking: 601, ieltsMin: 6.0, officialUrl: 'https://www.coventry.ac.uk/' },
    { universityId: 'AWF-UNI-UK-3', name: 'University of Birmingham', country: 'United Kingdom', city: 'Birmingham', worldRanking: 84, ieltsMin: 6.5, officialUrl: 'https://www.birmingham.ac.uk/' },
    { universityId: 'AWF-UNI-CA-1', name: 'University of Windsor', country: 'Canada', city: 'Windsor', worldRanking: 701, ieltsMin: 6.5, officialUrl: 'https://www.uwindsor.ca/' },
    { universityId: 'AWF-UNI-AU-1', name: 'Deakin University', country: 'Australia', city: 'Melbourne', worldRanking: 233, ieltsMin: 6.5, officialUrl: 'https://www.deakin.edu.au/' },
  ];
  for (const university of universities) {
    await db.crmUniversity.upsert({
      where: { universityId: university.universityId },
      create: {
        ...university,
        slug: university.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        website: university.officialUrl,
        sourceUrl: university.officialUrl,
        verificationStatus: 'VERIFIED',
        publicationStatus: 'PUBLISHED',
        status: 'active',
        lastVerifiedAt: daysAgo(14).toISOString().slice(0, 10),
      },
      update: { ieltsMin: university.ieltsMin, worldRanking: university.worldRanking, verificationStatus: 'VERIFIED' },
    });
  }

  const courses = [
    { courseId: 'AWF-CRS-1', universityId: 'AWF-UNI-UK-1', courseTitle: 'MSc Business Analytics and Decision Sciences', studyLevel: 'Masters', subjectArea: 'Business Analytics', country: 'United Kingdom', city: 'Leeds', tuitionFee: 29000, durationMonths: 12, ielts: 6.5 },
    { courseId: 'AWF-CRS-2', universityId: 'AWF-UNI-UK-2', courseTitle: 'MSc Data Science and Computational Intelligence', studyLevel: 'Masters', subjectArea: 'Data Science', country: 'United Kingdom', city: 'Coventry', tuitionFee: 18200, durationMonths: 12, ielts: 6.0 },
    { courseId: 'AWF-CRS-3', universityId: 'AWF-UNI-UK-2', courseTitle: 'MSc Business and Organisational Psychology', studyLevel: 'Masters', subjectArea: 'Business Psychology', country: 'United Kingdom', city: 'Coventry', tuitionFee: 17500, durationMonths: 12, ielts: 6.5 },
    { courseId: 'AWF-CRS-4', universityId: 'AWF-UNI-UK-3', courseTitle: 'MSc Computer Science', studyLevel: 'Masters', subjectArea: 'Computer Science', country: 'United Kingdom', city: 'Birmingham', tuitionFee: 30500, durationMonths: 12, ielts: 6.5 },
    { courseId: 'AWF-CRS-5', universityId: 'AWF-UNI-UK-1', courseTitle: 'BSc Business Management', studyLevel: 'Bachelors', subjectArea: 'Business Management', country: 'United Kingdom', city: 'Leeds', tuitionFee: 24500, durationMonths: 36, ielts: 6.0 },
    { courseId: 'AWF-CRS-6', universityId: 'AWF-UNI-CA-1', courseTitle: 'Master of Applied Computing', studyLevel: 'Masters', subjectArea: 'Computer Science', country: 'Canada', city: 'Windsor', tuitionFee: 26000, durationMonths: 16, ielts: 6.5 },
    { courseId: 'AWF-CRS-7', universityId: 'AWF-UNI-AU-1', courseTitle: 'Master of Business Analytics', studyLevel: 'Masters', subjectArea: 'Business Analytics', country: 'Australia', city: 'Melbourne', tuitionFee: 38000, durationMonths: 18, ielts: 6.5 },
    { courseId: 'AWF-CRS-8', universityId: 'AWF-UNI-UK-2', courseTitle: 'MSc International Business Management', studyLevel: 'Masters', subjectArea: 'International Business', country: 'United Kingdom', city: 'Coventry', tuitionFee: 16800, durationMonths: 12, ielts: 6.0 },
  ];
  for (const course of courses) {
    await db.crmCourse.upsert({
      where: { courseId: course.courseId },
      create: {
        courseId: course.courseId,
        universityId: course.universityId,
        courseTitle: course.courseTitle,
        name: course.courseTitle,
        slug: course.courseId.toLowerCase(),
        studyLevel: course.studyLevel,
        qualification: course.studyLevel,
        subjectArea: course.subjectArea,
        disciplineArea: course.subjectArea,
        country: course.country,
        city: course.city,
        tuitionFee: course.tuitionFee,
        currency: 'GBP',
        durationMonths: course.durationMonths,
        officialUrl: `https://example-university.test/${course.courseId.toLowerCase()}`,
        highAcceptance: course.tuitionFee < 20000,
        verificationStatus: 'VERIFIED',
        publicationStatus: 'PUBLISHED',
        status: 'active',
        deadline: daysAhead(90).toISOString().slice(0, 10),
      },
      update: { tuitionFee: course.tuitionFee, studyLevel: course.studyLevel, subjectArea: course.subjectArea },
    });
    const existingRequirement = await db.crmCourseRequirement.findFirst({ where: { courseId: course.courseId }, select: { id: true } });
    const requirementData = {
      universityId: course.universityId,
      courseId: course.courseId,
      academicReq: course.studyLevel === 'Masters' ? 'Recognised bachelor degree, minimum CGPA 2.8' : 'HSC or equivalent, minimum GPA 3.5',
      minScore: course.studyLevel === 'Masters' ? '2.8' : '3.5',
      englishTest: 'IELTS',
      ieltsOverall: course.ielts,
      ieltsMinBand: 5.5,
      moiAccepted: course.ielts <= 6.0,
      officialRequirementUrl: `https://example-university.test/${course.courseId.toLowerCase()}/entry`,
      verificationStatus: 'VERIFIED',
    };
    if (existingRequirement) await db.crmCourseRequirement.update({ where: { id: existingRequirement.id }, data: requirementData });
    else await db.crmCourseRequirement.create({ data: requirementData });
  }

  const scholarships = [
    { universityId: 'AWF-UNI-UK-1', scholarshipName: 'Leeds International Excellence Scholarship', amount: 5000, levels: 'Masters', countries: 'Bangladesh,India,Nepal' },
    { universityId: 'AWF-UNI-UK-2', scholarshipName: 'Coventry Global Leaders Award', amount: 4000, levels: 'Masters,Bachelors', countries: 'Bangladesh,Pakistan' },
    { universityId: 'AWF-UNI-CA-1', scholarshipName: 'Windsor Entrance Award', amount: 3500, levels: 'Masters', countries: 'All' },
  ];
  for (const scholarship of scholarships) {
    const existing = await db.crmScholarship.findFirst({ where: { scholarshipName: scholarship.scholarshipName }, select: { id: true } });
    const data = {
      universityId: scholarship.universityId,
      scholarshipName: scholarship.scholarshipName,
      provider: 'University',
      eligibleCountries: scholarship.countries,
      eligibleLevels: scholarship.levels,
      scholarshipAmount: scholarship.amount,
      scholarshipCurrency: 'GBP',
      deadline: daysAhead(60).toISOString().slice(0, 10),
      officialScholarshipUrl: 'https://example-university.test/scholarships',
      expiryStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      status: 'active',
    };
    if (existing) await db.crmScholarship.update({ where: { id: existing.id }, data });
    else await db.crmScholarship.create({ data });
  }

  // ── Leads: a realistic spread so qualification produces real variance. ──
  const leads = [
    { leadId: 'AWF-TEST-LEAD-1', fullName: 'Rafiq Hasan', phone: '+8801711000001', email: 'rafiq.hasan@example.test', source: 'WEBSITE', preferredCountry: 'United Kingdom', preferredCourse: 'Business Analytics', preferredLevel: 'Masters', preferredIntake: 'September 2026', currentQualification: 'BBA', englishTest: 'IELTS', englishScore: '6.5', budget: '20000', cgpa: '3.4', notes: 'I want to apply urgently for the September intake and need help choosing a university.', age: 0 },
    { leadId: 'AWF-TEST-LEAD-2', fullName: 'Nusrat Jahan', phone: '+8801711000002', email: 'nusrat.jahan@example.test', source: 'REFERRAL', preferredCountry: 'Canada', preferredCourse: 'Computer Science', preferredLevel: 'Masters', preferredIntake: 'January 2027', currentQualification: 'BSc CSE', englishTest: 'IELTS', englishScore: '7.0', budget: '30000', cgpa: '3.7', notes: 'Looking for a masters in computing with scholarship options.', age: 1 },
    { leadId: 'AWF-TEST-LEAD-3', fullName: 'Tanvir Ahmed', phone: '+8801711000003', email: '', source: 'FACEBOOK', preferredCountry: 'United Kingdom', preferredCourse: '', preferredLevel: '', preferredIntake: '', currentQualification: 'HSC', englishTest: '', englishScore: '', budget: '', cgpa: '', notes: 'Please call me about study abroad.', age: 3 },
    { leadId: 'AWF-TEST-LEAD-4', fullName: 'Shamima Akter', phone: '+8801711000004', email: 'shamima@example.test', source: 'WALK_IN', preferredCountry: 'Australia', preferredCourse: 'Business Analytics', preferredLevel: 'Masters', preferredIntake: 'July 2026', currentQualification: 'BBA', englishTest: 'IELTS', englishScore: '6.0', budget: '35000', cgpa: '3.1', notes: 'Interested in Deakin and want to apply soon.', age: 2 },
    { leadId: 'AWF-TEST-LEAD-5', fullName: 'Imran Kabir', phone: '+8801711000005', email: 'imran.kabir@example.test', source: 'GOOGLE_ADS', preferredCountry: 'United Kingdom', preferredCourse: 'International Business', preferredLevel: 'Masters', preferredIntake: 'September 2026', currentQualification: 'BBA', englishTest: 'MOI', englishScore: '', budget: '18000', cgpa: '3.0', notes: 'Budget is limited, need an affordable university.', age: 5 },
    { leadId: 'AWF-TEST-LEAD-6', fullName: 'Sadia Rahman', phone: '+8801711000006', email: 'sadia.rahman@example.test', source: 'WEBSITE', preferredCountry: 'United Kingdom', preferredCourse: 'Data Science', preferredLevel: 'Masters', preferredIntake: 'September 2026', currentQualification: 'BSc Statistics', englishTest: 'IELTS', englishScore: '6.5', budget: '22000', cgpa: '3.6', notes: 'Ready to submit documents immediately.', age: 0 },
    { leadId: 'AWF-TEST-LEAD-7', fullName: 'Promotional Offer', phone: '+0000000000', email: 'promo@spam.test', source: 'OTHER', preferredCountry: '', preferredCourse: '', preferredLevel: '', preferredIntake: '', currentQualification: '', englishTest: '', englishScore: '', budget: '', cgpa: '', notes: 'Buy cheap followers now! Click this link for a free crypto giveaway.', age: 1 },
    { leadId: 'AWF-TEST-LEAD-8', fullName: 'Old Enquiry', phone: '+8801711000008', email: 'old.enquiry@example.test', source: 'FACEBOOK', preferredCountry: 'United Kingdom', preferredCourse: 'Business Management', preferredLevel: 'Bachelors', preferredIntake: '', currentQualification: 'HSC', englishTest: '', englishScore: '', budget: '', cgpa: '', notes: 'Enquired a long time ago about undergraduate study.', age: 120 },
    { leadId: 'AWF-TEST-LEAD-9', fullName: 'Mehedi Hasan', phone: '+8801711000009', email: 'mehedi@example.test', source: 'REFERRAL', preferredCountry: 'Canada', preferredCourse: 'Applied Computing', preferredLevel: 'Masters', preferredIntake: 'September 2026', currentQualification: 'BSc CSE', englishTest: 'IELTS', englishScore: '6.5', budget: '28000', cgpa: '3.5', notes: 'Referred by a current student, wants to apply this intake.', age: 1 },
    { leadId: 'AWF-TEST-LEAD-10', fullName: 'Farhana Islam', phone: '+8801711000010', email: 'farhana@example.test', source: 'WEBSITE', preferredCountry: 'United Kingdom', preferredCourse: 'Business Analytics', preferredLevel: 'Masters', preferredIntake: 'September 2026', currentQualification: 'BBA', englishTest: 'IELTS', englishScore: '6.0', budget: '19000', cgpa: '3.2', notes: 'Comparing Coventry and Leeds, needs a fee breakdown.', age: 2 },
    { leadId: 'AWF-TEST-LEAD-11', fullName: 'Arif Chowdhury', phone: '+8801711000011', email: 'arif@example.test', source: 'WEBSITE', preferredCountry: 'United Kingdom', preferredCourse: 'Computer Science', preferredLevel: 'Masters', preferredIntake: 'January 2027', currentQualification: 'BSc CSE', englishTest: 'IELTS', englishScore: '7.5', budget: '32000', cgpa: '3.8', notes: 'Strong profile, wants a ranked university.', age: 0 },
    { leadId: 'AWF-TEST-LEAD-12', fullName: 'Unreachable Enquiry', phone: '', email: '', source: 'OTHER', preferredCountry: 'United Kingdom', preferredCourse: 'Business', preferredLevel: 'Masters', preferredIntake: '', currentQualification: '', englishTest: '', englishScore: '', budget: '', cgpa: '', notes: 'No contact details were submitted with this enquiry.', age: 4 },
  ];
  const leadIds: string[] = [];
  for (const [index, lead] of leads.entries()) {
    const { age, ...rest } = lead;
    await db.lead.upsert({
      where: { leadId: lead.leadId },
      create: {
        ...rest,
        status: 'NEW',
        leadScore: 0,
        leadTier: 'COLD',
        counselorId: index % 3 === 0 ? users.counselor : index % 3 === 1 ? users.counselor2 : null,
        createdAt: daysAgo(age),
      },
      update: { status: 'NEW', leadScore: 0, leadTier: 'COLD' },
    });
    leadIds.push(lead.leadId);
  }

  // ── Students with full sub-profiles ──
  const studentSeeds = [
    { studentId: 'AWF-TEST-STUDENT-1', userId: users.student, name: 'Rafiq Hasan', email: 'rafiq.hasan@example.test', phone: '+8801711000001', counselorId: users.counselor, complete: 80 },
    { studentId: 'AWF-TEST-STUDENT-2', userId: users.student2, name: 'Nusrat Jahan', email: 'nusrat.jahan@example.test', phone: '+8801711000002', counselorId: users.counselor2, complete: 55 },
  ];
  const studentIds: string[] = [];
  for (const seed of studentSeeds) {
    const student = await db.student.upsert({
      where: { studentId: seed.studentId },
      create: {
        studentId: seed.studentId,
        userId: seed.userId,
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        status: 'ACTIVE',
        journeyStage: 'COUNSELLING',
        profileComplete: seed.complete,
        currentCountry: 'Bangladesh',
        currentCity: 'Dhaka',
        counselorId: seed.counselorId,
        counselorName: 'Senior Counsellor',
      },
      update: { profileComplete: seed.complete, counselorId: seed.counselorId },
    });
    studentIds.push(student.id);

    const hasEducation = await db.studentEducation.findFirst({ where: { studentId: student.id }, select: { id: true } });
    if (!hasEducation) {
      await db.studentEducation.create({
        data: { studentId: student.id, level: 'Bachelors', institution: 'University of Dhaka', degree: 'BBA', field: 'Business Administration', gpa: '3.4', startYear: '2019', endYear: '2023' },
      });
    }
    const hasEnglish = await db.studentEnglishTest.findFirst({ where: { studentId: student.id }, select: { id: true } });
    if (!hasEnglish) {
      await db.studentEnglishTest.create({
        data: { studentId: student.id, testType: 'IELTS', overallScore: 6.5, readingScore: 6.5, writingScore: 6.0, listeningScore: 7.0, speakingScore: 6.5, testDate: daysAgo(120).toISOString().slice(0, 10) },
      });
    }
    const hasPassport = await db.studentPassport.findFirst({ where: { studentId: student.id }, select: { id: true } });
    if (!hasPassport) {
      await db.studentPassport.create({
        data: { studentId: student.id, passportNumber: 'BD1234567', fullName: seed.name, nationality: 'Bangladeshi', dateOfBirth: '2001-04-12', expiryDate: daysAhead(900).toISOString().slice(0, 10), issueDate: daysAgo(900).toISOString().slice(0, 10) },
      });
    }
    const hasFunding = await db.studentFunding.findFirst({ where: { studentId: student.id }, select: { id: true } });
    if (!hasFunding) {
      await db.studentFunding.create({ data: { studentId: student.id, fundingType: 'family', sponsorName: 'Mr. Hasan', sponsorRelation: 'Father', sponsorIncome: '2500000' } });
    }
    const hasPreference = await db.studentAdmissionPreference.findFirst({ where: { studentId: student.id }, select: { id: true } });
    if (!hasPreference) {
      await db.studentAdmissionPreference.create({
        data: { studentId: student.id, preferredCountry: 'United Kingdom', preferredCourse: 'Business Analytics', preferredLevel: 'Masters', preferredIntake: 'September 2026', budgetRange: '20000', scholarshipNeed: true },
      });
    }

    const documents = [
      { category: 'PASSPORT', fileName: 'passport.pdf', status: 'VERIFIED' },
      { category: 'ACADEMIC_TRANSCRIPT', fileName: 'transcript.pdf', status: 'VERIFIED' },
      { category: 'IELTS', fileName: 'ielts-trf.pdf', status: 'PENDING' },
      { category: 'CV', fileName: 'cv.pdf', status: 'VERIFIED' },
    ];
    for (const document of documents) {
      const exists = await db.studentDocument.findFirst({ where: { studentId: student.id, category: document.category }, select: { id: true } });
      if (!exists) {
        await db.studentDocument.create({
          data: { studentId: student.id, category: document.category, fileName: document.fileName, fileUrl: `/uploads/${student.id}/${document.fileName}`, status: document.status },
        });
      }
    }
  }

  // ── Applications ──
  const applicationSeeds = [
    { applicationCode: 'AWF-TEST-APP-1', studentId: studentIds[0], universityName: 'University of Leeds', courseName: 'MSc Business Analytics and Decision Sciences', country: 'United Kingdom', intake: 'September 2026', level: 'Masters', counselorId: users.counselor },
    { applicationCode: 'AWF-TEST-APP-2', studentId: studentIds[1], universityName: 'University of Windsor', courseName: 'Master of Applied Computing', country: 'Canada', intake: 'January 2027', level: 'Masters', counselorId: users.counselor2 },
  ];
  const applicationIds: string[] = [];
  for (const seed of applicationSeeds) {
    const application = await db.application.upsert({
      where: { applicationCode: seed.applicationCode },
      create: {
        applicationCode: seed.applicationCode,
        studentId: seed.studentId,
        universityName: seed.universityName,
        courseName: seed.courseName,
        country: seed.country,
        intake: seed.intake,
        level: seed.level,
        counselorId: seed.counselorId,
        stage: 'DOCUMENT_COLLECTION',
        safeStatus: 'IN_PROGRESS',
        documentStatus: 'PARTIAL',
        deadline: daysAhead(21).toISOString().slice(0, 10),
        deadlineDate: daysAhead(21),
      },
      update: { documentStatus: 'PARTIAL', deadlineDate: daysAhead(21) },
    });
    applicationIds.push(application.applicationCode);

    const documents = [
      { documentType: 'PASSPORT', fileName: 'passport.pdf', status: 'VERIFIED' },
      { documentType: 'ACADEMIC_TRANSCRIPT', fileName: 'transcript.pdf', status: 'VERIFIED' },
      { documentType: 'STATEMENT_OF_PURPOSE', fileName: 'sop.pdf', status: 'PENDING' },
    ];
    for (const document of documents) {
      const exists = await db.applicationDocument.findFirst({ where: { applicationId: application.id, documentType: document.documentType }, select: { id: true } });
      if (!exists) {
        await db.applicationDocument.create({
          data: {
            applicationId: application.id,
            studentId: seed.studentId,
            documentType: document.documentType,
            fileName: document.fileName,
            fileUrl: `/uploads/${application.id}/${document.fileName}`,
            status: document.status,
            visibility: 'internal',
          },
        });
      }
    }
  }

  return { users, leadIds, studentIds, applicationIds, universityIds: universities.map((row) => row.universityId), courseIds: courses.map((row) => row.courseId) };
}

export async function fixtureCounts() {
  const [users, leads, students, applications, universities, courses, requirements, scholarships, documents] = await Promise.all([
    db.user.count(),
    db.lead.count(),
    db.student.count(),
    db.application.count(),
    db.crmUniversity.count(),
    db.crmCourse.count(),
    db.crmCourseRequirement.count(),
    db.crmScholarship.count(),
    db.studentDocument.count(),
  ]);
  return { users, leads, students, applications, universities, courses, requirements, scholarships, documents };
}
