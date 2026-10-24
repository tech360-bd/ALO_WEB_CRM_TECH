import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';

const LEAVE_TYPES = new Set(['casual', 'annual', 'medical', 'maternity', 'paternity', 'lwp', 'compensatory']);
const LEAVE_STATUSES = new Set(['pending', 'approved', 'rejected', 'cancelled']);
type EmployeeScope = { id: string; userId: string; employeeId: string; status: string; branch: string; profileId?: string; profileEmployeeId?: string };

async function getActiveEmployee(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const roles = [auth.userType, ...auth.roles].map((role) => role.trim().toUpperCase());
  if (auth.identityDomain !== 'user' || roles.some((role) => ['STUDENT', 'PARTNER'].includes(role))) {
    return NextResponse.json({ success: false, error: 'Employee access is required.' }, { status: 403 });
  }
  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, userId: true, employeeId: true, status: true, branch: true },
  }).catch(() => null);
  if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
  const profile = await db.employeeProfile.findUnique({ where: { userId: auth.userId }, select: { id: true, employeeId: true } }).catch(() => null);
  return { auth, employee: { ...employee, profileId: profile?.id, profileEmployeeId: profile?.employeeId } };
}

function aliases(employee: EmployeeScope): string[] {
  return [...new Set([employee.id, employee.userId, employee.employeeId, employee.profileId, employee.profileEmployeeId].filter((value): value is string => Boolean(value)))];
}
function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function canReadAll(auth: AuthContext) { return auth.permissions.includes('employee.leave.view_all'); }
function canApproveCompanyWide(auth: AuthContext) { return auth.permissions.includes('employee.leave.approve_all'); }

async function expandedEmployeeIds(employees: Array<{ id: string; userId: string; employeeId: string }>) {
  const profiles = await db.employeeProfile.findMany({ where: { userId: { in: employees.map((item) => item.userId) } }, select: { id: true, employeeId: true } });
  return [...new Set([...employees.flatMap((item) => [item.id, item.userId, item.employeeId]), ...profiles.flatMap((profile) => [profile.id, profile.employeeId])].filter(Boolean))];
}

async function leaveScope(auth: AuthContext, employee: EmployeeScope, requestedId: string | null) {
  const ownIds = aliases(employee);
  if (requestedId && !ownIds.includes(requestedId) && !canReadAll(auth)) return null;
  if (!canReadAll(auth) || requestedId) {
    if (requestedId && !ownIds.includes(requestedId)) {
      let target = await db.employee.findFirst({
        where: { OR: [{ id: requestedId }, { userId: requestedId }, { employeeId: requestedId }], status: 'active' },
        select: { id: true, userId: true, employeeId: true, status: true, branch: true },
      });
      let targetProfileId: string | undefined;
      if (!target) {
        const profile = await db.employeeProfile.findUnique({ where: { id: requestedId }, select: { id: true, userId: true, employeeId: true } });
        if (!profile) return null;
        target = await db.employee.findUnique({ where: { userId: profile.userId }, select: { id: true, userId: true, employeeId: true, status: true, branch: true } });
        targetProfileId = profile.id;
      }
      if (!target || target.status.toLowerCase() !== 'active') return null;
      if (!canApproveCompanyWide(auth) && (!employee.branch || target.branch !== employee.branch)) return null;
      return aliases({ ...target, profileId: targetProfileId });
    }
    return ownIds;
  }
  if (canApproveCompanyWide(auth)) {
    const activeEmployees = await db.employee.findMany({ where: { status: 'active' }, select: { id: true, userId: true, employeeId: true } });
    return expandedEmployeeIds(activeEmployees);
  }
  if (!employee.branch) return ownIds;
  const branchEmployees = await db.employee.findMany({ where: { branch: employee.branch, status: 'active' }, select: { id: true, userId: true, employeeId: true } });
  return expandedEmployeeIds(branchEmployees);
}

