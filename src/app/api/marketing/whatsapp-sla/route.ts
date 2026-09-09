import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    // Fetch conversations needing SLA response (> 20 mins or > 40 mins un-responded)
    const now = new Date();
    const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);

    const overdueConversations = await db.uccConversation.findMany({
      where: {
        channel: 'whatsapp',
        status: { in: ['open', 'pending'] },
        updatedAt: { lte: twentyMinsAgo },
      },
      take: 20,
      orderBy: { updatedAt: 'asc' },
    });

    const escalatedLogs = await db.integrationAuditLog.findMany({
      where: { action: { in: ['SLA_ESCALATED_MANAGER', 'SLA_ESCALATED_SUPER_ADMIN'] } },
      take: 15,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      slaConfig: {
        targetResponseMins: 40,
        managerEscalationMins: 20,
        superAdminEscalationMins: 10,
      },
      overdueCount: overdueConversations.length,
      overdueConversations,
      escalatedLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch WhatsApp SLA status', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { conversationId, level, note } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const action = level === 'SUPER_ADMIN' ? 'SLA_ESCALATED_SUPER_ADMIN' : 'SLA_ESCALATED_MANAGER';

    // Update conversation priority & write audit log
    await db.$transaction([
      db.uccConversation.update({
        where: { id: conversationId },
        data: {
          priority: level === 'SUPER_ADMIN' ? 'urgent' : 'high',
        },
      }),
      db.integrationAuditLog.create({
        data: {
          actorId: auth.userId,
          actorName: auth.name || auth.email,
          actorRole: auth.roles?.join(',') || 'system',
          action,
          resourceType: 'UccConversation',
          resourceId: conversationId,
          errorMessage: note || `SLA escalated to ${level}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Conversation ${conversationId} escalated to ${level} and logged in SLA audit history.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to trigger SLA escalation', details: error.message }, { status: 500 });
  }
}
