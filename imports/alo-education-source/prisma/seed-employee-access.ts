// ALO Education — Employee Access System seed
// Seeds: departments, offices, employee designations, 3 partner packages, feature access rules, sample employees
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const db = new PrismaClient();

const DEPARTMENTS = [
  { name: "Management", code: "MGMT", description: "Top-level management and strategy" },
  { name: "Counseling", code: "CNSL", description: "Student counseling and guidance" },
  { name: "Application Processing", code: "APP", description: "University application processing" },
  { name: "Visa Processing", code: "VISA", description: "Visa application and interview" },
  { name: "Marketing", code: "MKTG", description: "Marketing and lead generation" },
  { name: "Finance", code: "FIN", description: "Finance and accounting" },
  { name: "Human Resources", code: "HR", description: "HR and employee management" },
  { name: "Front Desk", code: "FD", description: "Front desk and reception" },
  { name: "IT & Support", code: "IT", description: "IT support and system administration" },
  { name: "English Training", code: "ENG", description: "English test preparation" },
];

const OFFICES = [
  { name: "Dhaka HQ", code: "DHK-HQ", address: "Banani, Dhaka", city: "Dhaka", country: "Bangladesh", phone: "+8801805020101" },
  { name: "Chattogram Branch", code: "CTG-01", address: "Agrabad, Chattogram", city: "Chattogram", country: "Bangladesh", phone: "+8801805020102" },
  { name: "Sylhet Branch", code: "SYL-01", address: "Zindabazar, Sylhet", city: "Sylhet", country: "Bangladesh", phone: "+8801805020103" },
];

const DESIGNATIONS = [
  "Chairman", "CEO", "Director", "Office Manager", "Country Manager",
  "Counselor", "Senior Counselor", "Application Manager", "Application Team",
  "Visa Officer", "Finance Officer", "Marketing Manager", "Marketing Officer",
  "Front Desk", "HR Manager", "Support Staff", "Viewer",
];

const PARTNER_PACKAGES = [
  {
    name: "Starter Partner",
    description: "Entry-level B2B partner package. 1 super admin + 2 employees. 15 images/month, 10 videos/month (30 sec max). 3 English mock vouchers + 1 interview prep per eligible student. Student benefits only after ALO application.",
    defaultUserLimit: 3,
    monthlyImageLimit: 15,
    monthlyVideoLimit: 10,
    videoDurationLimitSeconds: 30,
    englishMockVoucherLimit: 3,
    interviewPrepLimit: 1,
    autoPublishAllowed: false,
    requiresAloApproval: true,
    status: "ACTIVE",
  },
  {
    name: "Growth Partner",
    description: "Mid-tier B2B partner package. Custom user seats, image/video quotas, optional landing page, and more campaign support.",
    defaultUserLimit: 10,
    monthlyImageLimit: 50,
    monthlyVideoLimit: 30,
    videoDurationLimitSeconds: 60,
    englishMockVoucherLimit: 10,
    interviewPrepLimit: 5,
    autoPublishAllowed: false,
    requiresAloApproval: true,
    status: "ACTIVE",
  },
  {
    name: "Premium Partner",
    description: "Top-tier B2B partner package. Custom agreement, higher quotas, dedicated support, and more integrations.",
    defaultUserLimit: 50,
    monthlyImageLimit: 200,
    monthlyVideoLimit: 100,
    videoDurationLimitSeconds: 120,
    englishMockVoucherLimit: 50,
    interviewPrepLimit: 20,
    autoPublishAllowed: true,
    requiresAloApproval: false,
    status: "ACTIVE",
  },
];

