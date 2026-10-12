// ALO Education - Database seed with realistic Bangladeshi student data
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const COUNTRIES = ["UK", "USA", "Canada", "Australia", "Germany", "Ireland", "Malaysia"];
const UNIVERSITIES = [
  { name: "University of Greenwich", country: "UK", course: "MSc Computer Science" },
  { name: "Coventry University", country: "UK", course: "MSc Data Science" },
  { name: "University of East London", country: "UK", course: "MBA" },
  { name: "University of Windsor", country: "Canada", course: "MEng Electrical" },
  { name: "Fanshawe College", country: "Canada", course: "PG Diploma Business" },
  { name: "University of Technology Sydney", country: "Australia", course: "MIT" },
  { name: "University of New South Wales", country: "Australia", course: "Master of Commerce" },
  { name: "TU Munich", country: "Germany", course: "MS Informatics" },
  { name: "Trinity College Dublin", country: "Ireland", course: "MSc Computer Science" },
  { name: "Taylor's University", country: "Malaysia", course: "BBA" },
];

const STUDENT_NAMES = [
  { first: "Tanvir", last: "Ahmed" },
  { first: "Sadia", last: "Islam" },
  { first: "Rakib", last: "Hasan" },
  { first: "Nusrat", last: "Jahan" },
  { first: "Sabbir", last: "Rahman" },
  { first: "Fariha", last: "Chowdhury" },
  { first: "Imran", last: "Kabir" },
  { first: "Mehzabin", last: "Haq" },
  { first: "Arif", last: "Hossain" },
  { first: "Sumaiya", last: "Akter" },
  { first: "Shadman", last: "Sakib" },
  { first: "Tasnim", last: "Binte" },
];

const LEAD_SOURCES = ["WEBSITE", "WHATSAPP", "SMS", "FACEBOOK", "INSTAGRAM", "PHONE_CALL", "PARTNER_REFERRAL", "OFFICE_VISIT", "EVENT", "MOCK_TEST"];
const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "DUPLICATE"];
const APP_STAGES = ["COUNSELING", "ELIGIBILITY_CHECKED", "DOCUMENTS_PENDING", "DOCUMENTS_RECEIVED", "UNIVERSITY_SHORTLISTED", "APPLICATION_PREPARING", "APPLICATION_SUBMITTED", "CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER", "DEPOSIT_PENDING", "CAS_INTERVIEW", "CAS_PENDING", "CAS_ISSUED", "VISA_DOCUMENTS", "VISA_SUBMITTED", "VISA_DECISION_PENDING", "VISA_APPROVED", "VISA_REFUSED", "PRE_DEPARTURE", "ENROLLED"];

const DOC_CATEGORIES = [
  { category: "PASSPORT", name: "Passport", required: true },
  { category: "NID", name: "National ID / Birth Certificate", required: true },
  { category: "ACADEMIC_CERT", name: "Academic Certificates", required: true },
  { category: "TRANSCRIPT", name: "Academic Transcripts", required: true },
  { category: "CV", name: "Curriculum Vitae", required: true },
  { category: "SOP", name: "Statement of Purpose", required: true },
  { category: "BANK_STATEMENT", name: "Bank Statement", required: true },
  { category: "SPONSOR_DOC", name: "Sponsor Documents", required: false },
  { category: "IELTS_CERT", name: "English Test Certificate", required: true },
  { category: "VISA_DOC", name: "Visa Application Documents", required: false },
];

const AI_DEPARTMENTS = [
  "Student Admission", "Counseling", "Application", "Visa", "Marketing", "WhatsApp",
  "Social Media", "English Test", "AI Interview", "Document Checking", "SOP/CV",
  "University Data", "Course Finder", "Finance", "HRM", "Reports", "Security/RBAC", "Audit",
];

