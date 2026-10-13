import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination } from '@/lib/access-control';

// ─── GET: List student notifications for the authenticated user ─────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp);

    // Resolve studentId from the authenticated user
    const student = await db.student.findFirst({ where: { userId: auth.user.id } });
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
    }

    const where: Record<string, unknown> = { studentId: student.id };

    // Optional filters
    if (sp.get('isRead') !== null) {
      where.isRead = sp.get('isRead') === 'true';
    }
    if (sp.get('type')) {
      where.type = sp.get('type');
    }

    const [data, total, unreadCount] = await Promise.all([
      db.studentNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.studentNotification.count({ where }),
      db.studentNotification.count({ where: { studentId: student.id, isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total, unreadCount },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications.' }, { status: 500 });
  }
}

// ─── PATCH: Mark notifications as read ─────

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { ids, markAll } = await req.json();

    const student = await db.student.findFirst({ where: { userId: auth.user.id } });
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
    }

    if (markAll) {
      await db.studentNotification.updateMany({
        where: { studentId: student.id, isRead: false },
        data: { isRead: true },
      });
    } else if (ids && Array.isArray(ids)) {
      await db.studentNotification.updateMany({
        where: { id: { in: ids }, studentId: student.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to mark notifications.' }, { status: 500 });
  }
}
