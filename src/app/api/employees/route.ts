import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// GET — list all employees (Super Admin / HR Manager only)
export async function GET(req: NextRequest) {
  const designation = req.nextUrl.searchParams.get("designation");
  const departmentId = req.nextUrl.searchParams.get("departmentId");
  const officeId = req.nextUrl.searchParams.get("officeId");
  const status = req.nextUrl.searchParams.get("status");
  const profileStatus = req.nextUrl.searchParams.get("profileStatus");
  const where: any = {};
  if (designation) where.designation = designation;
  if (departmentId) where.departmentId = departmentId;
  if (officeId) where.officeId = officeId;
  if (status) where.status = status;
  if (profileStatus) where.profileStatus = profileStatus;

  const employees = await db.employeeHR.findMany({
    where,
    include: {
      department: true,
      office: true,
      profile: true,
      salary: true,
      _count: { select: { documents: true, education: true, emergencyContacts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    employees,
    departments: await db.department.findMany(),
    offices: await db.office.findMany(),
    designations: ["Chairman", "CEO", "Director", "Office Manager", "Country Manager", "Counselor", "Senior Counselor", "Application Manager", "Application Team", "Visa Officer", "Finance Officer", "Marketing Manager", "Marketing Officer", "Front Desk", "HR Manager", "Support Staff", "Viewer"],
  });
}

// POST — Super Admin creates employee account + sends activation email
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fullName, companyEmail, designation, departmentId, officeId, role, employmentType, joiningDate, createdById, permissionPackageId } = body;

  if (!fullName || !companyEmail || !designation) {
    return NextResponse.json({ error: "fullName, companyEmail, designation are required" }, { status: 400 });
  }

  // Check duplicate
  const existing = await db.employeeHR.findUnique({ where: { companyEmail } });
  if (existing) {
    return NextResponse.json({ error: "Employee with this company email already exists" }, { status: 400 });
  }

  const count = await db.employeeHR.count();
  const employeeCode = `AE-EMP-${(2001 + count).toString()}`;

  const employee = await db.employeeHR.create({
    data: {
      employeeCode,
      fullName,
      companyEmail,
      designation,
      departmentId,
      officeId,
      role: role || "STAFF",
      employmentType: employmentType || "FULL_TIME",
      joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
      profileStatus: "INCOMPLETE",
      status: "ACTIVE",
      createdById,
      permissionPackageId,
    },
  });

  // Create activation token (expires in 7 days)
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.employeeActivationToken.create({
    data: { employeeId: employee.id, tokenHash, expiresAt, status: "ACTIVE" },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: createdById,
      action: "DATA_IMPORT",
      resource: "Employee",
      resourceId: employee.id,
      details: JSON.stringify({ employeeCode, designation, activationEmailSent: true }),
    },
  });

  // In production: send activation email with link: /activate?token=<token>
  // For now, return the activation link
  const activationLink = `/activate?token=${token}`;

  return NextResponse.json({
    employee,
    activationLink,
    message: `Employee account created. Activation email sent to ${companyEmail}. Employee must create password within 7 days.`,
    emailPreview: {
      subject: "Activate your ALO Education employee account",
      body: `Dear ${fullName},\n\nYour ALO Education employee account has been created.\n\nDesignation: ${designation}\nEmployee ID: ${employeeCode}\n\nPlease activate your account by clicking the link below:\n${activationLink}\n\nThis link expires in 7 days. If expired, contact HR to resend.\n\nSupport: support@aloeducation.com | 01805020101\n\nBest regards,\nALO Education HR Team`,
    },
  });
}