// Feature keys for access control
const FEATURE_KEYS = [
  // Employee features
  { key: "employee.profile.view", description: "View employee profiles", requiresApproval: false },
  { key: "employee.profile.view_private", description: "View employee private profile (salary, NID, bank)", requiresApproval: true },
  { key: "employee.salary.view", description: "View employee salary details", requiresApproval: true },
  { key: "employee.salary.manage", description: "Manage employee salary", requiresApproval: true },
  { key: "employee.create", description: "Create new employee accounts", requiresApproval: false },
  { key: "employee.activate", description: "Activate/resend activation emails", requiresApproval: false },
  { key: "employee.suspend", description: "Suspend employee accounts", requiresApproval: true },
  { key: "employee.documents.view", description: "View employee documents", requiresApproval: false },
  { key: "employee.documents.download", description: "Download employee documents", requiresApproval: true },
  { key: "employee.attendance.view", description: "View employee attendance", requiresApproval: false },
  { key: "employee.attendance.manage", description: "Manage employee attendance", requiresApproval: false },
  { key: "employee.leave.approve", description: "Approve leave requests", requiresApproval: false },
  { key: "employee.profile.approve", description: "Approve employee profiles (HR review)", requiresApproval: false },
  // Partner features
  { key: "partner.users.manage", description: "Manage partner users", requiresApproval: false },
  { key: "partner.package.assign", description: "Assign partner packages", requiresApproval: false },
  { key: "partner.quota.approve", description: "Approve extra quota requests", requiresApproval: false },
  { key: "partner.student.benefit", description: "Partner student benefits (mock/interview)", requiresApproval: false },
  { key: "partner.b2b.view", description: "View B2B partner details", requiresApproval: false },
  // Marketing features
  { key: "marketing.image.generate", description: "Generate marketing images", requiresApproval: false },
  { key: "marketing.video.generate", description: "Generate marketing videos", requiresApproval: false },
  { key: "marketing.auto_post", description: "Auto-post to social media", requiresApproval: true },
  { key: "marketing.content.approve", description: "Approve AI-generated content", requiresApproval: false },
  // Communication features
  { key: "communication.whatsapp.send", description: "Send WhatsApp messages", requiresApproval: false },
  { key: "communication.sms.send", description: "Send SMS", requiresApproval: false },
  { key: "communication.email.send", description: "Send emails", requiresApproval: false },
  // System features
  { key: "system.rbac.manage", description: "Manage role-based access control", requiresApproval: false },
  { key: "system.audit.view", description: "View audit logs", requiresApproval: false },
  { key: "system.import.manage", description: "Manage data imports", requiresApproval: false },
  { key: "system.publish.approve", description: "Approve public data publishing", requiresApproval: false },
];

