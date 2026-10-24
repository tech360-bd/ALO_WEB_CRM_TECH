import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';
import { MAX_TEMPORARY_PERMISSION_DAYS, TEMPORARY_EMPLOYEE_VIEW_FEATURES, temporaryPermissionIsEffective } from '@/lib/employee-temporary-permissions';

const grantSelect = {
  id: true,
  employeeId: true,
  featureKey: true,
  action: true,
  scopeType: true,
  scopeId: true,
  grantedBy: true,
  approvedBy: true,
  reason: true,
  startDate: true,
  endDate: true,
  expiresAt: true,
  active: true,
  isActive: true,
  createdAt: true,
} as const;

function canReview(auth: AuthContext): boolean {
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  return roles.has('super_admin')
    || ((roles.has('hr') || roles.has('hr_manager')) && auth.permissions.includes('employee.permission_requests.approve'));
}

function aliases(employee: { id: string; userId: string; employeeId?: string | null }): string[] {
  return [...new Set([employee.id, employee.userId, employee.employeeId].filter((value): value is string => Boolean(value)))];
}

function cleanReason(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const reason = value.trim();
  if (reason.length < 10 || reason.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(reason)) return null;
  return reason;
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  try {
    const own = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, userId: true, employeeId: true, status: true } });
    if (!own || own.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
    }
    const reviewer = canReview(auth);
    const requestedId = new URL(req.url).searchParams.get('employeeId')?.trim();
    let target = own;
    if (requestedId && !aliases(own).includes(requestedId)) {
      if (!reviewer) return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
      const requestedTarget = await db.employee.findFirst({ where: { OR: [{ id: requestedId }, { userId: requestedId }, { employeeId: requestedId }] }, select: { id: true, userId: true, employeeId: true, status: true } });
      if (!requestedTarget) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
      target = requestedTarget;
    }
    const allEmployees = !requestedId && reviewer;
    const grants = await db.employeeTemporaryPermission.findMany({
      where: allEmployees ? { active: true, isActive: true } : { employeeId: { in: aliases(target) }, active: true, isActive: true },
      orderBy: { endDate: 'asc' },
      take: 200,
      select: grantSelect,
    });
    const now = new Date();
    const permissions = grants.map((grant) => {
      const effective = temporaryPermissionIsEffective(grant, now);
      return {
        ...grant,
        active: effective,
        isActive: effective,
        effectiveStatus: effective ? 'ACTIVE' : grant.startDate > now ? 'SCHEDULED' : 'EXPIRED',
      };
    });
    await db.$transaction(async (tx) => {
      await writePortalAudit(tx, auth, 'TEMPORARY_PERMISSIONS_VIEWED', 'EmployeeTemporaryPermission', allEmployees ? 'authorized-all' : target.id, {
        effectiveUserId: auth.userId,
        employeeId: allEmployees ? undefined : target.id,
        count: permissions.length,
        scope: allEmployees ? 'AUTHORIZED_HR' : target.userId === auth.userId ? 'SELF' : 'AUTHORIZED_HR',
      }, req);
    });
    return NextResponse.json({ success: true, permissions }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Temporary permissions are unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;
  if (auth.actingAsSessionId) return NextResponse.json({ success: false, error: 'Temporary permissions cannot be granted while Acting-As.' }, { status: 403 });
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  if (!canReview(auth)) return NextResponse.json({ success: false, error: 'Independent HR permission approval authority required.' }, { status: 403 });

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid temporary permission is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['employeeId', 'featureKey', 'action', 'scopeType', 'scopeId', 'reason', 'endDate'].includes(key))) {
    return NextResponse.json({ success: false, error: 'Unsupported temporary permission field.' }, { status: 400 });
  }
  const employeeId = typeof input.employeeId === 'string' ? input.employeeId.trim() : '';
  const featureKey = typeof input.featureKey === 'string' ? input.featureKey.trim() : '';
  const action = typeof input.action === 'string' ? input.action.toLowerCase() : 'view';
  const scopeType = typeof input.scopeType === 'string' ? input.scopeType.toUpperCase() : 'OWN';
  const scopeId = typeof input.scopeId === 'string' ? input.scopeId.trim() : '';
  const reason = cleanReason(input.reason);
  const starts = new Date();
  const ends = typeof input.endDate === 'string' ? new Date(input.endDate) : new Date(Number.NaN);
  const now = Date.now();
  const maxEnd = now + MAX_TEMPORARY_PERMISSION_DAYS * 24 * 60 * 60 * 1000;
  if (!employeeId || employeeId.length > 191 || !TEMPORARY_EMPLOYEE_VIEW_FEATURES.has(featureKey) || action !== 'view'
    || !['OWN', 'ASSIGNED'].includes(scopeType) || scopeId || !reason
    || !Number.isFinite(ends.getTime()) || ends.getTime() <= now || ends.getTime() > maxEnd) {
    return NextResponse.json({ success: false, error: 'Only scoped, view-only access for up to 30 days with a valid reason can be granted.' }, { status: 400 });
  }

  try {
    const grant = await db.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({ where: { OR: [{ id: employeeId }, { userId: employeeId }, { employeeId }] }, select: { id: true, userId: true, employeeId: true, status: true } });
      if (!employee || employee.status.toLowerCase() !== 'active') throw new Error('active employee required');
      if (employee.userId === auth.userId) throw new Error('self grant denied');
      const duplicate = await tx.employeeTemporaryPermission.findFirst({ where: {
        employeeId: employee.id, featureKey, action, scopeType: scopeType.toLowerCase(), isActive: true, active: true,
        startDate: { lte: new Date() }, endDate: { gt: new Date() }, expiresAt: { gt: new Date() },
      }, select: { id: true } });
      if (duplicate) throw new Error('active grant exists');
      const created = await tx.employeeTemporaryPermission.create({ data: {
        employeeId: employee.id,
        featureKey,
        permissionKey: featureKey,
        expiresAt: ends,
        active: true,
        approvedBy: auth.actorUserId || auth.userId,
        action,
        scopeType: scopeType.toLowerCase(),
        scopeId: '',
        grantedBy: auth.actorUserId || auth.userId,
        reason,
        startDate: starts,
        endDate: ends,
        isActive: true,
      }, select: grantSelect });
      await writePortalAudit(tx, auth, 'TEMPORARY_PERMISSION_GRANTED', 'EmployeeTemporaryPermission', created.id, {
        employeeId: employee.id, featureKey, action, scopeType, endDate: ends.toISOString(), reason,
      }, req);
      return created;
    });
    return NextResponse.json({ success: true, data: grant }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'self grant denied') return NextResponse.json({ success: false, error: 'Cannot grant a temporary permission to yourself.' }, { status: 403 });
    if (message === 'active employee required') return NextResponse.json({ success: false, error: 'An active employee is required.' }, { status: 422 });
    if (message === 'active grant exists') return NextResponse.json({ success: false, error: 'An equivalent temporary permission is already active.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Temporary permission could not be granted.' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;
  if (auth.actingAsSessionId) return NextResponse.json({ success: false, error: 'Temporary permissions cannot be revoked while Acting-As.' }, { status: 403 });
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid revocation request is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['id', 'reason'].includes(key))) return NextResponse.json({ success: false, error: 'Unsupported revocation field.' }, { status: 400 });
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const reason = cleanReason(input.reason);
  if (!id || id.length > 191 || !reason) return NextResponse.json({ success: false, error: 'A permission id and a 10–500 character reason are required.' }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const grant = await tx.employeeTemporaryPermission.findUnique({ where: { id }, select: grantSelect });
      if (!grant) throw new Error('grant not found');
      const target = await tx.employee.findFirst({ where: { OR: [{ id: grant.employeeId }, { userId: grant.employeeId }, { employeeId: grant.employeeId }] }, select: { id: true, userId: true, employeeId: true } });
      if (!target) throw new Error('employee not found');
      const self = aliases(target).includes(auth.userId);
      if (!self && !canReview(auth)) throw new Error('permission denied');
      if (!grant.active || !grant.isActive) throw new Error('grant already inactive');
      const updated = await tx.employeeTemporaryPermission.updateMany({ where: { id, employeeId: grant.employeeId, active: true, isActive: true }, data: { active: false, isActive: false } });
      if (updated.count !== 1) throw new Error('grant changed');
      await writePortalAudit(tx, auth, 'TEMPORARY_PERMISSION_REVOKED', 'EmployeeTemporaryPermission', id, {
        employeeId: target.id, featureKey: grant.featureKey, action: grant.action, reason, immediate: true,
      }, req);
      return { id, revoked: true };
    });
    return NextResponse.json({ success: true, data: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'grant not found' || message === 'employee not found') return NextResponse.json({ success: false, error: 'Temporary permission not found.' }, { status: 404 });
    if (message === 'permission denied') return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
    if (message === 'grant already inactive' || message === 'grant changed') return NextResponse.json({ success: false, error: 'Temporary permission is already inactive or changed.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Temporary permission could not be revoked.' }, { status: 503 });
  }
}
