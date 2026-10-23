import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { hasMarketingAccess, isMarketingManager } from '@/lib/marketing/access';

async function authorize(req: Request, managerOnly = false): Promise<AuthContext | NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (managerOnly ? !isMarketingManager(auth) : (!isMarketingManager(auth) && !(await hasMarketingAccess(auth, 'social-inbox')))) {
    return NextResponse.json({ success: false, error: 'Approved Marketing access is required.' }, { status: 403 });
  }
  return auth;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (auth instanceof NextResponse) return auth;
    const manager = isMarketingManager(auth);
    const now = new Date();
    const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);
    const where: Record<string, unknown> = {
      channel: 'whatsapp', status: { in: ['open', 'pending'] }, updatedAt: { lte: twentyMinsAgo },
    };
    if (!manager) where.assignedToUserId = auth.userId;
    const overdueConversations = await db.uccConversation.findMany({
      where,
      take: 20,
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true, channel: true, participantName: true, participantPhone: true,
        studentId: true, leadId: true, assignedToUserId: true, status: true,
        priority: true, lastMessageText: true, lastMessageAt: true, updatedAt: true,
      },
    });
    const logWhere: Record<string, unknown> = { action: { in: ['SLA_ESCALATED_MANAGER', 'SLA_ESCALATED_SUPER_ADMIN'] } };
    if (!manager) logWhere.resourceId = { in: overdueConversations.map((conversation) => conversation.id) };
    const escalatedLogs = await db.integrationAuditLog.findMany({ where: logWhere, take: 15, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({
      success: true,
      slaConfig: {
        targetResponseMins: 40,
        managerEscalationMins: 20,
        superAdminEscalationMins: 10,
        enforcement: 'MANUAL_REVIEW_ONLY_NOT_AUTOMATED',
      },
      overdueCount: overdueConversations.length,
      overdueConversations,
      escalatedLogs,
      delivery: 'Local priority/audit only; notifications and external messages are not configured.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[marketing.whatsapp-sla] read failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to fetch WhatsApp SLA status.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (auth instanceof NextResponse) return auth;
    const manager = isMarketingManager(auth);
    const body = await req.json().catch(() => null) as { conversationId?: unknown; level?: unknown; note?: unknown } | null;
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : '';
    const level = typeof body?.level === 'string' ? body.level.trim().toUpperCase() : '';
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : '';
    if (!conversationId || conversationId.length > 191 || !['MANAGER', 'SUPER_ADMIN'].includes(level)) {
      return NextResponse.json({ success: false, error: 'conversationId and a valid escalation level are required.' }, { status: 400 });
    }
    if (!manager && level !== 'MANAGER') return NextResponse.json({ success: false, error: 'Limited users may escalate only to the Marketing Manager.' }, { status: 403 });
    const conversation = await db.uccConversation.findUnique({ where: { id: conversationId }, select: { id: true, channel: true, assignedToUserId: true, status: true } });
    if (!conversation || conversation.channel.toLowerCase() !== 'whatsapp') return NextResponse.json({ success: false, error: 'WhatsApp conversation not found.' }, { status: 404 });
    if (!manager && conversation.assignedToUserId !== auth.userId) return NextResponse.json({ success: false, error: 'This conversation is not assigned to your account.' }, { status: 403 });
    const action = level === 'SUPER_ADMIN' ? 'SLA_ESCALATED_SUPER_ADMIN' : 'SLA_ESCALATED_MANAGER';
    await db.$transaction([
      db.uccConversation.update({ where: { id: conversationId }, data: { priority: level === 'SUPER_ADMIN' ? 'urgent' : 'high' } }),
      db.integrationAuditLog.create({
        data: {
          actorId: auth.userId, actorName: auth.name || auth.email,
          actorRole: auth.roles?.join(',') || auth.userType, action,
          resourceType: 'UccConversation', resourceId: conversationId,
          errorMessage: note || `Manual local escalation to ${level}; no notification sent.`,
          result: 'recorded',
        },
      }),
    ]);
    return NextResponse.json({ success: true, notified: false, message: `Priority raised and escalation audited at ${level}. No external notification or message was sent.` });
  } catch (error) {
    console.error('[marketing.whatsapp-sla] escalation failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to record SLA escalation.' }, { status: 503 });
  }
}
