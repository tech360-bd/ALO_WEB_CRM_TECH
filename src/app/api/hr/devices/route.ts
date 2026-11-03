import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

/** Legacy device inventory. Backend RBAC + whitelisted writes + audit. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEVICE_STATUSES = new Set(['ASSIGNED', 'RETURNED', 'LOST', 'DAMAGED']);

function guard(auth: AuthContext, write: boolean, request: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.hrDevices, { write, request });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, false, req);
  if (denied) return denied;
  const employeeId = new URL(req.url).searchParams.get('employeeId');
  const where = employeeId ? { employeeId: employeeId.slice(0, 128) } : {};
  try {
    const devices = await db.deviceManagement.findMany({ where, orderBy: { assignedDate: 'desc' }, take: 200 });
    return NextResponse.json({ devices }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Device inventory could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const str = (key: string) => (typeof body[key] === 'string' ? String(body[key]).trim().slice(0, 256) : '');
  if (!str('employeeId') || !str('deviceName') || !str('serialNumber') || !str('assignedDate')) {
    return NextResponse.json({ error: 'employeeId, deviceName, serialNumber and assignedDate are required.' }, { status: 400 });
  }
  try {
    // Never pass the raw body to Prisma: that allowed a caller to set id,
    // createdAt or any other column (mass assignment).
    const device = await db.deviceManagement.create({
      data: {
        employeeId: str('employeeId'),
        deviceType: str('deviceType') || 'LAPTOP',
        deviceName: str('deviceName'),
        serialNumber: str('serialNumber'),
        assetTag: str('assetTag') || null,
        assignedDate: str('assignedDate'),
        warrantyExpiry: str('warrantyExpiry') || null,
        status: 'ASSIGNED',
        notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null,
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'HR_DEVICE_REGISTERED',
        resource: 'DeviceManagement',
        resourceId: device.id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ deviceName: device.deviceName, employeeId: device.employeeId }),
      },
    }).catch(() => null);
    return NextResponse.json({ device, message: 'Device registered.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Device could not be registered.' }, { status: 503 });
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
  if (!id || !DEVICE_STATUSES.has(status)) {
    return NextResponse.json({ error: 'A valid id and status are required.' }, { status: 400 });
  }
  const text = (key: string) => (typeof body[key] === 'string' ? String(body[key]).trim().slice(0, 256) : null);
  try {
    const device = await db.deviceManagement.update({
      where: { id },
      data: { status, returnedDate: text('returnedDate'), condition: text('condition') },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'HR_DEVICE_STATUS_CHANGED',
        resource: 'DeviceManagement',
        resourceId: id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ status }),
      },
    }).catch(() => null);
    return NextResponse.json({ device, message: 'Device updated.' });
  } catch {
    return NextResponse.json({ error: 'Device could not be updated.' }, { status: 503 });
  }
});
