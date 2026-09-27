import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canViewEmployeePrivateProfile, logSensitiveAccess } from "@/lib/access-control";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

async function getEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const viewerId = auth.userId;
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [profile, documents, salary] = await Promise.all([
    db.employeeProfile.findUnique({ where: { userId: employee.userId } }),
    db.employeeDocument.findMany({ where: { employeeId: id } }),
    db.employeeSalary.findFirst({ where: { employeeId: id } }),
  ]);
  const canViewPrivate = viewerId ? await canViewEmployeePrivateProfile(viewerId, id) : false;
  if (canViewPrivate && viewerId) await logSensitiveAccess(viewerId, "SALARY_ACCESS", "Employee", id);
  return NextResponse.json({ employee: { ...employee, profile: canViewPrivate ? profile : profile ? { ...profile, salary: null, bankAccount: null, bankName: null, bankRouting: null, emergencyContact: null } : null, documents: canViewPrivate ? documents : documents.map((document) => ({ ...document, filePath: null })), salary: canViewPrivate ? salary : null }, canViewPrivate, privacyNote: canViewPrivate ? "Private access is audit-logged." : "Private profile data is hidden." });
}

async function updateEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const body = await req.json();
  const { status, designation, department, branch, role } = body;
  const employee = await db.employee.update({ where: { id }, data: { ...(status && { status }), ...(designation && { designation }), ...(department && { department }), ...(branch && { branch }), ...(role && { role }) } });
  await db.auditLog.create({ data: { userId: auth.userId, action: "ROLE_CHANGE", resource: "Employee", resourceId: id, details: JSON.stringify({ status, designation, department, branch, role }) } });
  return NextResponse.json({ employee });
}

export const GET = withAuth(getEmployee, { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"] });
export const PATCH = withAuth(updateEmployee, { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"] });
