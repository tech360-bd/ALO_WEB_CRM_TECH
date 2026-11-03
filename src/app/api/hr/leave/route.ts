import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

/**
 * Legacy HR leave endpoint. Authentication is handled by `withAuth`; the
 * role/permission decision is made here in the backend handler so a student or
 * partner session cannot read or approve another employee's leave records.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LEAVE_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

function guard(auth: AuthContext, write: boolean, request: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.hrLeave, { write, request });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, false, req);
  if (denied) return denied;
  const params = new URL(req.url).searchParams;
  const where: Record<string, string> = {};
  const employeeId = params.get('employeeId');
  const status = params.get('status');
  if (employeeId) where.employeeId = employeeId.slice(0, 128);
  if (status) where.status = status.slice(0, 32);
  try {
    const leaves = await db.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ leaves }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Leave requests could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';
  const leaveType = typeof body.leaveType === 'string' ? body.leaveType.trim().toUpperCase() : '';
  const startDate = typeof body.startDate === 'string' ? body.startDate.trim() : '';
  const endDate = typeof body.endDate === 'string' ? body.endDate.trim() : '';
  const days = Number(body.days);
  if (!employeeId || !leaveType || !startDate || !endDate || !Number.isInteger(days) || days < 1) {
    return NextResponse.json({ error: 'employeeId, leaveType, startDate, endDate and a positive integer days are required.' }, { status: 400 });
  }
  try {
    // Only whitelisted fields are accepted; the actor comes from the session.
    const leave = await db.leaveRequest.create({
      data: {
        employeeId: employeeId.slice(0, 128),
        leaveType: leaveType.slice(0, 64),
        startDate: startDate.slice(0, 32),
        endDate: endDate.slice(0, 32),
        days,
        reason: typeof body.reason === 'string' ? body.reason.slice(0, 2000) : null,
        status: 'PENDING',
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'HR_LEAVE_REQUEST_CREATED',
        resource: 'LeaveRequest',
        resourceId: leave.id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ employeeId: leave.employeeId, leaveType: leave.leaveType }),
      },
    }).catch(() => null);
    return NextResponse.json({ leave, message: 'Leave request submitted.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Leave request could not be saved.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
  if (!id || !LEAVE_STATUSES.has(status)) {
    return NextResponse.json({ error: 'A valid id and status are required.' }, { status: 400 });
  }
  try {
    // `approvedBy` used to be a client-supplied value. It is now bound to the
    // authenticated actor so the audit trail cannot be forged through the API.
    const leave = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: auth.userId,
        approvedAt: new Date(),
        reviewNote: typeof body.reviewNote === 'string' ? body.reviewNote.slice(0, 2000) : null,
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'HR_LEAVE_STATUS_CHANGED',
        resource: 'LeaveRequest',
        resourceId: id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ status }),
      },
    }).catch(() => null);
    return NextResponse.json({ leave, message: `Leave ${status.toLowerCase()}.` });
  } catch {
    return NextResponse.json({ error: 'Leave request could not be updated.' }, { status: 503 });
  }
});
