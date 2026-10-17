import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const OVERDUE_ROLES = [
  'super_admin',
  'admin',
  'marketing_manager',
  'branch_manager',
];

/**
 * Overdue conversations endpoint.
 * - Lists WhatsappConversation + SlaEscalation where currentLevel > 0
 *   OR slaDueAt < now, sorted by most overdue.
 * - Includes assignedTo, contactName, lastMessage.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireRole(request, OVERDUE_ROLES);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const now = new Date();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    // Open escalations: either currentLevel > 0 OR CommunicationThread.slaDueAt < now
    const escalations = await db.slaEscalation.findMany({
      where: {
        resolvedAt: null,
        OR: [{ currentLevel: { gt: 0 } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    // Pull the associated WhatsappConversation for each escalation (by conversationId)
    const conversationIds = escalations
      .map((e) => e.conversationId)
      .filter((c): c is string => !!c);

    const conversations = conversationIds.length
      ? await db.whatsappConversation.findMany({
          where: { id: { in: conversationIds } },
        })
      : [];

    const convMap = new Map(conversations.map((c) => [c.id, c]));

    // Also surface overdue CommunicationThread entries with slaDueAt < now and not resolved
    const overdueThreads = await db.communicationThread.findMany({
      where: {
        status: { in: ['open', 'waiting', 'escalated'] },
        slaDueAt: { lt: now },
      },
      orderBy: { slaDueAt: 'asc' },
      take: limit,
    });

    const overdue = escalations.map((e) => {
      const conv = e.conversationId ? convMap.get(e.conversationId) : null;
      const minutesSinceEscalation =
        (now.getTime() - new Date(e.createdAt).getTime()) / 60000;
      return {
        escalationId: e.id,
        conversationId: e.conversationId,
        channel: e.channel,
        contactIdentifier: e.contactIdentifier,
        assignedTo: e.assignedTo,
        contactName: conv?.contactName ?? null,
        contactNumber: conv?.contactNumber ?? e.contactIdentifier,
        lastMessage: conv?.lastMessage ?? null,
        lastMessageAt: conv?.lastMessageAt ?? null,
        currentLevel: e.currentLevel,
        level1EscalatedAt: e.level1EscalatedAt,
        level2EscalatedAt: e.level2EscalatedAt,
        level3EscalatedAt: e.level3EscalatedAt,
        createdAt: e.createdAt,
        minutesSinceEscalation: Math.round(minutesSinceEscalation),
      };
    });

    // Sort by most overdue (oldest escalation first)
    overdue.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    await logAudit({
      userId: auth.user.id,
      action: 'whatsapp.sla.overdue_listed',
      module: 'sla',
      newData: {
        escalationsCount: overdue.length,
        overdueThreadsCount: overdueThreads.length,
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      overdue,
      overdueThreads,
      count: overdue.length,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('marketing/sla/overdue GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
