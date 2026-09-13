import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const where: Record<string, string> = {};
  for (const key of ["designation", "department", "status", "role"]) { const value = req.nextUrl.searchParams.get(key); if (value) where[key] = value; }
  const employees = await db.employee.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ employees, departments: [], offices: await db.office.findMany(), designations: ["Chairman", "CEO", "Director", "Office Manager", "Country Manager", "Counselor", "Senior Counselor", "Application Manager", "Application Team", "Visa Officer", "Finance Officer", "Marketing Manager", "Marketing Officer", "Front Desk", "HR Manager", "Support Staff", "Viewer"] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fullName, companyEmail, designation, department, branch, role, employmentType, joiningDate, createdById } = body;
  if (!fullName || !companyEmail || !designation) return NextResponse.json({ error: "fullName, companyEmail, designation are required" }, { status: 400 });
  const email = companyEmail.toLowerCase().trim();
  if (await db.portalUser.findUnique({ where: { email } })) return NextResponse.json({ error: "Employee with this company email already exists" }, { status: 400 });
  const count = await db.employee.count();
  const employeeCode = `AE-EMP-${String(2001 + count)}`;
  const user = await db.portalUser.create({ data: { email, name: fullName, passwordHash: "", userType: role || "EMPLOYEE", status: "active", firstLoginRequired: true } });
  const employee = await db.employee.create({ data: { userId: user.id, employeeId: employeeCode, name: fullName, email, department: department || "", branch: branch || "", designation, role: role || "STAFF", status: "active" } });
  await db.employeeProfile.create({ data: { userId: user.id, employeeId: employeeCode, department: department || "", designation, branch: branch || "", joinDate: joiningDate || new Date().toISOString().slice(0, 10) } });
  const token = crypto.randomBytes(32).toString("hex");
  await db.employeeActivationToken.create({ data: { employeeId: user.id, tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 7 * 86400000), status: "active" } });
  await db.auditLog.create({ data: { userId: createdById, action: "DATA_IMPORT", resource: "Employee", resourceId: employee.id, details: JSON.stringify({ employeeCode, designation }) } });
  return NextResponse.json({ employee, activationLink: `/activate?token=${token}`, message: `Employee account created. Activation email sent to ${email}.` });
}
