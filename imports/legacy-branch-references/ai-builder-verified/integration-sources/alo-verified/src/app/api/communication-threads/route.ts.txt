import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, counselorScope } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Unified Communication Threads API — powers /crm/inbox
 *
 * GET /api/communication-threads
 *  - status= open|waiting|resolved|escalated
 *  - channel= whatsapp|email|sms|chat|...
 *  - assignedTo= <userId>
 *  - overdue= true  → only threads where slaDueAt < now and status in (open, waiting, escalated)
 *
 * Returns CommunicationThread rows with related SlaEscalation entries.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireAuth(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10), 1),
      200
    );
    const status = searchParams.get('status') || '';
    const channel = searchParams.get('channel') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const overdue = searchParams.get('overdue') === 'true';
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (assignedTo) where.assignedTo = assignedTo;
    if (overdue) {
      where.slaDueAt = { lt: new Date() };
      where.status = { in: ['open', 'waiting', 'escalated'] };
    }

    // RBAC scoping: counselors see only their assigned threads
    const scope = counselorScope(auth);
    if (scope?.assignedCounselor) {
      const counselorEmployeeId = auth.user.referenceId ?? null;
      where.OR = [
        { assignedTo: counselorEmployeeId },
        { assignedCounselorId: counselorEmployeeId },
        { assignedTo: null }, // unassigned threads are visible for pickup
      ];
    }

    const [threads, total] = await Promise.all([
      db.communicationThread.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
      }),
      db.communicationThread.count({ where }),
    ]);

    // Fetch related SlaEscalations for each thread (matched by conversationId).
    // CommunicationThread has no FK to SlaEscalation, so we join in code.
    const threadIds = threads.map((t) => t.id);
    const escalations = threadIds.length
      ? await db.slaEscalation.findMany({
          where: {
            OR: [
              { conversationId: { in: threadIds } },
              { contactIdentifier: { in: threads.map((t) => t.threadCode) } },
            ],
            resolvedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const escalationByThread = new Map<
      string,
      {
        currentLevel: number;
        level1EscalatedAt: Date | null;
        level2EscalatedAt: Date | null;
        level3EscalatedAt: Date | null;
      }
    >();
    for (const e of escalations) {
      if (!e.conversationId) continue;
      const prev = escalationByThread.get(e.conversationId);
      if (!prev || e.currentLevel > prev.currentLevel) {
        escalationByThread.set(e.conversationId, {
          currentLevel: e.currentLevel,
          level1EscalatedAt: e.level1EscalatedAt,
          level2EscalatedAt: e.level2EscalatedAt,
          level3EscalatedAt: e.level3EscalatedAt,
        });
      }
    }

    const threadsWithEscalation = threads.map((t) => ({
      ...t,
      escalation: escalationByThread.get(t.id) ?? null,
    }));

    await logAudit({
      userId: auth.user.id,
      action: 'inbox.threads_listed',
      module: 'inbox',
      newData: { count: threads.length, overdueOnly: overdue, filterStatus: status },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      threads: threadsWithEscalation,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('communication-threads GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
