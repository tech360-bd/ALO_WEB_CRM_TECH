import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';
import { MAX_TEMPORARY_PERMISSION_DAYS, TEMPORARY_EMPLOYEE_VIEW_FEATURES } from '@/lib/employee-temporary-permissions';

const REQUESTABLE_FEATURES = TEMPORARY_EMPLOYEE_VIEW_FEATURES;
const STATUS_FILTERS = new Set(['requested', 'reviewing', 'active', 'approved', 'rejected', 'expired']);

function roleSet(auth: AuthContext): Set<string> {
  return new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
}

function canReview(auth: AuthContext): boolean {
  const roles = roleSet(auth);
  return roles.has('super_admin') || ((roles.has('hr_manager') || roles.has('hr')) && auth.permissions.includes('employee.permission_requests.approve'));
}

async function getActiveEmployee(auth: AuthContext) {
  if (roleSet(auth).has('student') || roleSet(auth).has('partner')) return null;
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, userId: true, employeeId: true, name: true, status: true } });
  return employee && employee.status.toLowerCase() === 'active' ? employee : null;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(request.url);
  const reviewAccess = canReview(auth);
  const ownEmployee = await getActiveEmployee(auth).catch(() => null);
  if (!reviewAccess && !ownEmployee) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });

  const status = searchParams.get('status')?.toLowerCase();
  if (status && !STATUS_FILTERS.has(status)) return NextResponse.json({ success: false, error: 'Invalid permission-request status.' }, { status: 400 });
  const requestedEmployee = searchParams.get('employeeId')?.trim();
  let targetEmployee = ownEmployee;
  if (requestedEmployee) {
    if (!reviewAccess && ![auth.userId, ownEmployee?.id, ownEmployee?.employeeId].includes(requestedEmployee)) {
      return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
    }
    targetEmployee = await db.employee.findFirst({ where: { OR: [{ id: requestedEmployee }, { userId: requestedEmployee }, { employeeId: requestedEmployee }] }, select: { id: true, userId: true, employeeId: true, name: true, status: true } });
    if (!targetEmployee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
  }
  const where = {
    ...(reviewAccess && !requestedEmployee ? {} : { employeeId: { in: [...new Set([targetEmployee?.id, targetEmployee?.userId, targetEmployee?.employeeId].filter((value): value is string => Boolean(value)))] } }),
    ...(status ? { status } : {}),
  };
  try {
    const requests = await db.employeePermissionRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const employeeIds = [...new Set(requests.map((item) => item.employeeId))];
    const employeeRows = employeeIds.length ? await db.employee.findMany({ where: { OR: [{ id: { in: employeeIds } }, { userId: { in: employeeIds } }, { employeeId: { in: employeeIds } }] }, select: { id: true, userId: true, employeeId: true, name: true, status: true } }) : [];
    const employeeByIdentifier = new Map<string, typeof employeeRows[number]>();
    for (const employee of employeeRows) for (const id of [employee.id, employee.userId, employee.employeeId]) employeeByIdentifier.set(id, employee);
    const now = Date.now();
    const data = requests.map((item) => ({ ...item, effectiveStatus: item.status.toLowerCase() === 'active' && item.expiresAt && item.expiresAt.getTime() <= now ? 'expired' : item.status, requester: { employeeId: employeeByIdentifier.get(item.employeeId)?.employeeId || item.employeeId, name: employeeByIdentifier.get(item.employeeId)?.name || 'Employee', status: employeeByIdentifier.get(item.employeeId)?.status || 'unknown' } }));
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'EMPLOYEE_PERMISSION_REQUESTS_VIEWED', entityType: 'EmployeePermissionRequest', entityId: requestedEmployee || auth.userId, metadata: JSON.stringify({ reviewAccess, status: status || 'all', count: data.length, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }) } });
    return NextResponse.json({ success: true, requests: data, count: data.length, canReview: reviewAccess }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Permission requests are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.actingAsSessionId) return NextResponse.json({ success: false, error: 'Permission requests cannot be submitted while Acting-As.' }, { status: 403 });
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const employee = await getActiveEmployee(auth).catch(() => null);
  if (!employee) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid permission request is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowedFields = new Set(['featureKey', 'action', 'scopeType', 'scopeId', 'duration', 'reason']);
  if (Object.keys(input).some((key) => !allowedFields.has(key))) return NextResponse.json({ success: false, error: 'Unsupported permission request field.' }, { status: 400 });
  const featureKey = typeof input.featureKey === 'string' ? input.featureKey.trim() : '';
  const action = typeof input.action === 'string' ? input.action.toLowerCase() : 'view';
  const scopeType = typeof input.scopeType === 'string' ? input.scopeType.toUpperCase() : 'OWN';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  const durationDays = typeof input.duration === 'number' ? input.duration : typeof input.duration === 'string' && /^\d{1,2}$/.test(input.duration) ? Number(input.duration) : NaN;
  const scopeId = typeof input.scopeId === 'string' ? input.scopeId.trim() : '';
  if (!REQUESTABLE_FEATURES.has(featureKey)) return NextResponse.json({ success: false, error: 'This feature is not eligible for temporary employee access.' }, { status: 400 });
  if (action !== 'view' || !['OWN', 'ASSIGNED'].includes(scopeType) || scopeId) return NextResponse.json({ success: false, error: 'Only view access within own or assigned records may be requested.' }, { status: 400 });
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > MAX_TEMPORARY_PERMISSION_DAYS) return NextResponse.json({ success: false, error: 'Duration must be an integer from 1 to 30 days.' }, { status: 400 });
  if (reason.length < 10 || reason.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(reason)) return NextResponse.json({ success: false, error: 'A reason of 10 to 500 characters is required.' }, { status: 400 });

  try {
    const requestRecord = await db.$transaction(async (tx) => {
      const duplicate = await tx.employeePermissionRequest.findFirst({ where: { employeeId: employee.id, featureKey, action, scopeType: scopeType.toLowerCase(), OR: [{ status: { in: ['requested', 'reviewing'] } }, { status: 'active', expiresAt: { gt: new Date() } }] }, select: { id: true } });
      if (duplicate) throw new Error('A matching permission request is already pending or active.');
      const created = await tx.employeePermissionRequest.create({ data: { employeeId: employee.id, featureKey, action, scopeType: scopeType.toLowerCase(), scopeId: '', duration: String(durationDays), reason, status: 'requested' } });
      await writePortalAudit(tx, auth, 'EMPLOYEE_PERMISSION_REQUESTED', 'EmployeePermissionRequest', created.id, { employeeId: employee.id, featureKey, action, scopeType: scopeType.toLowerCase(), durationDays }, request);
      const approvers = await tx.portalUser.findMany({ where: { OR: [{ userType: 'SUPER_ADMIN' }, { roles: { some: { role: { name: 'super_admin' } } } }] }, select: { id: true } });
      for (const approver of approvers) await tx.portalNotification.create({ data: { userId: approver.id, title: 'Employee access request', message: 'A temporary employee access request is awaiting review in Access Control.', type: 'permission_request' } });
      return created;
    });
    return NextResponse.json({ success: true, data: requestRecord, message: 'Permission request submitted for independent review.' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('already pending')) return NextResponse.json({ success: false, error: message }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Permission request could not be submitted.' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.actingAsSessionId) return NextResponse.json({ success: false, error: 'Permission requests cannot be reviewed while Acting-As.' }, { status: 403 });
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  if (!canReview(auth)) return NextResponse.json({ success: false, error: 'Temporary permission approval authority required.' }, { status: 403 });
  const reviewerId = auth.actorUserId || auth.userId;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid review request is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['id', 'status', 'reviewNote'].includes(key))) return NextResponse.json({ success: false, error: 'Unsupported review field.' }, { status: 400 });
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const requestedStatus = typeof input.status === 'string' ? input.status.toLowerCase() : '';
  const reviewNote = typeof input.reviewNote === 'string' ? input.reviewNote.trim() : '';
  if (!id || id.length > 191 || !['reviewing', 'approved', 'rejected'].includes(requestedStatus)) return NextResponse.json({ success: false, error: 'A valid request id and review status are required.' }, { status: 400 });
  if (reviewNote.length > 500) return NextResponse.json({ success: false, error: 'Review note must be at most 500 characters.' }, { status: 400 });

  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.employeePermissionRequest.findUnique({ where: { id } });
      if (!existing) throw new Error('not found');
      const target = await tx.employee.findFirst({ where: { OR: [{ id: existing.employeeId }, { userId: existing.employeeId }, { employeeId: existing.employeeId }] }, select: { id: true, userId: true, status: true } });
      if (!target || target.status.toLowerCase() !== 'active') throw new Error('requester inactive');
      if (target.userId === reviewerId) throw new Error('maker cannot review');

      if (requestedStatus === 'reviewing') {
        if (existing.status.toLowerCase() !== 'requested') throw new Error('invalid transition');
        const result = await tx.employeePermissionRequest.updateMany({ where: { id, status: 'requested' }, data: { status: 'reviewing', reviewedBy: reviewerId, reviewedAt: new Date() } });
        if (result.count !== 1) throw new Error('request changed');
        await writePortalAudit(tx, auth, 'EMPLOYEE_PERMISSION_REQUEST_REVIEWING', 'EmployeePermissionRequest', id, { from: existing.status, to: 'reviewing', employeeId: target.id, reviewNote }, request);
      } else {
        if (existing.status.toLowerCase() !== 'reviewing') throw new Error('invalid transition');
        if (existing.reviewedBy === reviewerId) throw new Error('reviewer cannot approve own review');
        if (!REQUESTABLE_FEATURES.has(existing.featureKey) || existing.action.toLowerCase() !== 'view' || !['own', 'assigned'].includes(existing.scopeType.toLowerCase()) || existing.scopeId) throw new Error('request is not eligible');
        const expiresAt = requestedStatus === 'approved' ? new Date(Date.now() + Number(existing.duration) * 24 * 60 * 60 * 1000) : null;
        if (requestedStatus === 'approved' && (!Number.isFinite(expiresAt?.getTime()) || !expiresAt || Number(existing.duration) < 1 || Number(existing.duration) > MAX_TEMPORARY_PERMISSION_DAYS)) throw new Error('invalid expiry');
        const nextStatus = requestedStatus === 'approved' ? 'active' : 'rejected';
        const result = await tx.employeePermissionRequest.updateMany({
          where: { id, status: 'reviewing', reviewedBy: existing.reviewedBy },
          data: { status: nextStatus, reviewedBy: existing.reviewedBy, reviewedAt: existing.reviewedAt || new Date(), ...(requestedStatus === 'approved' ? { approvedBy: reviewerId, approvedAt: new Date(), expiresAt } : { reviewedBy: reviewerId, reviewedAt: new Date() }) },
        });
        if (result.count !== 1) throw new Error('request changed');
        if (requestedStatus === 'approved' && expiresAt) {
          await tx.employeeTemporaryPermission.create({ data: { employeeId: target.id, featureKey: existing.featureKey, permissionKey: existing.featureKey, action: existing.action, scopeType: existing.scopeType, scopeId: '', grantedBy: reviewerId, approvedBy: reviewerId, reason: existing.reason, startDate: new Date(), endDate: expiresAt, expiresAt, isActive: true, active: true } });
        }
        await tx.portalNotification.create({ data: { userId: target.userId, title: requestedStatus === 'approved' ? 'Temporary access approved' : 'Access request reviewed', message: requestedStatus === 'approved' ? 'Your temporary access request is active and will expire automatically.' : 'Your temporary access request was not approved. Contact HR for the review outcome.', type: requestedStatus === 'approved' ? 'permission_approval' : 'permission_rejection' } });
        await writePortalAudit(tx, auth, requestedStatus === 'approved' ? 'EMPLOYEE_PERMISSION_ACTIVATED' : 'EMPLOYEE_PERMISSION_REJECTED', 'EmployeePermissionRequest', id, { from: existing.status, to: nextStatus, employeeId: target.id, featureKey: existing.featureKey, action: existing.action, scopeType: existing.scopeType, expiresAt: expiresAt?.toISOString() || null, reviewNote }, request);
      }
      return tx.employeePermissionRequest.findUnique({ where: { id } });
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'not found') return NextResponse.json({ success: false, error: 'Permission request not found.' }, { status: 404 });
    if (message === 'maker cannot review' || message === 'reviewer cannot approve own review') return NextResponse.json({ success: false, error: 'Separation of duties prevents this review.' }, { status: 403 });
    if (message === 'requester inactive') return NextResponse.json({ success: false, error: 'Inactive employees cannot receive temporary permissions.' }, { status: 409 });
    if (message === 'request is not eligible' || message === 'invalid expiry') return NextResponse.json({ success: false, error: 'This request is not eligible for temporary access.' }, { status: 422 });
    if (message === 'invalid transition' || message === 'request changed') return NextResponse.json({ success: false, error: 'Permission request transition is invalid or already changed.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Permission request review could not be completed.' }, { status: 503 });
  }
}
