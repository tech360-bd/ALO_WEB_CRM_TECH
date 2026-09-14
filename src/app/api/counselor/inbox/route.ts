import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

// ============================================================
// UNIFIED INBOX API
// GET /api/counselor/inbox
// Requires: EMPLOYEE userType
// ============================================================

const EMPLOYEE_AUTH = {
  requireUserTypes: ['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN'],
};

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || undefined;
    const slaStatus = searchParams.get('slaStatus') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause — open threads assigned to this counselor or unassigned
    const where: Record<string, unknown> = {
      status: 'open',
    };

    if (channel) where.channel = channel;
    if (slaStatus) where.slaStatus = slaStatus;

    const [assignedThreads, unassignedCount, slaSummaryData] = await Promise.all([
      db.communicationThread.findMany({
        where: {
          ...where,
          OR: [
            { assignedToId: auth.userId },
            { assignedToId: '' },
          ],
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      db.communicationThread.count({
        where: { ...where, assignedToId: '' },
      }),
      // SLA summary counts
      db.communicationThread.groupBy({
        by: ['slaStatus'],
        where: { status: 'open' },
        _count: { slaStatus: true },
      }),
    ]);

    // Build SLA summary
    const slaSummary: Record<string, number> = { ok: 0, warning: 0, escalated: 0, none: 0 };
    for (const row of slaSummaryData) {
      if (row.slaStatus in slaSummary) {
        slaSummary[row.slaStatus] = row._count.slaStatus;
      }
    }

    // Fetch student names for threads that have studentIds
    const studentIds = [...new Set((assignedThreads as any[]).map((t: any) => t.studentId).filter(Boolean))];
    const students = studentIds.length > 0
      ? await (db as any).student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, studentId: true, name: true },
        })
      : [];

    const studentMap = new Map<string, any>((students as any[]).map((s: any) => [s.id, s]));

    // Build response threads
    const threads = (assignedThreads as any[]).map((thread: any) => {
      const student = thread.studentId ? studentMap.get(thread.studentId) : null;
      return {
        id: thread.id,
        studentId: student?.studentId || thread.studentId,
        student: student?.name || 'Unknown',
        channel: thread.channel,
        lastMessage: thread.lastMessagePreview || '',
        time: thread.lastMessageAt.toISOString(),
        unread: thread.unreadCount || 0,
        slaStatus: thread.slaStatus,
        isAiHandled: thread.isAiHandled,
        hasDocument: false,
        assignedToId: thread.assignedToId || null,
        assignedToName: thread.assignedToName || null,
        status: thread.status,
      };
    });

    const total = await db.communicationThread.count({
      where: {
        status: 'open',
        OR: [
          { assignedToId: auth.userId },
          { assignedToId: '' },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        threads,
        unassigned: unassignedCount,
        slaSummary,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Counselor inbox error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load inbox' },
      { status: 500 }
    );
  }
}, EMPLOYEE_AUTH);
