import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

async function authorizeEmployee(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  if (roles.has('student') || roles.has('partner')) return NextResponse.json({ success: false, error: 'Employee notifications are not available to student or partner accounts.' }, { status: 403 });
  if (!roles.has('super_admin')) {
    const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } }).catch(() => null);
    if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  }
  return auth;
}

export async function GET(request: NextRequest) {
  const auth = await authorizeEmployee(request);
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limitValue = searchParams.get('limit') || '100';
  if (!/^\d+$/.test(limitValue) || Number(limitValue) < 1 || Number(limitValue) > 100) {
    return NextResponse.json({ success: false, error: 'limit must be an integer from 1 to 100.' }, { status: 400 });
  }
  try {
    const where = { userId: auth.userId, ...(unreadOnly ? { isRead: false } : {}) };
    const notifications = await db.portalNotification.findMany({
      where,
      select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: Number(limitValue),
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        action: 'EMPLOYEE_NOTIFICATIONS_VIEWED',
        entityType: 'PortalNotification',
        entityId: auth.userId,
        metadata: JSON.stringify({ effectiveUserId: auth.userId, unreadOnly, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
      },
    });
    return NextResponse.json({ success: true, notifications, unreadCount: notifications.filter((notification) => !notification.isRead).length }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee notifications are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Direct notification creation is disabled. Notifications must be created by an audited event-specific workflow.' }, { status: 405, headers: { Allow: 'GET' } });
}
