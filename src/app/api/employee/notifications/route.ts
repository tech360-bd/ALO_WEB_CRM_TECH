import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const notifs = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      notifications: notifs,
      unreadCount: notifs.filter(n => !n.isRead).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update notifications', details: error.message }, { status: 500 });
  }
}
