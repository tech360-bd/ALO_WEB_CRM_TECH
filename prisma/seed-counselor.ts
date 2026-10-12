// ALO Education - Counselor portal & employee data seed
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const J = (v: any) => JSON.stringify(v);

function rid(len = 5) { return Math.random().toString(36).slice(2, 2 + len).toUpperCase(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const PERMISSION_MATRIX = [
  // Student module
  { module: "Student", feature: "students.view_assigned", action: "view", description: "View assigned students", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Student", feature: "students.view_all", action: "view", description: "View all company students", defaultRoles: ["ADMIN", "SUPER_ADMIN"] },
  { module: "Student", feature: "students.view_partner_referred", action: "view", description: "View partner-referred students", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Student", feature: "students.update_assigned", action: "update", description: "Update assigned student profiles", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Student", feature: "students.export", action: "export", description: "Export student data", defaultRoles: ["ADMIN", "SUPER_ADMIN"] },
  { module: "Student", feature: "students.view_internal_notes", action: "view", description: "View internal comments", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Student", feature: "students.view_private_notes", action: "view", description: "View private/finance notes", defaultRoles: ["FINANCE", "SUPER_ADMIN"] },
  // Documents
  { module: "Documents", feature: "documents.view", action: "view", description: "View student documents", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.upload_on_behalf", action: "create", description: "Upload documents on behalf of student", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.request", action: "create", description: "Request documents from student", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.review", action: "update", description: "Review uploaded documents", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.approve", action: "approve", description: "Approve documents", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.reject", action: "update", description: "Reject documents", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.download", action: "download", description: "Download documents", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.delete", action: "update", description: "Delete documents (restricted)", defaultRoles: ["SUPER_ADMIN"] },
  { module: "Documents", feature: "documents.archive", action: "update", description: "Archive documents", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  // Communication
  { module: "Communication", feature: "communication.view_assigned", action: "view", description: "View assigned conversations", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.send_whatsapp", action: "create", description: "Send WhatsApp messages", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.send_email", action: "create", description: "Send emails", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.send_sms", action: "create", description: "Send SMS", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.use_ai_reply", action: "create", description: "Use AI suggested replies", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.approve_ai_reply", action: "approve", description: "Approve AI replies for sending", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.internal_comment", action: "create", description: "Add internal comments", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "FINANCE", "ADMIN", "SUPER_ADMIN"] },
  { module: "Communication", feature: "communication.student_visible_comment", action: "create", description: "Add student-visible comments", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  // Application
  { module: "Application", feature: "applications.view_assigned", action: "view", description: "View assigned applications", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Application", feature: "applications.create_draft", action: "create", description: "Create application drafts", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Application", feature: "applications.update_stage", action: "update", description: "Update application stage", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Application", feature: "applications.submit_to_university", action: "create", description: "Submit applications to universities", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Application", feature: "applications.view_partner_submission_channel", action: "view", description: "View partner submission channel", defaultRoles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"] },
  { module: "Application", feature: "applications.view_commission_amount", action: "view", description: "View commission amount (restricted)", defaultRoles: ["FINANCE", "SUPER_ADMIN"] },
  // Visa
  { module: "Visa", feature: "visa.view", action: "view", description: "View visa cases", defaultRoles: ["VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Visa", feature: "visa.comment_internal", action: "create", description: "Add visa internal comments", defaultRoles: ["VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Visa", feature: "visa.request_documents", action: "create", description: "Request visa documents", defaultRoles: ["VISA_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Visa", feature: "visa.interview_schedule", action: "create", description: "Schedule visa interviews", defaultRoles: ["VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Visa", feature: "visa.readiness_view", action: "view", description: "View visa readiness scores", defaultRoles: ["VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Visa", feature: "visa.status_update", action: "update", description: "Update visa status", defaultRoles: ["VISA_OFFICER", "ADMIN", "SUPER_ADMIN"] },
  // Marketing
  { module: "Marketing", feature: "marketing.dashboard.view", action: "view", description: "View marketing dashboard", defaultRoles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.content.generate", action: "create", description: "Generate marketing content with AI", defaultRoles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.image.generate_request", action: "create", description: "Request AI image generation", defaultRoles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.video.generate_request", action: "create", description: "Request AI video generation", defaultRoles: ["MARKETING_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.social.reply", action: "create", description: "Reply to social media comments", defaultRoles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.auto_post", action: "create", description: "Auto-post to social channels", defaultRoles: ["MARKETING_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.comment_to_lead", action: "create", description: "Convert social comments to leads", defaultRoles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.approve_ai_content", action: "approve", description: "Approve AI-generated content", defaultRoles: ["MARKETING_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Marketing", feature: "marketing.reports.view", action: "view", description: "View marketing reports", defaultRoles: ["MARKETING_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  // HR Self
  { module: "HR Self", feature: "employee.self_profile.view", action: "view", description: "View own employee profile", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "MARKETING_MANAGER", "MARKETING", "FINANCE", "ADMIN", "SUPER_ADMIN"] },
  { module: "HR Self", feature: "employee.self_attendance.view", action: "view", description: "View own attendance", defaultRoles: ["COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "MARKETING_MANAGER", "MARKETING", "FINANCE", "ADMIN", "SUPER_ADMIN"] },
  { module: "HR Self", feature: "employee.self_commission.view", action: "view", description: "View own commission", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "HR Self", feature: "employee.self_bonus.view", action: "view", description: "View own bonus", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "HR Self", feature: "employee.self_increment.view", action: "view", description: "View own increment history", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "HR Self", feature: "employee.self_salary.view", action: "view", description: "View own salary", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  { module: "HR Self", feature: "employee.self_documents.view", action: "view", description: "View own HR documents", defaultRoles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN"] },
  // Private HR
  { module: "Private HR", feature: "hr.salary.manage", action: "update", description: "Manage all employee salaries", defaultRoles: ["HR_MANAGER", "SUPER_ADMIN"] },
  { module: "Private HR", feature: "hr.increment.manage", action: "create", description: "Manage increments", defaultRoles: ["HR_MANAGER", "SUPER_ADMIN"] },
  { module: "Private HR", feature: "hr.bonus.manage", action: "create", description: "Manage bonuses", defaultRoles: ["HR_MANAGER", "SUPER_ADMIN"] },
  { module: "Private HR", feature: "hr.attendance.manage", action: "update", description: "Manage all attendance", defaultRoles: ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"] },
  { module: "Private HR", feature: "hr.performance.manage", action: "update", description: "Manage performance scores", defaultRoles: ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"] },
];

async function main() {
  console.log("Seeding counselor portal & employee data...");

  // Clean
  await db.applicationStageHistory.deleteMany();
  await db.weeklyReport.deleteMany();
  await db.aiReplyLog.deleteMany();
  // creativeAsset / contentCalendar models were replaced by the Marketing*
  // models (MarketingAsset / MarketingCalendar), seeded by seed-marketing.ts.
  await db.cvDraft.deleteMany();
  await db.sopDraft.deleteMany();
  await db.studentVisibleComment.deleteMany();
  await db.internalComment.deleteMany();
  await db.partnerEmailUpdate.deleteMany();
  await db.communicationMessage.deleteMany();
  await db.slaEvent.deleteMany();
  await db.appointment.deleteMany();
  await db.task.deleteMany();
  await db.rolePermission.deleteMany();
  await db.permission.deleteMany();
  await db.employeePerformance.deleteMany();
  await db.employeeIncrement.deleteMany();
  await db.employeeBonus.deleteMany();
  await db.employeeCommission.deleteMany();
  await db.employeeAttendance.deleteMany();
  await db.employeeHR.deleteMany();

  // === PERMISSIONS ===
  const permMap: Record<string, any> = {};
  for (const p of PERMISSION_MATRIX) {
    // Permission model no longer carries defaultRoles — role grants live in
    // RolePermission rows created below.
    const perm = await db.permission.create({
      data: { module: p.module, feature: p.feature, action: p.action, description: p.description },
    });
    permMap[`${p.module}.${p.feature}.${p.action}`] = perm;
    // Grant to default roles
    for (const role of p.defaultRoles) {
      const scope = role === "SUPER_ADMIN" || role === "ADMIN" ? "ALL" : "ASSIGNED_ONLY";
      try {
        await db.rolePermission.create({ data: { role, permissionId: perm.id, scope, grantedBy: "system" } });
      } catch {}
    }
  }
  console.log(`Seeded ${PERMISSION_MATRIX.length} permissions`);

  // === EMPLOYEES (HR profiles for existing users) ===
  const users = await db.user.findMany();
  const designations: Record<string, { designation: string; department: string; salary: number }> = {
    SUPER_ADMIN: { designation: "Super Administrator", department: "Management", salary: 120000 },
    ADMIN: { designation: "System Administrator", department: "Management", salary: 85000 },
    COUNSELOR: { designation: "Senior Counselor", department: "Counseling", salary: 45000 },
    APPLICATION_TEAM: { designation: "Application Officer", department: "Application Processing", salary: 40000 },
    VISA_OFFICER: { designation: "Visa Officer", department: "Visa Processing", salary: 50000 },
    VISA_INTERVIEW_OFFICER: { designation: "Visa Interview Officer", department: "Visa Interview", salary: 48000 },
    MARKETING_MANAGER: { designation: "Marketing Manager", department: "Marketing", salary: 65000 },
    FINANCE: { designation: "Finance Officer", department: "Finance", salary: 55000 },
    PARTNER: { designation: "Partner", department: "Partner Network", salary: 0 },
    ENGLISH_TRAINER: { designation: "English Trainer", department: "English Training", salary: 38000 },
  };

  let empCounter = 0;
  const empMap: Record<string, any> = {};
  for (const u of users) {
    const cfg = designations[u.role] || { designation: "Staff", department: "Operations", salary: 35000 };
    empCounter++;
    const emp = await db.employeeHR.create({
      data: {
        userId: u.id,
        employeeId: `AE-EMP-${(1001 + empCounter).toString()}`,
        officialEmail: u.email,
        officialPhone: u.phone || "+8801800000000",
        branch: pick(["Dhaka HQ", "Chattogram Branch", "Sylhet Branch"]),
        designation: cfg.designation,
        department: cfg.department,
        joiningDate: pick(["2022-01-15", "2023-03-01", "2023-07-10", "2024-01-20"]),
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        baseSalary: cfg.salary,
        performanceScore: 60 + Math.floor(Math.random() * 35),
        targetLeads: 50,
        achievedLeads: 30 + Math.floor(Math.random() * 25),
        targetConversion: 30,
        achievedConversion: 15 + Math.floor(Math.random() * 20),
        documents: J([{ name: "Employment Contract", type: "PDF", uploadedAt: "2024-01-15" }, { name: "NID Copy", type: "PDF", uploadedAt: "2024-01-15" }]),
        warnings: J([]),
        managerFeedback: J([{ from: "Branch Manager", date: "2024-12-01", text: "Great conversion rate this quarter. Keep up the proactive follow-ups." }]),
      },
    });
    empMap[u.id] = emp;

    // Attendance for last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const day = d.toISOString().slice(0, 10);
      const status = i === 5 ? "LEAVE" : i === 6 ? "HOLIDAY" : pick(["PRESENT", "PRESENT", "PRESENT", "LATE"]);
      await db.employeeAttendance.create({
        data: {
          employeeId: emp.id,
          date: day,
          checkIn: status === "PRESENT" ? "09:15" : status === "LATE" ? "10:05" : "",
          checkOut: status === "PRESENT" || status === "LATE" ? "18:30" : "",
          status: status.toLowerCase(),
          isLate: status === "LATE",
          hoursWorked: status === "PRESENT" || status === "LATE" ? 8.5 : 0,
        },
      });
    }

    // Commission (for counselors)
    if (u.role === "COUNSELOR" || u.role === "ADMIN") {
      for (let i = 0; i < 4; i++) {
        await db.employeeCommission.create({
          data: {
            employeeId: emp.id,
            amount: pick([8000, 12000, 15000, 10000]),
            period: `2024-${String(10 + Math.floor(i / 2)).padStart(2, "0")}`,
            status: pick(["pending", "approved", "paid", "pending"]),
            note: pick(["Student placed at University of Manchester", "Student placed at Fanshawe College", "Student placed at TU Munich"]),
          },
        });
      }
      // Bonus
      await db.employeeBonus.create({
        data: { employeeId: emp.id, amount: 15000, reason: "Exceeded Q3 conversion target", period: "2024-09", status: "approved" },
      });
      // Increment
      await db.employeeIncrement.create({
        data: { employeeId: emp.id, previousAmount: 38000, newAmount: 45000, incrementType: "annual", effectiveFrom: "2024-07-01", reason: "Annual performance increment", approvedBy: "superadmin@aloedu.com" },
      });
    }

    // Performance
    await db.employeePerformance.create({
      data: {
        employeeId: emp.id,
        period: "2024-12",
        score: 65 + Math.floor(Math.random() * 30),
        targetLeads: 50,
        achievedLeads: 20 + Math.floor(Math.random() * 30),
        targetConversion: 30,
        achievedConversion: 15 + Math.floor(Math.random() * 20),
      },
    });
  }
  console.log(`Seeded ${empCounter} employee HR profiles`);

  // === COUNSELOR STUDENT ASSIGNMENTS + COMMENTS ===
  const counselors = users.filter((u) => u.role === "COUNSELOR");
  const students = await db.student.findMany({ take: 12 });

  if (counselors.length === 0 || students.length === 0) {
    console.log(`Skipping counselor-student fixtures (counselors: ${counselors.length}, students: ${students.length}) — seed counselor users and students first.`);
    return;
  }

  for (let si = 0; si < students.length; si++) {
    const student = students[si];
    const counselor = counselors[si % counselors.length] || counselors[0];

    // Internal comments (mix of types)
    const internalComments = [
      { authorId: counselor.id, authorRole: "COUNSELOR", body: `Student is interested in ${student.studyDestination || "UK"}. Strong academic background. Needs IELTS prep support.`, visibility: "COUNSELOR_VISIBLE", commentType: "COUNSELOR_NOTE" },
      { authorId: users.find(u => u.role === "APPLICATION_TEAM")?.id || counselor.id, authorRole: "APPLICATION_TEAM", body: "Application submitted through direct channel. Documents verified.", visibility: "APPLICATION_TEAM_ONLY", commentType: "APPLICATION_TEAM_NOTE" },
      { authorId: users.find(u => u.role === "VISA_OFFICER")?.id || counselor.id, authorRole: "VISA_OFFICER", body: "Financial explanation weak. Schedule another mock interview before visa submission.", visibility: "VISA_TEAM_ONLY", commentType: "RISK_NOTE" },
      { authorId: users.find(u => u.role === "FINANCE")?.id || counselor.id, authorRole: "FINANCE", body: "Commission pending from partner. Amount: BDT 15,000.", visibility: "FINANCE_ONLY", commentType: "COMMISSION_NOTE" },
      { authorId: users.find(u => u.role === "ADMIN")?.id || counselor.id, authorRole: "ADMIN", body: "Monitor closely — previous refusal history. Ensure all financial docs are current.", visibility: "SUPER_ADMIN_ONLY", commentType: "REFUSAL_ANALYSIS" },
    ];
    for (const c of internalComments) {
      await db.internalComment.create({
        data: { studentId: student.id, authorId: c.authorId, authorRole: c.authorRole, body: c.body, visibility: c.visibility, commentType: c.commentType, editHistory: J([]) },
      });
    }

    // Student-visible comments
    const studentComments = [
      "Please upload your updated passport copy.",
      "Your SOP is under review by our application team.",
      "Your application has been submitted to the university. We'll update you within 2 weeks.",
      "Your IELTS mock test result is ready. Check the English Test section.",
    ];
    for (let i = 0; i < 2; i++) {
      await db.studentVisibleComment.create({
        data: { studentId: student.id, authorId: counselor.id, authorRole: "COUNSELOR", body: pick(studentComments), isAutoGenerated: i === 0, readByStudent: i === 0 },
      });
    }

    // Tasks for counselor
    const taskTitles = [
      { title: `Follow up with ${student.fullName} on document upload`, type: "FOLLOW_UP", priority: "HIGH" },
      { title: `Request bank statement from ${student.fullName}`, type: "DOCUMENT_REQUEST", priority: "NORMAL" },
      { title: `SOP review for ${student.fullName}`, type: "SOP_REVIEW", priority: "NORMAL" },
      { title: `Call ${student.fullName} re: intake preference`, type: "CALL", priority: "HIGH" },
    ];
    for (let i = 0; i < 2; i++) {
      const t = pick(taskTitles);
      await db.task.create({
        data: { title: t.title, assigneeId: counselor.id, studentId: student.id, type: t.type, priority: t.priority, status: pick(["PENDING", "IN_PROGRESS", "PENDING", "COMPLETED"]), dueDate: new Date(Date.now() + Math.floor(Math.random() * 7) * 86400000).toISOString().slice(0, 10) },
      });
    }

    // Appointments
    await db.appointment.create({
      data: {
        counselorId: counselor.id,
        studentId: student.id,
        title: `Consultation with ${student.fullName}`,
        type: pick(["CONSULTATION", "FOLLOW_UP", "VISA_PREP", "INTERVIEW_PRACTICE"]),
        scheduledAt: new Date(Date.now() + Math.floor(Math.random() * 5) * 86400000 + 36000000).toISOString(),
        durationMinutes: pick([30, 45, 60]),
        location: pick(["Office", "Online", "Phone"]),
        status: pick(["SCHEDULED", "SCHEDULED", "COMPLETED"]),
      },
    });

    // SOP drafts
    await db.sopDraft.create({
      data: {
        studentId: student.id,
        counselorId: counselor.id,
        university: student.universityPreference || "University of Manchester",
        course: student.programTitle || "MSc Computer Science",
        type: "SOP",
        content: `I am ${student.fullName}, a Bangladeshi student passionate about ${student.studyArea || "Computer Science"}. My academic journey began with a strong foundation in science, culminating in my bachelor's degree where I developed keen interest in technology and its applications...\n\n[This is a draft generated by ALO AI. Please review and personalize with your counselor.]`,
        wordCount: 487,
        version: 1,
        status: pick(["DRAFT", "STUDENT_REVIEW", "COUNSELOR_REVIEW", "APPROVED"]),
        originalityScore: 70 + Math.floor(Math.random() * 25),
        reviewChecklist: J(["Personal motivation clear", "Academic background connected", "University choice explained", "Career goals stated", "No copied content"]),
        aiGenerated: true,
      },
    });
    await db.cvDraft.create({
      data: { studentId: student.id, counselorId: counselor.id, template: "STANDARD", content: `${student.fullName}\n${student.email} | ${student.mobile}\n\nEDUCATION\n- Bachelor in ${student.studyArea || "Computer Science"}\n\nWORK EXPERIENCE\n- Software Engineer (2 years)\n\nSKILLS\n- Programming, Data Analysis, Communication`, version: 1, status: "DRAFT" },
    });
  }
  console.log("Seeded comments, tasks, appointments, SOP/CV drafts");

  // === COMMUNICATION MESSAGES (unified inbox) ===
  const channels = ["WHATSAPP", "SMS", "EMAIL", "WEBSITE_CHAT", "FACEBOOK", "INSTAGRAM"];
  const sampleMessages = [
    { inbound: "Hi, I want to know about September intake for UK universities", outbound: "Hello! Thank you for your interest. We have several UK universities open for September intake. May I know your preferred course and academic background?" },
    { inbound: "What is the IELTS requirement for University of Manchester?", outbound: "Most courses at University of Manchester require IELTS 6.5–7.0. Would you like to schedule a free consultation to discuss your options?" },
    { inbound: "I have uploaded my passport. Please check", outbound: "Thank you! I've received your passport. Our application team will review it within 24 hours. You'll get an update in your student portal." },
    { inbound: "Can I apply with a 2-year study gap?", outbound: "Yes, you can apply with a study gap if you can explain it credibly. Work experience, further study, or skill development all count. Let's discuss in a consultation." },
    { inbound: "What documents do I need for Canada study permit?", outbound: "For a Canada study permit you'll need: acceptance letter, proof of funds, passport, photos, English test score, and medical exam. Book a consultation for a full checklist." },
    { inbound: "My visa was refused last year. Can I apply again?", outbound: "Yes, you can reapply. We'll review your refusal reason and build a stronger application. Please book a consultation with our visa officer." },
  ];
  for (let i = 0; i < 24; i++) {
    const msg = pick(sampleMessages);
    const student = pick(students);
    const counselor = counselors[i % counselors.length] || counselors[0];
    const channel = pick(channels);
    const receivedAt = new Date(Date.now() - Math.floor(Math.random() * 3 * 3600000));
    const responded = Math.random() > 0.3;
    const aiAssisted = responded && Math.random() > 0.5;

    await db.communicationMessage.create({
      data: {
        channel, direction: "INBOUND", fromPhone: student.mobile, fromName: student.fullName, fromEmail: channel === "EMAIL" ? student.email : null,
        body: msg.inbound, studentId: student.id, counselorId: counselor.id, read: responded, receivedAt,
      },
    });
    if (responded) {
      await db.communicationMessage.create({
        data: {
          channel, direction: "OUTBOUND", toPhone: student.mobile, toEmail: channel === "EMAIL" ? student.email : null,
          body: msg.outbound, studentId: student.id, counselorId: counselor.id, aiAssisted, humanApproved: true, read: true, sentAt: new Date(receivedAt.getTime() + 20 * 60000),
        },
      });
    }

    // SLA events
    const slaStatus = responded ? (aiAssisted ? "AI_HANDLED" : "RESPONDED") : (Date.now() - receivedAt.getTime() > 40 * 60000 ? "ESCALATED_40" : "PENDING");
    await db.slaEvent.create({
      data: {
        channel, studentId: student.id, counselorId: counselor.id, receivedAt,
        firstResponseAt: responded ? new Date(receivedAt.getTime() + 20 * 60000) : null,
        status: slaStatus, slaMinutes: 30, aiHandled: aiAssisted,
        escalatedAt: slaStatus === "ESCALATED_40" ? new Date(receivedAt.getTime() + 40 * 60000) : null,
        escalatedTo: slaStatus === "ESCALATED_40" ? "BRANCH_MANAGER" : null,
      },
    });
  }
  console.log("Seeded 24 conversations with SLA events");

  // === PARTNER EMAIL UPDATES ===
  for (let i = 0; i < 6; i++) {
    const student = pick(students);
    await db.partnerEmailUpdate.create({
      data: {
        studentId: student.id,
        partnerName: pick(["Global Education Partners", "StudyLink UK", "Campus Connect Canada"]),
        partnerEmail: pick(["updates@globaledupartners.com", "info@studylinkuk.com", "contact@campusconnect.ca"]),
        subject: pick(["Application Status Update", "Conditional Offer Received", "CAS Processing Update", "Document Verification Complete"]),
        body: `Dear ALO Education Team,\n\nWe are writing to update you on the application for ${student.fullName} (Student ID: ${student.studentId}).\n\n${pick(["The university has reviewed the application and issued a conditional offer pending final transcript and IELTS score.", "The CAS process has been initiated. Please ensure the student pays the deposit within 14 days.", "All documents have been verified. The application is now ready for final submission.", "The university has requested an interview with the student. Please schedule accordingly."] )}\n\nBest regards,\nPartner Team`,
        parsedUpdate: J({ status: pick(["CONDITIONAL_OFFER", "CAS_PENDING", "DOCUMENTS_VERIFIED", "INTERVIEW_REQUESTED"]), deadline: "2024-08-15" }),
        studentFacingMessage: pick(["Great news! Your application has progressed. Check your portal for next steps.", "Your conditional offer has been received. Please check the conditions in your portal.", "Your documents are verified. The application is being submitted."]),
        status: pick(["PENDING", "REVIEWED", "SENT_TO_STUDENT"]),
      },
    });
  }
  console.log("Seeded 6 partner email updates");

  // === WEEKLY REPORTS ===
  const periodStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);

  for (const counselor of counselors) {
    await db.weeklyReport.create({
      data: {
        type: "COUNSELOR", periodStart, periodEnd, recipientId: counselor.id,
        summary: J({
          totalLeadsHandled: 18 + Math.floor(Math.random() * 15),
          responseTime: `${15 + Math.floor(Math.random() * 20)} min avg`,
          missedSla: Math.floor(Math.random() * 3),
          newStudents: 4 + Math.floor(Math.random() * 5),
          applicationsCreated: 3 + Math.floor(Math.random() * 4),
          documentsRequested: 8 + Math.floor(Math.random() * 6),
          sopCompleted: 2 + Math.floor(Math.random() * 3),
          messagesSent: 45 + Math.floor(Math.random() * 30),
          conversionRate: `${15 + Math.floor(Math.random() * 15)}%`,
          pendingTasks: 5 + Math.floor(Math.random() * 5),
          aiAssistedReplies: 12 + Math.floor(Math.random() * 8),
        }),
        insights: "Strong week with good conversion. SLA compliance at 92%. Focus on reducing response time for WhatsApp queries in the evening.",
      },
    });
  }

  await db.weeklyReport.create({
    data: {
      type: "MARKETING", periodStart, periodEnd,
      summary: J({
        totalLeads: 145, facebookLeads: 62, instagramLeads: 28, whatsappLeads: 35, websiteLeads: 20,
        campaigns: 6, costPerLead: "৳351", conversionRate: "17%",
        socialReplies: 89, commentToLead: 15, bestCountry: "UK", bestCourse: "MSc Computer Science",
      }),
      insights: "Facebook campaigns driving most leads. Reels showing higher engagement than static posts. Recommend increasing budget for UK September intake campaign.",
    },
  });

  await db.weeklyReport.create({
    data: {
      type: "VISA", periodStart, periodEnd,
      summary: J({
        totalCases: 8, interviewsScheduled: 4, readinessAvg: "72%",
        highRiskStudents: 2, missingDocuments: 5, approvals: 1, refusals: 0,
      }),
      insights: "Two students flagged high-risk due to weak financial explanation. Schedule additional mock interviews before submission.",
    },
  });

  await db.weeklyReport.create({
    data: {
      type: "PARTNER", periodStart, periodEnd,
      summary: J({
        partnerLeads: 22, activeApplications: 14, commissionPending: "৳185,000", conversionRate: "23%",
      }),
      insights: "Partner referrals up 15% this week. Global Education Partners driving most volume.",
    },
  });

  await db.weeklyReport.create({
    data: {
      type: "BRANCH", periodStart, periodEnd,
      summary: J({
        totalLeads: 187, totalStudents: 42, totalApplications: 28, totalVisaCases: 8,
        totalRevenue: "৳425,000", slaCompliance: "88%", avgResponseTime: "22 min",
      }),
      insights: "Strong week overall. SLA compliance needs improvement — 12% of queries missed the 30-minute target. Consider adding after-hours AI coverage.",
    },
  });
  console.log("Seeded weekly reports");

  // === CONTENT CALENDAR ===
  const contentItems = [
    { title: "UK September Intake Deadline Reminder", platform: "FACEBOOK", type: "POST", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 86400000).toISOString() },
    { title: "Reel: Student Success Story — Canada", platform: "INSTAGRAM", type: "REEL", status: "DRAFT", scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString() },
    { title: "Live Q&A: Study in Germany", platform: "FACEBOOK", type: "LIVE", status: "IDEA", scheduledAt: new Date(Date.now() + 5 * 86400000).toISOString() },
    { title: "Post: IELTS vs PTE — Which to choose?", platform: "LINKEDIN", type: "POST", status: "APPROVED", scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString() },
    { title: "Story: Scholarship deadline this week", platform: "INSTAGRAM", type: "STORY", status: "PUBLISHED", scheduledAt: new Date(Date.now() - 86400000).toISOString() },
    { title: "Email: September intake newsletter", platform: "EMAIL", type: "EMAIL", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 4 * 86400000).toISOString() },
  ];
  // contentCalendar model removed — marketing calendar entries are seeded by
  // seed-marketing.ts against the MarketingCalendar model.
  void contentItems;

  // === AI REPLY LOGS ===
  for (let i = 0; i < 8; i++) {
    await db.aiReplyLog.create({
      data: {
        channel: pick(channels),
        originalMessage: pick(sampleMessages).inbound,
        suggestedReply: pick(sampleMessages).outbound,
        status: pick(["SUGGESTED", "APPROVED", "SENT", "APPROVED"]),
        studentId: pick(students).id,
        approvedBy: ["SUGGESTED", "APPROVED", "SENT"].includes("APPROVED") ? counselors[0]?.id || null : null,
        sentAt: pick(["SUGGESTED", "APPROVED", "SENT"]).includes("SENT") ? new Date() : null,
      },
    });
  }

  console.log("Counselor portal seed complete!");
  console.log(`- Permissions: ${await db.permission.count()}`);
  console.log(`- Role permissions: ${await db.rolePermission.count()}`);
  console.log(`- Employee HR profiles: ${await db.employeeHR.count()}`);
  console.log(`- Attendance records: ${await db.employeeAttendance.count()}`);
  console.log(`- Commissions: ${await db.employeeCommission.count()}`);
  console.log(`- Bonuses: ${await db.employeeBonus.count()}`);
  console.log(`- Increments: ${await db.employeeIncrement.count()}`);
  console.log(`- Performance records: ${await db.employeePerformance.count()}`);
  console.log(`- Tasks: ${await db.task.count()}`);
  console.log(`- Appointments: ${await db.appointment.count()}`);
  console.log(`- SLA events: ${await db.slaEvent.count()}`);
  console.log(`- Communication messages: ${await db.communicationMessage.count()}`);
  console.log(`- Internal comments: ${await db.internalComment.count()}`);
  console.log(`- Student-visible comments: ${await db.studentVisibleComment.count()}`);
  console.log(`- SOP drafts: ${await db.sopDraft.count()}`);
  console.log(`- CV drafts: ${await db.cvDraft.count()}`);
  console.log(`- Partner email updates: ${await db.partnerEmailUpdate.count()}`);
  console.log(`- Weekly reports: ${await db.weeklyReport.count()}`);
  console.log(`- AI reply logs: ${await db.aiReplyLog.count()}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