async function main() {
  console.log("Seeding ALO Employee Access System...");

  // Clean
  await db.featureUsageLog.deleteMany();
  await db.extraQuotaRequest.deleteMany();
  await db.featureAccessRule.deleteMany();
  await db.partnerPackageAssignment.deleteMany();
  await db.partnerPackage.deleteMany();
  await db.employeeActivationToken.deleteMany();
  await db.employeeDocument.deleteMany();
  await db.employeeSalary.deleteMany();
  await db.employeeEmergencyContact.deleteMany();
  await db.employeeEducation.deleteMany();
  await db.employeeProfile.deleteMany();
  await db.employee.deleteMany();
  await db.department.deleteMany();
  await db.office.deleteMany();

  // Departments
  const deptMap: Record<string, any> = {};
  for (const d of DEPARTMENTS) {
    deptMap[d.code] = await db.department.create({ data: d });
  }
  console.log(`Seeded ${DEPARTMENTS.length} departments`);

  // Offices
  const officeMap: Record<string, any> = {};
  for (const o of OFFICES) {
    officeMap[o.code] = await db.office.create({ data: o });
  }
  console.log(`Seeded ${OFFICES.length} offices`);

  // Partner packages
  const pkgMap: Record<string, any> = {};
  for (const p of PARTNER_PACKAGES) {
    pkgMap[p.name] = await db.partnerPackage.create({ data: p });
  }
  console.log(`Seeded ${PARTNER_PACKAGES.length} partner packages`);

  // Create employees for each existing User
  const users = await db.user.findMany();
  let empCounter = 0;
  const empMap: Record<string, any> = {};
  for (const u of users) {
    empCounter++;
    const designationMap: Record<string, string> = {
      SUPER_ADMIN: "Chairman",
      ADMIN: "Director",
      HR_MANAGER: "HR Manager",
      BRANCH_MANAGER: "Office Manager",
      COUNSELOR: "Senior Counselor",
      APPLICATION_TEAM: "Application Team",
      VISA_OFFICER: "Visa Officer",
      VISA_INTERVIEW_OFFICER: "Visa Officer",
      FINANCE: "Finance Officer",
      MARKETING_MANAGER: "Marketing Manager",
      MARKETING: "Marketing Officer",
      FRONT_DESK: "Front Desk",
      SUPPORT_STAFF: "Support Staff",
      PARTNER: "Country Manager",
      ENGLISH_TRAINER: "Counselor",
      MOCK_TEST_ADMIN: "Support Staff",
    };
    const designation = designationMap[u.role] || "Support Staff";
    const deptCode = u.role === "MARKETING_MANAGER" || u.role === "MARKETING" ? "MKTG" : u.role === "FINANCE" ? "FIN" : u.role === "VISA_OFFICER" || u.role === "VISA_INTERVIEW_OFFICER" ? "VISA" : u.role === "APPLICATION_TEAM" ? "APP" : u.role === "HR_MANAGER" ? "HR" : u.role === "COUNSELOR" ? "CNSL" : "MGMT";
    const office = empCounter % 3 === 0 ? "CTG-01" : empCounter % 3 === 1 ? "DHK-HQ" : "SYL-01";

    const emp = await db.employee.create({
      data: {
        employeeCode: `AE-EMP-${(1001 + empCounter).toString()}`,
        userId: u.id,
        fullName: u.name,
        companyEmail: u.email,
        personalEmail: `${u.name?.toLowerCase().replace(/\s/g, ".")}@gmail.com`,
        phone: u.phone || "+8801800000000",
        designation,
        departmentId: deptMap[deptCode]?.id,
        officeId: officeMap[office]?.id,
        joiningDate: "2023-01-15",
        employmentType: "FULL_TIME",
        profileStatus: u.role === "SUPER_ADMIN" || u.role === "ADMIN" ? "APPROVED" : pick(["SUBMITTED", "APPROVED", "UNDER_REVIEW"]),
        status: "ACTIVE",
        workSchedule: "9:00 AM - 6:00 PM",
        weeklyHoliday: "Friday",
        role: u.role,
        createdById: users.find((x) => x.role === "SUPER_ADMIN")?.id,
      },
    });
    empMap[u.id] = emp;

    // Profile
    await db.employeeProfile.create({
      data: {
        employeeId: emp.id,
        dob: `${1990 + (empCounter % 10)}-0${(empCounter % 9) + 1}-1${empCounter % 9}`,
        gender: empCounter % 2 === 0 ? "Male" : "Female",
        maritalStatus: empCounter % 3 === 0 ? "Married" : "Single",
        nationality: "Bangladeshi",
        presentAddress: `House ${empCounter + 10}, Road ${empCounter + 5}, Dhaka`,
        permanentAddress: `Village ${empCounter}, Dhaka, Bangladesh`,
      },
    });

    // Education
    await db.employeeEducation.create({
      data: {
        employeeId: emp.id,
        degree: pick(["BBA", "MBA", "BSc in Computer Science", "MA in English", "BSc in Economics"]),
        institution: pick(["University of Dhaka", "BRAC University", "North South University", "Jahangirnagar University"]),
        passingYear: pick(["2018", "2019", "2020", "2021"]),
        result: pick(["3.45", "3.62", "3.78", "3.21"]),
      },
    });

    // Emergency contact
    await db.employeeEmergencyContact.create({
      data: {
        employeeId: emp.id,
        name: pick(["Mohammed Father", "Mrs. Mother", "Elder Brother"]),
        relation: pick(["Father", "Mother", "Brother"]),
        phone: "+8801" + (800000000 + Math.floor(Math.random() * 99999999)),
        address: "Dhaka, Bangladesh",
      },
    });

    // Salary (only for non-partner)
    if (u.role !== "PARTNER" && u.role !== "STUDENT") {
      const salaryMap: Record<string, number> = {
        SUPER_ADMIN: 250000, ADMIN: 120000, HR_MANAGER: 80000, COUNSELOR: 45000,
        APPLICATION_TEAM: 40000, VISA_OFFICER: 50000, FINANCE: 55000,
        MARKETING_MANAGER: 65000, ENGLISH_TRAINER: 38000, BRANCH_MANAGER: 70000,
      };
      await db.employeeSalary.create({
        data: {
          employeeId: emp.id,
          salaryAmount: salaryMap[u.role] || 35000,
          allowance: 5000,
          bonus: 10000,
          bankName: pick(["Dutch-Bangla Bank", "City Bank", "BRAC Bank", "Islami Bank"]),
          bankAccount: `${1000000000000 + empCounter}${Math.floor(Math.random() * 9999)}`,
          paymentMethod: "BANK_TRANSFER",
          effectiveDate: "2024-01-01",
          visibility: "RESTRICTED",
        },
      });
    }

    // Documents
    for (const docType of ["NID", "PASSPORT", "APPOINTMENT_LETTER"]) {
      await db.employeeDocument.create({
        data: {
          employeeId: emp.id,
          documentType: docType,
          filePath: `/private/employee-docs/${emp.id}/${docType.toLowerCase()}.pdf`,
          status: pick(["APPROVED", "PENDING", "APPROVED"]),
        },
      });
    }
  }
  console.log(`Seeded ${empCounter} employees with profiles, education, contacts, salary, documents`);

  // Feature access rules — Super Admin gets everything
  const superAdmin = users.find((u) => u.role === "SUPER_ADMIN");
  const superAdminEmp = superAdmin ? empMap[superAdmin.id] : null;
  if (superAdminEmp) {
    for (const f of FEATURE_KEYS) {
      await db.featureAccessRule.create({
        data: {
          ownerType: "EMPLOYEE",
          ownerId: superAdminEmp.id,
          featureKey: f.key,
          isEnabled: true,
          requiresApproval: f.requiresApproval,
          createdBy: superAdmin?.id || "system",
          updatedBy: superAdmin?.id || "system",
        },
      });
    }
    console.log(`Seeded ${FEATURE_KEYS.length} feature access rules for Super Admin`);
  }

  // Assign Starter Partner package to existing partner
  const partner = users.find((u) => u.role === "PARTNER");
  const partnerEmp = partner ? empMap[partner.id] : null;
  if (partnerEmp && pkgMap["Starter Partner"]) {
    await db.partnerPackageAssignment.create({
      data: {
        partnerId: partnerEmp.id,
        packageId: pkgMap["Starter Partner"].id,
        assignedBy: superAdmin?.id || "system",
        startsAt: new Date(),
        status: "ACTIVE",
      },
    });
    // Partner feature rules
    for (const f of ["partner.users.manage", "partner.student.benefit", "partner.b2b.view", "marketing.image.generate", "marketing.video.generate"]) {
      await db.featureAccessRule.create({
        data: {
          ownerType: "PARTNER",
          ownerId: partnerEmp.id,
          featureKey: f,
          isEnabled: true,
          limitValue: f === "marketing.image.generate" ? 15 : f === "marketing.video.generate" ? 10 : null,
          requiresApproval: false,
          createdBy: superAdmin?.id,
        },
      });
    }
    console.log("Assigned Starter Partner package + feature rules");
  }

  // Sample extra quota request
  if (partnerEmp) {
    await db.extraQuotaRequest.create({
      data: {
        partnerId: partnerEmp.id,
        requestType: "EXTRA_IMAGE_QUOTA",
        currentLimit: 15,
        requestedLimit: 30,
        reason: "Need more images for September intake campaign",
        status: "PENDING",
      },
    });
    console.log("Created sample extra quota request");
  }

  // Sample feature usage logs
  if (partnerEmp) {
    for (let i = 0; i < 8; i++) {
      await db.featureUsageLog.create({
        data: {
          ownerType: "PARTNER",
          ownerId: partnerEmp.id,
          featureKey: "marketing.image.generate",
          action: "image_generated",
          metadata: JSON.stringify({ campaign: "UK September", timestamp: new Date(Date.now() - i * 86400000).toISOString() }),
        },
      });
    }
    console.log("Created sample feature usage logs");
  }

  console.log("Employee Access System seed complete!");
  console.log(`- Departments: ${await db.department.count()}`);
  console.log(`- Offices: ${await db.office.count()}`);
  console.log(`- Employees: ${await db.employee.count()}`);
  console.log(`- Employee profiles: ${await db.employeeProfile.count()}`);
  console.log(`- Employee education: ${await db.employeeEducation.count()}`);
  console.log(`- Employee emergency contacts: ${await db.employeeEmergencyContact.count()}`);
  console.log(`- Employee salaries: ${await db.employeeSalary.count()}`);
  console.log(`- Employee documents: ${await db.employeeDocument.count()}`);
  console.log(`- Partner packages: ${await db.partnerPackage.count()}`);
  console.log(`- Partner package assignments: ${await db.partnerPackageAssignment.count()}`);
  console.log(`- Feature access rules: ${await db.featureAccessRule.count()}`);
  console.log(`- Extra quota requests: ${await db.extraQuotaRequest.count()}`);
  console.log(`- Feature usage logs: ${await db.featureUsageLog.count()}`);
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