export async function GET(req: NextRequest) {
  try {
    const access = await getActiveEmployee(req);
    if (access instanceof NextResponse) return access;
    const { auth, employee } = access;
    if (!auth.permissions.includes('employee.leave.view')) return NextResponse.json({ success: false, error: 'Leave-view permission is required.' }, { status: 403 });
    const params = req.nextUrl.searchParams;
    const requestedId = params.get('employeeId');
    const status = params.get('status')?.toLowerCase() || '';
    const limitText = params.get('limit') || '100';
    if (!/^\d+$/.test(limitText) || Number(limitText) < 1 || Number(limitText) > 100) return NextResponse.json({ success: false, error: 'Limit must be between 1 and 100.' }, { status: 400 });
    if (status && !LEAVE_STATUSES.has(status)) return NextResponse.json({ success: false, error: 'Invalid leave status.' }, { status: 400 });
    const employeeIds = await leaveScope(auth, employee, requestedId);
    if (!employeeIds) return NextResponse.json({ success: false, error: 'Requested leave scope is not permitted.' }, { status: 403 });
    const where = { employeeId: { in: employeeIds }, ...(status ? { status } : {}) };
    const [leaves, total, balance] = await Promise.all([
      db.employeeLeave.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limitText),
        select: { id: true, employeeId: true, leaveType: true, startDate: true, endDate: true, totalDays: true, reason: true, status: true, approvedBy: true, approvedAt: true, createdAt: true, updatedAt: true },
      }),
      db.employeeLeave.count({ where }),
      (!canReadAll(auth) || (requestedId !== null && aliases(employee).includes(requestedId))) ? db.employeeLeaveBalance.findFirst({
        where: { employeeId: { in: employeeIds } },
        select: { year: true, casualTotal: true, casualUsed: true, casualRemaining: true, annualTotal: true, annualUsed: true, annualRemaining: true, medicalTotal: true, medicalUsed: true, medicalRemaining: true, maternityTotal: true, maternityUsed: true, maternityRemaining: true, paternityTotal: true, paternityUsed: true, lwpTotal: true, lwpUsed: true, compOffTotal: true, compOffUsed: true, compOffRemaining: true },
      }) : Promise.resolve(null),
    ]);
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId || auth.userId, action: 'EMPLOYEE_LEAVE_VIEWED', entityType: 'EmployeeLeave', entityId: employee.id, metadata: JSON.stringify({ effectiveUserId: auth.userId, scope: employeeIds.length === 1 ? 'SELF' : 'AUTHORIZED_BRANCH_OR_HR', count: total }) } });
    return NextResponse.json({ success: true, leaves, balance, total, types: [...LEAVE_TYPES] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Employee leave GET error:', error);
    return NextResponse.json({ success: false, error: 'Leave information is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getActiveEmployee(req);
    if (access instanceof NextResponse) return access;
    const { auth, employee } = access;
    if (!auth.permissions.includes('employee.leave.create')) return NextResponse.json({ success: false, error: 'Leave-request permission is required.' }, { status: 403 });
    if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid leave request is required.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (Object.keys(input).some((key) => !['leaveType', 'startDate', 'endDate', 'reason'].includes(key))) return NextResponse.json({ success: false, error: 'Unsupported leave request fields.' }, { status: 400 });
    const leaveType = typeof input.leaveType === 'string' ? input.leaveType.toLowerCase() : '';
    const startDate = input.startDate;
    const endDate = input.endDate;
    const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
    if (!LEAVE_TYPES.has(leaveType) || !validDate(startDate) || !validDate(endDate) || endDate < startDate || !reason || reason.length > 2000) return NextResponse.json({ success: false, error: 'Leave type, dates, or reason is invalid.' }, { status: 400 });
    const totalDays = Math.floor((Date.parse(`${endDate}T00:00:00.000Z`) - Date.parse(`${startDate}T00:00:00.000Z`)) / 86_400_000) + 1;
    if (totalDays > 366) return NextResponse.json({ success: false, error: 'Leave request cannot exceed 366 calendar days.' }, { status: 400 });
    const leave = await db.$transaction(async (tx) => {
      const created = await tx.employeeLeave.create({
        data: { employeeId: employee.id, leaveType, startDate, endDate, totalDays, reason, status: 'pending' },
        select: { id: true, employeeId: true, leaveType: true, startDate: true, endDate: true, totalDays: true, reason: true, status: true, createdAt: true },
      });
      await writePortalAudit(tx, auth, 'EMPLOYEE_LEAVE_REQUESTED', 'EmployeeLeave', created.id, { employeeId: employee.id, leaveType, startDate, endDate, totalDays }, req);
      return created;
    });
    return NextResponse.json({ success: true, data: leave }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Employee leave POST error:', error);
    return NextResponse.json({ success: false, error: 'Leave request could not be submitted.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const access = await getActiveEmployee(req);
    if (access instanceof NextResponse) return access;
    const { auth, employee } = access;
    if (!auth.permissions.includes('employee.leave.approve')) return NextResponse.json({ success: false, error: 'Leave-approval permission is required.' }, { status: 403 });
    if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid leave decision is required.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (Object.keys(input).some((key) => !['id', 'status'].includes(key))) return NextResponse.json({ success: false, error: 'Unsupported leave decision fields.' }, { status: 400 });
    const id = typeof input.id === 'string' ? input.id.trim() : '';
    const status = typeof input.status === 'string' ? input.status.toLowerCase() : '';
    if (!id || id.length > 191 || !['approved', 'rejected'].includes(status)) return NextResponse.json({ success: false, error: 'Leave ID and an approved/rejected decision are required.' }, { status: 400 });
    const existing = await db.employeeLeave.findUnique({ where: { id }, select: { id: true, employeeId: true, status: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Leave request not found.' }, { status: 404 });
    let target = await db.employee.findFirst({ where: { OR: [{ id: existing.employeeId }, { userId: existing.employeeId }, { employeeId: existing.employeeId }], status: 'active' }, select: { id: true, userId: true, employeeId: true, status: true, branch: true } });
    let targetProfile = target ? await db.employeeProfile.findUnique({ where: { userId: target.userId }, select: { id: true, userId: true, employeeId: true } }) : null;
    if (!target) {
      targetProfile = await db.employeeProfile.findUnique({ where: { id: existing.employeeId }, select: { id: true, userId: true, employeeId: true } });
      if (targetProfile) target = await db.employee.findUnique({ where: { userId: targetProfile.userId }, select: { id: true, userId: true, employeeId: true, status: true, branch: true } });
    }
    if (!target || target.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Leave owner mapping is unavailable.' }, { status: 409 });
    const targetScope = { ...target, profileId: targetProfile?.id, profileEmployeeId: targetProfile?.employeeId };
    if (aliases(targetScope).includes(auth.userId) || aliases(targetScope).includes(employee.id) || aliases(targetScope).includes(employee.profileId || '')) return NextResponse.json({ success: false, error: 'Employees cannot approve or reject their own leave.' }, { status: 403 });
    if (!canApproveCompanyWide(auth) && (!employee.branch || employee.branch !== target.branch)) return NextResponse.json({ success: false, error: 'Leave request is outside your branch scope.' }, { status: 403 });
    if (existing.status !== 'pending') return NextResponse.json({ success: false, error: 'Only pending leave requests can be decided.' }, { status: 409 });
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.employeeLeave.updateMany({ where: { id, status: 'pending' }, data: { status, approvedBy: employee.id, approvedAt: new Date() } });
      if (result.count !== 1) throw new Error('leave_changed');
      await writePortalAudit(tx, auth, `EMPLOYEE_LEAVE_${status.toUpperCase()}`, 'EmployeeLeave', id, { ownerEmployeeId: target.id, status }, req);
      return tx.employeeLeave.findUnique({ where: { id }, select: { id: true, employeeId: true, leaveType: true, startDate: true, endDate: true, totalDays: true, status: true, approvedBy: true, approvedAt: true, updatedAt: true } });
    });
    return NextResponse.json({ success: true, data: updated }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'leave_changed') return NextResponse.json({ success: false, error: 'Leave request changed before the decision was saved.' }, { status: 409 });
    console.error('Employee leave PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Leave decision could not be saved.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
