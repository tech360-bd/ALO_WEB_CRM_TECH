import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET: Get notifications for this partner user
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { userId: auth.userId };
    if (isRead === 'true') {
      where.isRead = true;
    } else if (isRead === 'false') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.portalNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.portalNotification.count({ where }),
      db.portalNotification.count({ where: { userId: auth.userId, isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('[GET /partner/notifications]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a notification (for system use)
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, message' },
        { status: 400 },
      );
    }

    const notification = await db.portalNotification.create({
      data: {
        userId: userId || auth.userId,
        title,
        message,
        type: type || 'info',
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error('[POST /partner/notifications]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Mark notification(s) as read (supports ?markAll=true)
export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const markAll = searchParams.get('markAll') === 'true';

    if (markAll) {
      const result = await db.portalNotification.updateMany({
        where: { userId: auth.userId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, data: { markedCount: result.count } });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 },
      );
    }

    const notification = await db.portalNotification.findUnique({ where: { id } });
    if (!notification || notification.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    const updated = await db.portalNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PUT /partner/notifications]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
