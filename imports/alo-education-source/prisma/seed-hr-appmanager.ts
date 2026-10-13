// ALO Education — Enterprise HR + Application Manager seed
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log("Seeding Enterprise HR + Application Manager data...");

  // Clean
  await db.applicationNotification.deleteMany();
  await db.applicationTask.deleteMany();
  await db.applicationDeadline.deleteMany();
  await db.applicationDocument.deleteMany();
  await db.applicationComment.deleteMany();
  await db.applicationStatusLog.deleteMany();
  await db.b2bApplication.deleteMany();
  await db.b2bProvider.deleteMany();
  await db.exitManagement.deleteMany();
  await db.noticeManagement.deleteMany();
  await db.loginSecurity.deleteMany();
  await db.deviceManagement.deleteMany();
  await db.payroll.deleteMany();
  await db.leaveRequest.deleteMany();

  const employees = await db.employee.findMany({ take: 10 });
  const applications = await db.application.findMany({ take: 10 });

  // ─── Leave Requests ───
  for (const emp of employees) {
    await db.leaveRequest.create({
      data: {
        employeeId: emp.id,
        leaveType: pick(["CASUAL", "ANNUAL", "MEDICAL", "COMPENSATORY"]),
        startDate: "2025-01-1" + Math.floor(Math.random() * 9),
        endDate: "2025-01-1" + (Math.floor(Math.random() * 9) + 1),
        days: Math.floor(Math.random() * 3) + 1,
        reason: pick(["Personal work", "Family event", "Medical appointment", "Festival"]),
        status: pick(["PENDING", "APPROVED", "APPROVED", "REJECTED"]),
      },
    });
  }

  // ─── Payroll ───
  const monthYear = "2025-01";
  for (const emp of employees) {
    const hr = await db.employeeHR.findUnique({ where: { userId: emp.userId || "" } }).catch(() => null);
    const basic = hr?.baseSalary || 40000;
    const allowances = 5000;
    const taxDeduction = Math.round(basic * 0.05);
    const pf = Math.round(basic * 0.08);
    const totalEarnings = basic + allowances;
    const totalDeductions = taxDeduction + pf;
    await db.payroll.create({
      data: {
        employeeId: emp.id,
        monthYear,
        basicSalary: basic,
        allowances,
        taxDeduction,
        providentFund: pf,
        totalEarnings,
        totalDeductions,
        netPay: totalEarnings - totalDeductions,
        status: pick(["DRAFT", "APPROVED", "PAID"]),
      },
    });
  }

  // ─── Device Management ───
  for (const emp of employees.slice(0, 6)) {
    await db.deviceManagement.create({
      data: {
        employeeId: emp.id,
        deviceType: pick(["LAPTOP", "DESKTOP", "PHONE"]),
        deviceName: pick(["Dell Latitude 5520", "HP EliteBook 840", "Lenovo ThinkPad T14", "MacBook Pro 14"]),
        serialNumber: `SN${Math.floor(Math.random() * 9999999)}`,
        assetTag: `ALO-ASSET-${Math.floor(Math.random() * 999)}`,
        assignedDate: "2023-0" + (Math.floor(Math.random() * 9) + 1) + "-15",
        warrantyExpiry: "2026-01-15",
        status: pick(["ASSIGNED", "ASSIGNED", "RETURNED"]),
      },
    });
  }

  // ─── Login Security ───
  for (const emp of employees.slice(0, 8)) {
    await db.loginSecurity.create({
      data: {
        userId: emp.userId || emp.id,
        ipAddress: `103.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        browser: pick(["Chrome 120", "Firefox 121", "Safari 17", "Edge 120"]),
        operatingSystem: pick(["Windows 11", "macOS 14", "Ubuntu 22.04", "Android 14"]),
        location: pick(["Dhaka, Bangladesh", "Chattogram, Bangladesh", "Sylhet, Bangladesh"]),
        loginTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
        sessionStatus: pick(["ACTIVE", "LOGGED_OUT", "LOGGED_OUT"]),
      },
    });
  }

  // ─── B2B Providers ───
  const providers = [
    { name: "Global Education Partners", providerType: "GLOBAL_B2B", contactPerson: "John Smith", email: "john@globaledupartners.com", phone: "+442071234567", portalUrl: "https://portal.globaledupartners.com", commissionRule: "10% of tuition", paymentCondition: "After enrolment", claimStage: "ENROLMENT" },
    { name: "StudyLink UK", providerType: "COUNTRY_SPECIFIC", contactPerson: "Sarah Johnson", email: "sarah@studylinkuk.com", phone: "+442079876543", portalUrl: "https://studylinkuk.com/portal", commissionRule: "8% of tuition", paymentCondition: "After CAS issued", claimStage: "CAS_ISSUED" },
    { name: "Campus Connect Canada", providerType: "COUNTRY_SPECIFIC", contactPerson: "Michael Chen", email: "michael@campusconnect.ca", phone: "+14165551234", portalUrl: "https://campusconnect.ca/portal", commissionRule: "12% of tuition", paymentCondition: "After enrolment", claimStage: "ENROLMENT" },
    { name: "University Direct Channel", providerType: "DIRECT_UNIVERSITY", contactPerson: "Prof. Williams", email: "admissions@unidirect.edu", phone: "+442071111222", portalUrl: "https://unidirect.edu/apply", commissionRule: "5% of tuition", paymentCondition: "After offer acceptance", claimStage: "OFFER_ACCEPTED" },
  ];
  const providerMap: Record<string, any> = {};
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const provider = await db.b2bProvider.create({
      data: { ...p, providerCode: `B2B-${(1001 + i).toString()}`, countryCoverage: JSON.stringify(["UK", "Canada", "Australia"]), universityCoverage: JSON.stringify(["University of Manchester", "UofT"]), status: "ACTIVE", lastReviewedAt: new Date("2025-01-15") },
    });
    providerMap[p.name] = provider;
  }

  // ─── B2B Applications ───
  for (let i = 0; i < Math.min(6, applications.length); i++) {
    const app = applications[i];
    const provider = pick(Object.values(providerMap));
    await db.b2bApplication.create({
      data: {
        applicationId: app.id,
        b2bProviderId: provider.id,
        b2bType: pick(["INBOUND", "OUTBOUND"]),
        b2bReference: `B2B-REF-${Math.floor(Math.random() * 99999)}`,
        submissionRoute: pick(["B2B Portal", "Email", "API Sync"]),
        submittedDate: "2025-01-1" + Math.floor(Math.random() * 9),
        acknowledgementNumber: `ACK-${Math.floor(Math.random() * 99999)}`,
        b2bStatus: pick(["SUBMITTED", "ACKNOWLEDGED", "IN_REVIEW", "DECISION_PENDING", "OFFERED"]),
        b2bCommissionType: "PERCENTAGE",
        b2bCommissionAmount: Math.floor(Math.random() * 15000) + 5000,
        b2bPaymentCondition: "After enrolment",
        b2bClaimStage: pick(["APPLICATION", "OFFER", "CAS", "VISA", "ENROLMENT"]),
        b2bInternalNote: "Confidential B2B submission. Do not share with student or partner.",
        lastFollowupAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
        nextFollowupAt: new Date(Date.now() + Math.floor(Math.random() * 7 * 86400000)),
      },
    });

    // Application comments
    await db.applicationComment.create({
      data: {
        applicationId: app.id,
        commentType: "B2B_CONFIDENTIAL",
        visibility: "B2B_CONFIDENTIAL",
        commentText: "Application submitted through B2B provider. Commission expected: 10% of tuition. Do not share B2B details with student or partner.",
        isB2bConfidential: true,
      },
    });
    await db.applicationComment.create({
      data: {
        applicationId: app.id,
        commentType: "STUDENT_VISIBLE",
        visibility: "STUDENT_VISIBLE",
        commentText: "Your application has been submitted to the university. We'll update you within 2-3 weeks.",
      },
    });
    await db.applicationComment.create({
      data: {
        applicationId: app.id,
        commentType: "INTERNAL",
        visibility: "INTERNAL",
        commentText: "Documents verified. Application fee paid. Waiting for university response.",
      },
    });

    // Application documents
    for (const docType of ["PASSPORT", "ACADEMIC_CERT", "TRANSCRIPT", "IELTS_CERT", "SOP", "CV"]) {
      await db.applicationDocument.create({
        data: {
          applicationId: app.id,
          studentId: app.studentId,
          documentType: docType,
          status: pick(["UPLOADED", "APPROVED", "APPROVED", "MISSING", "UNDER_REVIEW"]),
        },
      });
    }

    // Application deadlines
    await db.applicationDeadline.create({
      data: {
        applicationId: app.id,
        deadlineType: "APPLICATION",
        deadlineDate: "2025-06-30",
        status: "PENDING",
      },
    });
    await db.applicationDeadline.create({
      data: {
        applicationId: app.id,
        deadlineType: "DEPOSIT",
        deadlineDate: "2025-08-15",
        status: "PENDING",
      },
    });

    // Application tasks
    await db.applicationTask.create({
      data: {
        applicationId: app.id,
        taskTitle: "Follow up with university for decision",
        assignedTo: app.appTeamOfficerId,
        priority: "HIGH",
        status: "PENDING",
        dueDate: "2025-02-15",
      },
    });

    // Application status log
    await db.applicationStatusLog.create({
      data: {
        applicationId: app.id,
        oldStatus: "APPLICATION_PREPARING",
        newStatus: "APPLICATION_SUBMITTED",
        safeStatus: "Submitted",
        changedBy: app.appTeamOfficerId,
        visibility: "PUBLIC",
        note: "Application submitted to university",
      },
    });
    await db.applicationStatusLog.create({
      data: {
        applicationId: app.id,
        newStatus: "B2B_SUBMITTED",
        safeStatus: "Submitted",
        visibility: "B2B_CONFIDENTIAL",
        note: "Application also submitted through B2B provider for faster processing",
      },
    });
  }

  console.log("Enterprise HR + Application Manager seed complete!");
  console.log(`- Leave requests: ${await db.leaveRequest.count()}`);
  console.log(`- Payroll records: ${await db.payroll.count()}`);
  console.log(`- Devices: ${await db.deviceManagement.count()}`);
  console.log(`- Login security: ${await db.loginSecurity.count()}`);
  console.log(`- B2B providers: ${await db.b2bProvider.count()}`);
  console.log(`- B2B applications: ${await db.b2bApplication.count()}`);
  console.log(`- Application comments: ${await db.applicationComment.count()}`);
  console.log(`- Application documents: ${await db.applicationDocument.count()}`);
  console.log(`- Application deadlines: ${await db.applicationDeadline.count()}`);
  console.log(`- Application tasks: ${await db.applicationTask.count()}`);
  console.log(`- Application status logs: ${await db.applicationStatusLog.count()}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
