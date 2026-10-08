import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import { createEmployeeAccount } from "@/lib/employees/create";

async function listEmployees(req: Request, _auth: AuthContext) {
  const where: Record<string, string> = {};
  const searchParams = new URL(req.url).searchParams;
  for (const key of ["designation", "department", "status", "role"]) { const value = searchParams.get(key); if (value) where[key] = value; }
  const employees = await db.employee.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ employees, departments: [], offices: await db.office.findMany(), designations: ["Chairman", "CEO", "Director", "Office Manager", "Country Manager", "Counselor", "Senior Counselor", "Application Manager", "Application Team", "Visa Officer", "Finance Officer", "Marketing Manager", "Marketing Officer", "Front Desk", "HR Manager", "Support Staff", "Viewer"] });
}

async function createEmployee(req: Request, auth: AuthContext) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }
  const result = await createEmployeeAccount(body as Record<string, unknown>, auth, req);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  const deliveryMessage = result.emailSent
    ? 'Employee account created. Activation email was accepted by the configured SMTP provider.'
    : 'Employee account created but the activation email was not accepted by SMTP. Correct email configuration, then use the authenticated resend workflow.';
  return NextResponse.json({
    success: true,
    message: deliveryMessage,
    emailSent: result.emailSent,
    ...(result.emailError ? { emailError: result.emailError } : {}),
    employee: result.data,
  }, { status: result.status });
}

export const GET = withAuth(listEmployees, { requireRoles: ['super_admin', 'admin', 'hr_manager'] });
export const POST = withAuth(createEmployee, { requireRoles: ['super_admin', 'admin', 'hr_manager'] });
