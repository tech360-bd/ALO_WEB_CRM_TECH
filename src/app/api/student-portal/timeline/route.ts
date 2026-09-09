import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/timeline
// Returns student's timeline events with channel/type filters
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const channel = searchParams.get('channel') || '';
      const messageType = searchParams.get('type') || '';
      const visibility = searchParams.get('visibility') || 'student_visible';
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

      const where: Record<string, unknown> = {
        studentProfileId: profile.id,
        visibility: visibility || undefined,
      };
      if (channel) where.channel = channel;
      if (messageType) where.messageType = messageType;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [events, total] = await Promise.all([
        db.portalTimelineEvent.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.portalTimelineEvent.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: events,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch timeline';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
