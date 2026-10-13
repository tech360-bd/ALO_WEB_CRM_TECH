import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── PATCH: Mark notification as read ────────────────────────

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await ctx.params;

    // Fetch the notification
    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found.' }, { status: 404 });
    }

    // Must own the notification
    if (notification.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    // Update as read
    const updated = await db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notification.' }, { status: 500 });
  }
}

// ─── DELETE: Delete / dismiss notification ───────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await ctx.params;

    // Fetch the notification
    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Notification not found.' }, { status: 404 });
    }

    // Must own the notification
    if (notification.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    await db.notification.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete notification.' }, { status: 500 });
  }
}
