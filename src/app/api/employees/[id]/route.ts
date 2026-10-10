import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewEmployeePrivateProfile, logSensitiveAccess } from '@/lib/access-control';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';

async function getEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [profile, documents, salary] = await Promise.all([
    db.employeeProfile.findUnique({ where: { userId: employee.userId } }),
    db.employeeDocument.findMany({ where: { employeeId: id } }),
    db.employeeSalary.findFirst({ where: { employeeId: id } }),
  ]);
  const canViewPrivate = await canViewEmployeePrivateProfile(auth.userId, id);
  if (canViewPrivate) await logSensitiveAccess(auth.userId, 'SALARY_ACCESS', 'Employee', id);
  return NextResponse.json({
    employee: { ...employee, profile: canViewPrivate ? profile : profile ? { ...profile, salary: null, bankAccount: null, bankName: null, bankRouting: null, emergencyContact: null } : null, documents: canViewPrivate ? documents : documents.map((document) => ({ ...document, filePath: null })), salary: canViewPrivate ? salary : null },
    canViewPrivate,
    privacyNote: canViewPrivate ? 'Private access is audit-logged.' : 'Private profile data is hidden.',
  });
}

async function updateEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });

  const updates: Record<string, string> = {};
  for (const field of ['designation', 'department', 'branch'] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string' || body[field].length > 191) return NextResponse.json({ success: false, error: `Invalid ${field}.` }, { status: 400 });
      updates[field] = body[field].trim();
    }
  }

  const requestedStatus = typeof body.status === 'string' ? body.status.toLowerCase() : undefined;
  if (requestedStatus && !['active', 'suspended'].includes(requestedStatus)) {
    return NextResponse.json({ success: false, error: 'Use the lifecycle workflow for terminal or activation states.' }, { status: 400 });
  }
  if (!requestedStatus && Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: 'No supported employee fields were supplied.' }, { status: 400 });
  }

  const portalUser = await db.portalUser.findUnique({ where: { id: employee.userId } });
  if (!portalUser || portalUser.userType !== 'EMPLOYEE') {
    return NextResponse.json({ success: false, error: 'Linked employee login account was not found.' }, { status: 409 });
  }
  if (requestedStatus === 'active') {
    if (['terminated', 'resigned', 'blocked'].includes(portalUser.status.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Terminated or blocked employee accounts cannot be reactivated here.' }, { status: 409 });
    }
    if (portalUser.firstLoginRequired || !portalUser.emailVerified || !portalUser.passwordHash) {
      return NextResponse.json({ success: false, error: 'Employee must complete the one-time activation flow before reactivation.' }, { status: 409 });
    }
  }

  const status = requestedStatus || employee.status;
  const updated = await db.$transaction(async (tx) => {
    const row = await tx.employee.update({ where: { id }, data: { ...updates, ...(requestedStatus ? { status: requestedStatus } : {}) } });
    if (requestedStatus) {
      await tx.portalUser.update({ where: { id: portalUser.id }, data: { status: requestedStatus } });
      if (requestedStatus !== 'active') {
        await tx.portalSession.updateMany({ where: { userId: portalUser.id, revokedAt: null }, data: { revokedAt: new Date() } });
        await tx.employeeActivationToken.updateMany({ where: { employeeId: portalUser.id, status: 'active' }, data: { status: 'expired' } });
      }
    }
    return row;
  });
  await logAuditAction(auth, requestedStatus ? 'employee_status_changed' : 'employee_profile_updated', 'Employee', id, {
    previousStatus: employee.status,
    nextStatus: status,
    fields: Object.keys(updates),
  });
  return NextResponse.json({ employee: updated });
}

export const GET = withAuth(getEmployee, { requireRoles: ['super_admin', 'admin', 'hr_manager'] });
export const PATCH = withAuth(updateEmployee, { requireRoles: ['super_admin', 'admin', 'hr_manager'] });
