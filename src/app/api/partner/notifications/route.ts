import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const readFilter = searchParams.get('isRead');
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;
    const where: Record<string, unknown> = { userId: auth.userId };
    if (readFilter === 'true') where.isRead = true;
    if (readFilter === 'false') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      db.portalNotification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.portalNotification.count({ where }),
      db.portalNotification.count({ where: { userId: auth.userId, isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    });
  } catch (error) {
    console.error('[GET /partner/notifications]', error);
    return NextResponse.json({ success: false, error: 'Notifications are temporarily unavailable.' }, { status: 500 });
  }
}

// Only authorized administrators may create notifications for other accounts.
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const canCreate = ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase())
      || auth.roles.some((role) => ['admin', 'super_admin'].includes(role.toLowerCase()));
    if (!canCreate) return NextResponse.json({ success: false, error: 'Only administrators can create notifications.' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const type = typeof body.type === 'string' ? body.type.trim() : 'info';
    if (!userId || !title || !message) return NextResponse.json({ success: false, error: 'userId, title and message are required.' }, { status: 400 });
    if (title.length > 200 || message.length > 5000 || type.length > 60) return NextResponse.json({ success: false, error: 'Notification fields exceed allowed lengths.' }, { status: 400 });

    const notification = await db.portalNotification.create({ data: { userId, title, message, type, isRead: false } });
    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error('[POST /partner/notifications]', error);
    return NextResponse.json({ success: false, error: 'Notification could not be created.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const markAll = searchParams.get('markAll') === 'true' || body.action === 'markAllRead';
    if (markAll) {
      const result = await db.portalNotification.updateMany({ where: { userId: auth.userId, isRead: false }, data: { isRead: true } });
      return NextResponse.json({ success: true, data: { markedCount: result.count } });
    }

    const id = typeof body.id === 'string' ? body.id.trim() : typeof body.notificationId === 'string' ? body.notificationId.trim() : '';
    const action = typeof body.action === 'string' ? body.action : 'markRead';
    if (!id) return NextResponse.json({ success: false, error: 'Notification id is required.' }, { status: 400 });

    const notification = await db.portalNotification.findFirst({ where: { id, userId: auth.userId } });
    if (!notification) return NextResponse.json({ success: false, error: 'Notification not found.' }, { status: 404 });

    if (action === 'delete') {
      await db.portalNotification.delete({ where: { id: notification.id } });
      return NextResponse.json({ success: true, data: { id, deleted: true } });
    }
    if (!['markRead', 'read'].includes(action)) return NextResponse.json({ success: false, error: 'Unsupported notification action.' }, { status: 400 });

    const updated = await db.portalNotification.update({ where: { id: notification.id }, data: { isRead: true } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /partner/notifications]', error);
    return NextResponse.json({ success: false, error: 'Notification could not be updated.' }, { status: 500 });
  }
}
