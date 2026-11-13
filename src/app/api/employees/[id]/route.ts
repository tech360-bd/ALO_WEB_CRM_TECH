import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewEmployeePrivateProfile } from '@/lib/access-control';
import { canViewField, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { writePortalAudit } from '@/lib/transactional-audit';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

async function getEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const canViewPrivate = await canViewEmployeePrivateProfile(auth.userId, id);
  if (!canViewPrivate) return NextResponse.json({ error: 'Private employee profile permission required.' }, { status: 403 });
  const own = employee.userId === auth.userId;
  const [bankAccess, nidAccess, salaryAccess] = await Promise.all([
    canViewField(auth.userId, [], 'bankAccount', id), canViewField(auth.userId, [], 'nid', id),
    own ? Promise.resolve(false) : canViewField(auth.userId, [], 'salary', id),
  ]);
  const [profile, documents, salary] = await Promise.all([
    db.employeeProfile.findUnique({ where: { userId: employee.userId } }),
    db.employeeDocument.findMany({ where: { employeeId: id }, select: { id: true, documentType: true, status: true, createdAt: true, updatedAt: true } }),
    salaryAccess ? db.employeeSalary.findFirst({ where: { employeeId: id } }) : Promise.resolve(null),
  ]);
  await db.$transaction(async tx => { await writePortalAudit(tx, auth, 'PROFILE_VIEWED', 'Employee', id, { private: true, salaryIncluded: salaryAccess }, req); });
  return NextResponse.json({
    employee: { id: employee.id, employeeId: employee.employeeId, userId: employee.userId, name: employee.name, designation: employee.designation, department: employee.department, branch: employee.branch, status: employee.status,
      profile: profile ? { ...profile, salary: salaryAccess ? profile.salary : null, bankAccount: bankAccess ? profile.bankAccount : null, bankName: bankAccess ? profile.bankName : null, bankRouting: bankAccess ? profile.bankRouting : null, nidNumber: nidAccess ? profile.nidNumber : null } : null,
      documents, salary: salary ? { id: salary.id, employeeId: salary.employeeId, basicSalary: salary.basicSalary, housingAllow: salary.housingAllow, transportAllow: salary.transportAllow, medicalAllow: salary.medicalAllow, otherAllow: salary.otherAllow, grossSalary: salary.grossSalary, taxDeduction: salary.taxDeduction, pfDeduction: salary.pfDeduction, netSalary: salary.netSalary, currency: salary.currency, effectiveFrom: salary.effectiveFrom } : null },
    canViewPrivate: true,
    privacyNote: own ? 'Private access is audit-logged. Final approved payslips are available through your salary page.' : 'Private access is audit-logged.',
  });
}

async function updateEmployee(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(process.env.NEXTAUTH_URL || req.url).origin) return NextResponse.json({ error: 'Cross-origin mutation denied.' }, { status: 403 });
  const action = body.status ? 'suspend' : 'edit';
  const access = await validateRequestAccess({ userId: auth.userId }, 'employee.management', action, { ownerId: employee.userId, branchId: employee.branch, departmentId: employee.department });
  if (!access.allowed || (body.status && (auth.actingAsSessionId || employee.userId === auth.userId))) return NextResponse.json({ error: 'Employee management permission and separation of duties required.' }, { status: 403 });


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
    await writePortalAudit(tx, auth, requestedStatus ? 'employee_status_changed' : 'employee_profile_updated', 'Employee', id, {
      previous: employee, current: row, fields: Object.keys(updates),
    }, req);
    return row;
  });
  return NextResponse.json({ employee: updated });
}

export const GET = withAuth(getEmployee);
export const PATCH = withAuth(updateEmployee, { requireRoles: ['super_admin', 'admin', 'hr_manager'] });
