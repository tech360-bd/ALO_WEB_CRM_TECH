import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

function isSuperAdmin(roles: string[], userType: string): boolean {
  return userType.toUpperCase() === 'SUPER_ADMIN' || roles.some((role) => role.toLowerCase() === 'super_admin');
}

async function authorizeEmployee(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  if (['STUDENT', 'PARTNER'].includes(auth.userType.toUpperCase())) {
    return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
  }
  if (!isSuperAdmin(auth.roles, auth.userType)) {
    const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } });
    if (!employee || employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
    }
  }
  return auth;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeEmployee(req);
    if (auth instanceof NextResponse) return auth;

    const notifications = await db.portalNotification.findMany({
      where: { userId: auth.userId },
      select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, notifications, unreadCount: notifications.filter((notification) => !notification.isRead).length });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee notifications are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeEmployee(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'A valid notification update is required.' }, { status: 400 });
    }

    if (body.markAllRead === true) {
      const updated = await db.portalNotification.updateMany({ where: { userId: auth.userId, isRead: false }, data: { isRead: true } });
      await logAuditAction(auth, 'EMPLOYEE_NOTIFICATIONS_MARKED_READ', 'PortalNotification', auth.userId, { count: updated.count, markAll: true });
      return NextResponse.json({ success: true, updatedCount: updated.count });
    }

    const notificationId = typeof body.notificationId === 'string' ? body.notificationId.trim() : '';
    if (!notificationId || notificationId.length > 191) {
      return NextResponse.json({ success: false, error: 'A valid notificationId is required.' }, { status: 400 });
    }
    const updated = await db.portalNotification.updateMany({
      where: { id: notificationId, userId: auth.userId, isRead: false },
      data: { isRead: true },
    });
    if (updated.count !== 1) return NextResponse.json({ success: false, error: 'Notification not found.' }, { status: 404 });
    await logAuditAction(auth, 'EMPLOYEE_NOTIFICATION_MARKED_READ', 'PortalNotification', notificationId, {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee notification update is temporarily unavailable.' }, { status: 503 });
  }
}
