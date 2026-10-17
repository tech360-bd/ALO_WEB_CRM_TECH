import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

/**
 * Notifications API
 * - GET: list notifications for the authenticated user (or by userId query param)
 * - PUT: mark one or many notifications as read (body: { notificationIds?: string[], markAll?: boolean })
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    // Default to the authenticated user; allow explicit userId only if it matches.
    const requestedUserId = searchParams.get('userId');
    const userId = requestedUserId && requestedUserId.length > 0 ? requestedUserId : auth.user.id;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, total, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ notifications: [], total: 0, unreadCount: 0 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notificationIds, markAll = false } = body as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    const where = markAll
      ? { userId: auth.user.id, isRead: false }
      : {
          id: { in: Array.isArray(notificationIds) ? notificationIds : [] },
          userId: auth.user.id,
          isRead: false,
        };

    const result = await db.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
