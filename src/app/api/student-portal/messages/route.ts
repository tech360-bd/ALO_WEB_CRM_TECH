import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/messages
// Returns student's messages with pagination
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const senderType = searchParams.get('senderType') || '';
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

      const where: Record<string, unknown> = { studentId: profile.id };
      if (senderType) where.senderType = senderType;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [messages, total] = await Promise.all([
        db.aloMessage.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.aloMessage.count({ where }),
      ]);

      // Count unread
      const unreadCount = await db.aloMessage.count({
        where: { studentId: profile.id, isRead: false, senderType: 'counselor' },
      });

      return NextResponse.json({
        success: true,
        data: messages,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch messages';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/messages
// Send a new message
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { content } = body;

      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, error: 'Message content is required.' },
          { status: 400 }
        );
      }

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

      const message = await db.aloMessage.create({
        data: {
          studentId: profile.id,
          senderType: 'student',
          senderName: profile.fullName || auth.name,
          content: content.trim(),
          isRead: false,
        },
      });

      // Audit log
      await logAuditAction(auth, 'MESSAGE_SENT', 'AloMessage', message.id, {
        contentLength: content.length,
      });

      return NextResponse.json({ success: true, data: message }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/messages
// Mark message(s) as read
// Body: { id } for single, or { markAll: true } for all
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
        // Mark all counselor messages as read
        await db.aloMessage.updateMany({
          where: {
            studentId: profile.id,
            isRead: false,
            senderType: 'counselor',
          },
          data: { isRead: true },
        });

        await logAuditAction(auth, 'MESSAGES_MARKED_ALL_READ', 'AloMessage', '', {});
        return NextResponse.json({ success: true, data: { markedAll: true } });
      }

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Message id is required.' },
          { status: 400 }
        );
      }

      // Verify message belongs to this student
      const existing = await db.aloMessage.findUnique({ where: { id } });
      if (!existing || existing.studentId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'Message not found.' },
          { status: 404 }
        );
      }

      const updated = await db.aloMessage.update({
        where: { id },
        data: { isRead: true },
      });

      await logAuditAction(auth, 'MESSAGE_MARKED_READ', 'AloMessage', id, {});
      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update message';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