function rid(len = 5) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function educationHistory(level: string) {
  return JSON.stringify([
    {
      level: "SSC",
      instituteName: "Ideal School & College",
      board: "Dhaka",
      country: "Bangladesh",
      city: "Dhaka",
      group: "Science",
      resultType: "GPA",
      grade: "5.00",
      startYear: "2014",
      endYear: "2016",
    },
    {
      level: "HSC",
      instituteName: "Notre Dame College",
      board: "Dhaka",
      country: "Bangladesh",
      city: "Dhaka",
      group: "Science",
      resultType: "GPA",
      grade: "5.00",
      startYear: "2016",
      endYear: "2018",
    },
    {
      level,
      instituteName: level.startsWith("Bachelor") ? "BRAC University" : "University of Dhaka",
      board: "",
      country: "Bangladesh",
      city: "Dhaka",
      group: "Computer Science",
      resultType: "CGPA",
      grade: pick(["3.45", "3.62", "3.78", "3.21", "3.55", "3.89"]),
      startYear: "2018",
      endYear: level === "Bachelor 4 years" ? "2022" : "2021",
      studyGap: "None",
    },
  ]);
}

async function main() {
  console.log("Seeding ALO Education database...");

  // Clean
  await db.auditLog.deleteMany();
  await db.timelineEvent.deleteMany();
  await db.payment.deleteMany();
  await db.visaCase.deleteMany();
  await db.mockTest.deleteMany();
  await db.interviewSession.deleteMany();
  await db.application.deleteMany();
  await db.document.deleteMany();
  await db.campaign.deleteMany();
  await db.aiAgent.deleteMany();
  await db.student.deleteMany();
  await db.lead.deleteMany();
  await db.user.deleteMany();

  // === USERS ===
  const users = [
    { email: "superadmin@aloedu.com", name: "Super Admin", role: "SUPER_ADMIN", permissions: '["*"]' },
    { email: "admin@aloedu.com", name: "Admin User", role: "ADMIN", permissions: '["*"]' },
    { email: "counselor@aloedu.com", name: "Farhana Yesmin", role: "COUNSELOR", permissions: '["students.view","students.create","students.update","students.assign","documents.upload"]' },
    { email: "counselor2@aloedu.com", name: "Rashed Khan", role: "COUNSELOR", permissions: '["students.view","students.create","students.update"]' },
    { email: "appteam@aloedu.com", name: "Application Team", role: "APPLICATION_TEAM", permissions: '["students.view","applications.updateStatus","documents.upload"]' },
    { email: "visa@aloedu.com", name: "Visa Officer", role: "VISA_OFFICER", permissions: '["students.view","visa.dashboard.view","visa.status.update"]' },
    { email: "interview@aloedu.com", name: "Visa Interview Officer", role: "VISA_INTERVIEW_OFFICER", permissions: '["students.view","visa.dashboard.view","visa.interviews.create"]' },
    { email: "marketing@aloedu.com", name: "Marketing Manager", role: "MARKETING_MANAGER", permissions: '["marketing.dashboard.view","marketing.campaigns.create"]' },
    { email: "finance@aloedu.com", name: "Finance Team", role: "FINANCE", permissions: '["students.view","commission.approve","salary.view"]' },
    { email: "partner@aloedu.com", name: "Dhaka Partner", role: "PARTNER", permissions: '["students.view"]', status: "ACTIVE" },
    { email: "trainer@aloedu.com", name: "English Trainer", role: "ENGLISH_TRAINER", permissions: '["students.view"]' },
  ];
  const userMap: Record<string, any> = {};
  for (const u of users) {
    const user = await db.user.create({ data: { ...u, phone: "+8801" + rid(9).slice(0, 9) } });
    userMap[u.role] = user;
  }

  // === LEADS ===
  const leads: any[] = [];
  for (let i = 0; i < 24; i++) {
    const name = pick(STUDENT_NAMES);
    const source = pick(LEAD_SOURCES);
    const status = pick(LEAD_STATUSES);
    const phone = "+8801" + (900000000 + Math.floor(Math.random() * 99999999));
    const lead = await db.lead.create({
      data: {
        leadId: `ALO-L-${(10001 + i).toString()}`,
        fullName: `${name.first} ${name.last}`,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i}@gmail.com`,
        phone,
        source,
        sourceDetail: source === "PARTNER_REFERRAL" ? "Dhaka Partner" : source === "EVENT" ? "Study UK Fair 2024" : source === "MOCK_TEST" ? "Free IELTS Mock" : "Facebook Campaign",
        preferredCountry: pick(COUNTRIES),
        preferredCourse: pick(["Computer Science", "Business Administration", "Data Science", "Engineering", "MBA"]),
        notes: i % 3 === 0 ? "Interested in September intake" : "Needs counseling session",
        counselorId: i % 2 === 0 ? userMap.COUNSELOR.id : userMap.COUNSELOR?.id,
        status,
        welcomeSent: Math.random() > 0.4,
      },
    });
    leads.push(lead);
  }

  // === STUDENTS ===
  const students: any[] = [];
  for (let i = 0; i < 12; i++) {
    const name = STUDENT_NAMES[i];
    const uni = pick(UNIVERSITIES);
    const level = pick(["Bachelor 4 years", "Postgraduate / Masters"]);
    const stage = pick(APP_STAGES.slice(2, 14));
    const completion = 40 + Math.floor(Math.random() * 60);
    const hasPassport = Math.random() > 0.2;
    const hasPrevRefusal = i % 5 === 0;
    const student = await db.student.create({
      data: {
        studentId: `ALO-S-${(20001 + i).toString()}`,
        leadId: leads[i].id,
        firstName: name.first,
        lastName: name.last,
        fullName: `${name.first} ${name.last}`,
        nationality: "Bangladeshi",
        dateOfBirth: `${1996 + (i % 6)}-0${(i % 9) + 1}-1${i % 9}`,
        gender: i % 2 === 0 ? "Male" : "Female",
        maritalStatus: i % 3 === 0 ? "Married" : "Single",
        cityOfBirth: pick(["Dhaka", "Chittagong", "Sylhet", "Khulna", "Rajshahi"]),
        countryOfBirth: "Bangladesh",
        presentAddress: `House ${i + 12}, Road ${i + 5}, ${pick(["Dhanmondi", "Gulshan", "Banani", "Uttara"])}, Dhaka`,
        permanentAddress: `Village ${pick(["Mirpur", "Bashundhara", "Mohakhali"])}, Dhaka, Bangladesh`,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i}@gmail.com`,
        mobile: "+8801" + (900000000 + Math.floor(Math.random() * 99999999)),
        emergencyName: pick(["Mohammed Father", "Mrs. Mother", "Elder Brother"]),
        emergencyRelation: pick(["Father", "Mother", "Brother"]),
        emergencyPhone: "+8801" + (800000000 + Math.floor(Math.random() * 99999999)),
        educationHistory: educationHistory(level),
        hasPassport,
        passportNumber: hasPassport ? `BR0${rid(7)}` : null,
        passportIssuePlace: hasPassport ? "Dhaka" : null,
        passportIssueCountry: hasPassport ? "Bangladesh" : null,
        passportIssueDate: hasPassport ? "2022-03-15" : null,
        passportExpiryDate: hasPassport ? "2032-03-14" : null,
        englishTests: JSON.stringify([
          {
            testName: "IELTS",
            testDate: "2024-02-10",
            overallScore: pick(["6.0", "6.5", "7.0", "6.5"]),
            listening: pick(["6.0", "6.5", "7.0"]),
            reading: pick(["6.0", "6.5", "7.5"]),
            writing: pick(["5.5", "6.0", "6.5"]),
            speaking: pick(["6.0", "6.5", "7.0"]),
            certificateNo: `IELTS-${rid(8)}`,
          },
        ]),
        englishTestStatus: "RECEIVED",
        workExperience: i % 2 === 0 ? JSON.stringify([{ company: "Brain Station 23", designation: "Software Engineer", startDate: "2022-01", endDate: "2024-01", currentlyWorking: false }]) : "[]",
        hasPreviousVisa: hasPrevRefusal,
        visaHistory: hasPrevRefusal ? JSON.stringify([{ visaType: "Student Visa", country: "UK", refusalDate: "2023-06-20", refusalReason: "Financial documents insufficient" }]) : "[]",
        previousRefusal: hasPrevRefusal,
        refusalDetail: hasPrevRefusal ? "UK student visa refused due to insufficient funds evidence" : null,
        fundingStatus: pick(["SELF_FUNDED", "LOAN_SUPPORT", "SPONSOR"]),
        sponsorRelation: pick(["APPLICANT", "PARENTS", "SIBLING"]),
        bankStatementStatus: pick(["NOT_STARTED", "IN_PROGRESS", "READY"]),
        sponsorDocStatus: pick(["NOT_STARTED", "READY"]),
        studyDestination: uni.country,
        programTitle: uni.course,
        studyLevel: level.startsWith("Bachelor") ? "Bachelor" : "Masters",
        studyArea: "Computer Science",
        intake: pick(["September 2024", "January 2025", "May 2025"]),
        universityPreference: uni.name,
        profileCompletion: completion,
        counselorId: userMap.COUNSELOR.id,
        partnerId: i % 4 === 0 ? userMap.PARTNER.id : null,
      },
    });
    students.push(student);

    // Documents for this student
    for (const d of DOC_CATEGORIES) {
      const status = pick(["PENDING", "UPLOADED", "APPROVED", "REJECTED", "UPLOADED", "APPROVED"]);
      await db.document.create({
        data: {
          studentId: student.id,
          category: d.category,
          name: d.name,
          required: d.required,
          status,
          fileName: status !== "PENDING" ? `${d.category.toLowerCase()}_${student.studentId}.pdf` : null,
          fileType: "application/pdf",
          fileSize: status !== "PENDING" ? 240000 + Math.floor(Math.random() * 500000) : null,
          storagePath: status !== "PENDING" ? `/private/docs/${student.id}/${d.category.toLowerCase()}.pdf` : null,
          rejectionReason: status === "REJECTED" ? "Document is not clear, please re-upload a high-resolution scan" : null,
          reviewedById: status === "APPROVED" || status === "REJECTED" ? userMap.APPTeam?.id || userMap.ADMIN.id : null,
          reviewedAt: status === "APPROVED" || status === "REJECTED" ? new Date() : null,
          uploadedAt: status !== "PENDING" ? new Date() : null,
        },
      });
    }

    // Application
    const appStage = pick(APP_STAGES.slice(2, 16));
    await db.application.create({
      data: {
        applicationId: `ALO-APP-${(30001 + i).toString()}`,
        studentId: student.id,
        university: uni.name,
        course: uni.course,
        country: uni.country,
        intake: pick(["September 2024", "January 2025"]),
        studyLevel: level.startsWith("Bachelor") ? "Bachelor" : "Masters",
        deadline: "2024-06-30",
        counselorId: userMap.COUNSELOR.id,
        appTeamOfficerId: userMap.APPLICATION_TEAM?.id,
        visaOfficerId: userMap.VISA_OFFICER?.id,
        stage: appStage,
        priority: pick(["NORMAL", "HIGH", "URGENT", "NORMAL"]),
      },
    });

    // Visa case for those further along
    if (["CAS_ISSUED", "VISA_DOCUMENTS", "VISA_SUBMITTED", "VISA_DECISION_PENDING", "VISA_APPROVED"].includes(appStage)) {
      const visaStage = appStage === "VISA_APPROVED" ? "VISA_APPROVED" : appStage === "VISA_SUBMITTED" ? "VISA_SUBMITTED" : appStage === "VISA_DECISION_PENDING" ? "VISA_DECISION_PENDING" : "VISA_DOCUMENTS";
      await db.visaCase.create({
        data: {
          caseId: `ALO-V-${(40001 + i).toString()}`,
          studentId: student.id,
          country: uni.country,
          university: uni.name,
          course: uni.course,
          intake: "September 2024",
          casStatus: "ISSUED",
          visaStage,
          interviewStatus: pick(["NOT_SCHEDULED", "SCHEDULED", "COMPLETED"]),
          interviewDate: "2024-08-15",
          docStatus: pick(["PENDING", "READY", "READY"]),
          assignedOfficerId: userMap.VISA_OFFICER?.id,
          priority: pick(["NORMAL", "HIGH"]),
          deadline: "2024-09-01",
          aiReadinessScore: 55 + Math.floor(Math.random() * 40),
          financialRisk: pick(["LOW", "MEDIUM", "HIGH"]),
          studyGapRisk: pick(["LOW", "MEDIUM"]),
          sponsorRisk: pick(["LOW", "MEDIUM", "HIGH"]),
        },
      });
    }

    // Interview session
    if (i % 2 === 0) {
      await db.interviewSession.create({
        data: {
          sessionId: `IV-${rid(8)}`,
          studentId: student.id,
          type: pick(["UNIVERSITY_CREDIBILITY", "VISA_INTERVIEW", "PRE_CAS"]),
          status: "COMPLETED",
          transcript: JSON.stringify([
            { q: "Why did you choose this university?", a: "I chose it because of its strong CS program and industry connections." },
            { q: "Why not study in Bangladesh?", a: "The research facilities and global exposure are better abroad." },
          ]),
          scores: JSON.stringify({ communication: 7, confidence: 8, courseKnowledge: 7, universityKnowledge: 6, financialExplanation: 8, sponsorExplanation: 7, studyGapExplanation: 9, futurePlanClarity: 7, visaRisk: "LOW", overallReadiness: 76 }),
          readiness: pick(["ready", "needs_practice", "ready"]),
          riskLevel: pick(["LOW", "MEDIUM"]),
          feedback: "Good communication. Improve knowledge of specific course modules.",
          completedAt: new Date(),
        },
      });
    }

    // Mock test
    await db.mockTest.create({
      data: {
        testId: `MT-${rid(8)}`,
        studentId: student.id,
        testType: pick(["IELTS", "PTE", "DET"]),
        isFree: i < 3,
        status: "COMPLETED",
        overallScore: pick([6, 6.5, 7, 6.5]),
        listeningScore: pick([6, 6.5, 7, 7.5]),
        readingScore: pick([6, 6.5, 7]),
        writingScore: pick([5.5, 6, 6.5]),
        speakingScore: pick([6, 6.5, 7]),
        weakAreas: JSON.stringify(["Writing Task 2 structure", "Speaking Part 3 fluency"]),
        completedAt: new Date(),
      },
    });

    // Payment
    await db.payment.create({
      data: {
        paymentId: `PAY-${rid(8)}`,
        studentId: student.id,
        type: pick(["APPLICATION_FEE", "DEPOSIT", "SERVICE_CHARGE", "MOCK_TEST"]),
        amount: pick([1500, 5000, 25000, 500]),
        currency: "BDT",
        status: pick(["PAID", "PENDING", "PAID"]),
        method: pick(["BANK_TRANSFER", "MOBILE_BANKING", "CASH"]),
        partnerId: i % 4 === 0 ? userMap.PARTNER.id : null,
        commissionAmount: i % 4 === 0 ? 15000 : null,
        commissionStatus: i % 4 === 0 ? pick(["PENDING", "APPROVED", "PAID"]) : null,
      },
    });

    // Timeline events
    const events = [
      { type: "LEAD_CREATED", title: "Lead created", description: `Lead came via ${leads[i].source}`, offset: 30 },
      { type: "PROFILE_UPDATED", title: "Student profile created", description: "Counselor created full student profile", offset: 28 },
      { type: "DOC_UPLOADED", title: "Passport uploaded", description: "Student uploaded passport copy", offset: 20 },
      { type: "AI_ACTION", title: "AI course matching", description: "AI suggested 3 universities based on profile", offset: 15 },
      { type: "APP_STATUS_CHANGED", title: "Application submitted", description: `Application submitted to ${uni.name}`, offset: 10 },
      { type: "INTERVIEW_COMPLETED", title: "AI interview completed", description: "Visa interview practice - readiness 76%", offset: 5 },
    ];
    for (const e of events) {
      await db.timelineEvent.create({
        data: {
          studentId: student.id,
          userId: userMap.COUNSELOR.id,
          type: e.type,
          title: e.title,
          description: e.description,
          createdAt: new Date(Date.now() - e.offset * 86400000),
        },
      });
    }
  }

  // === CAMPAIGNS ===
  const campaigns = [
    { name: "Study UK September Intake", channel: "FACEBOOK", budget: 150000, spent: 89000, leads: 145, conversions: 22 },
    { name: "Free IELTS Mock Test Drive", channel: "FACEBOOK", budget: 60000, spent: 45000, leads: 210, conversions: 38 },
    { name: "Canada Study Permit Webinar", channel: "WEBSITE", budget: 30000, spent: 18000, leads: 67, conversions: 12 },
    { name: "WhatsApp Broadcast - Australia", channel: "WHATSAPP", budget: 10000, spent: 7500, leads: 89, conversions: 15 },
    { name: "Instagram Reels - Germany", channel: "INSTAGRAM", budget: 25000, spent: 21000, leads: 54, conversions: 7 },
    { name: "Scholarship Campaign Ireland", channel: "GOOGLE", budget: 80000, spent: 52000, leads: 98, conversions: 19 },
  ];
  for (const c of campaigns) {
    await db.campaign.create({
      data: {
        name: c.name,
        channel: c.channel,
        status: pick(["ACTIVE", "COMPLETED", "ACTIVE"]),
        budget: c.budget,
        spent: c.spent,
        leadsCount: c.leads,
        conversionsCount: c.conversions,
        startDate: "2024-01-15",
        endDate: "2024-12-31",
      },
    });
  }

  // === AI AGENTS ===
  const agentRoles: Record<string, string[]> = {
    "Student Admission": ["Lead Intake Agent", "Duplicate Checker", "Profile Completer"],
    "Counseling": ["Course Matcher", "University Advisor", "Intake Planner"],
    "Application": ["Application Drafter", "Deadline Tracker", "Status Updater"],
    "Visa": ["Visa Checklist Generator", "Visa Readiness Scorer", "Refusal Analyzer"],
    "Marketing": ["Lead Scorer", "Campaign Optimizer", "Content Planner"],
    "WhatsApp": ["Auto Reply Agent", "Broadcast Sender", "Lead Capture Bot"],
    "Social Media": ["Comment-to-Lead", "DM Responder", "Sentiment Analyzer"],
    "English Test": ["Mock Test Generator", "Auto Scorer", "Weak Area Analyzer"],
    "AI Interview": ["Interview Questioner", "Answer Evaluator", "Risk Assessor"],
    "Document Checking": ["OCR Extractor", "Fraud Detector", "Completeness Checker"],
    "SOP/CV": ["SOP Draft Writer", "CV Improver", "Grammar Corrector"],
    "University Data": ["Requirement Sync", "Deadline Sync", "Scholarship Finder"],
    "Course Finder": ["Course Matcher", "Eligibility Checker", "Compare Builder"],
    "Finance": ["Commission Calculator", "Payment Reminder", "Invoice Generator"],
    "HRM": ["Attendance Tracker", "Performance Scorer", "Task Allocator"],
    "Reports": ["Daily Report Builder", "Conversion Analyzer", "Forecast Generator"],
    "Security/RBAC": ["Permission Auditor", "Anomaly Detector", "Session Manager"],
    "Audit": ["Log Aggregator", "Compliance Checker", "Alert Generator"],
  };
  let code = 1000;
  for (const dept of AI_DEPARTMENTS) {
    for (const agentName of agentRoles[dept] || []) {
      code++;
      await db.aiAgent.create({
        data: {
          department: dept,
          agentName,
          agentCode: `AI-${code}`,
          description: `${agentName} for ${dept} department`,
          status: pick(["ACTIVE", "ACTIVE", "IDLE"]),
          jobsProcessed: Math.floor(Math.random() * 5000),
          pendingApprovals: Math.floor(Math.random() * 8),
          lastRunAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        },
      });
    }
  }

  // === AUDIT LOGS ===
  const auditActions = ["LOGIN", "LOGOUT", "DOC_UPLOAD", "DOC_APPROVE", "APP_STATUS_CHANGE", "AI_ACTION", "PROFILE_UPDATE", "MESSAGE_ACTION"];
  for (let i = 0; i < 30; i++) {
    await db.auditLog.create({
      data: {
        userId: pick(Object.values(userMap)).id,
        action: pick(auditActions),
        resource: pick(["Student", "Document", "Application", "VisaCase"]),
        resourceId: rid(8),
        details: JSON.stringify({ note: "Automated audit entry" }),
        ipAddress: `103.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
      },
    });
  }

  console.log("Seed complete!");
  console.log(`- Users: ${await db.user.count()}`);
  console.log(`- Leads: ${await db.lead.count()}`);
  console.log(`- Students: ${await db.student.count()}`);
  console.log(`- Documents: ${await db.document.count()}`);
  console.log(`- Applications: ${await db.application.count()}`);
  console.log(`- Visa Cases: ${await db.visaCase.count()}`);
  console.log(`- Mock Tests: ${await db.mockTest.count()}`);
  console.log(`- Interview Sessions: ${await db.interviewSession.count()}`);
  console.log(`- Campaigns: ${await db.campaign.count()}`);
  console.log(`- AI Agents: ${await db.aiAgent.count()}`);
  console.log(`- Timeline Events: ${await db.timelineEvent.count()}`);
  console.log(`- Audit Logs: ${await db.auditLog.count()}`);
  console.log(`- Payments: ${await db.payment.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
