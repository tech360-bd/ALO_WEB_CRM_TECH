import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/notifications
// Returns student's notifications with pagination and type filter
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const type = searchParams.get('type') || '';
      const isRead = searchParams.get('isRead');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const where: Record<string, unknown> = { studentProfileId: profile.id };
      if (type) where.type = type;
      if (isRead !== null && isRead !== undefined && isRead !== '') {
        where.isRead = isRead === 'true';
      }

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [notifications, total] = await Promise.all([
        db.portalNotification.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.portalNotification.count({ where }),
      ]);

      const unreadCount = await db.portalNotification.count({
        where: { studentProfileId: profile.id, isRead: false },
      });

      return NextResponse.json({
        success: true,
        data: notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/notifications
// Mark single notification as read, or mark all as read
// Body: { id } for single, { markAll: true } for all
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, markAll } = body;

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      if (markAll) {
        const result = await db.portalNotification.updateMany({
          where: {
            studentProfileId: profile.id,
            isRead: false,
          },
          data: { isRead: true },
        });

        await logAuditAction(auth, 'NOTIFICATIONS_MARKED_ALL_READ', 'PortalNotification', '', {
          count: result.count,
        });

        return NextResponse.json({ success: true, data: { markedCount: result.count } });
      }

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Notification id is required.' },
          { status: 400 }
        );
      }

      // Verify notification belongs to this student
      const existing = await db.portalNotification.findUnique({ where: { id } });
      if (!existing || existing.studentProfileId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'Notification not found.' },
          { status: 404 }
        );
      }

      const updated = await db.portalNotification.update({
        where: { id },
        data: { isRead: true },
      });

      await logAuditAction(auth, 'NOTIFICATION_MARKED_READ', 'PortalNotification', id, {});
      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update notification';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
