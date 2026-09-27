import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import crypto from "crypto";

async function listEmployees(req: Request, _auth: AuthContext) {
  const where: Record<string, string> = {};
  const searchParams = new URL(req.url).searchParams;
  for (const key of ["designation", "department", "status", "role"]) { const value = searchParams.get(key); if (value) where[key] = value; }
  const employees = await db.employee.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ employees, departments: [], offices: await db.office.findMany(), designations: ["Chairman", "CEO", "Director", "Office Manager", "Country Manager", "Counselor", "Senior Counselor", "Application Manager", "Application Team", "Visa Officer", "Finance Officer", "Marketing Manager", "Marketing Officer", "Front Desk", "HR Manager", "Support Staff", "Viewer"] });
}

async function createEmployee(req: Request, auth: AuthContext) {
  const body = await req.json();
  const { fullName, companyEmail, designation, department, branch, role, employmentType, joiningDate } = body;
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
  await db.auditLog.create({ data: { userId: auth.userId, action: "DATA_IMPORT", resource: "Employee", resourceId: employee.id, details: JSON.stringify({ employeeCode, designation }) } });
  return NextResponse.json({ employee, activationLink: `/activate?token=${token}`, message: `Employee account created. Activation email sent to ${email}.` });
}

export const GET = withAuth(listEmployees, { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"] });
export const POST = withAuth(createEmployee, { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"] });
