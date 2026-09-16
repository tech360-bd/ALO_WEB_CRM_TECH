import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { getPool } from '@/lib/whatsapp-number-pool';
import { resolveSlaOnReply } from '@/lib/sla-engine';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { threadId, conversationId, content, channel, attachmentUrl } = body;
    const finalThreadId = threadId || conversationId;
    if (!finalThreadId || !content) return NextResponse.json({ success: false, error: 'threadId/conversationId and content required' }, { status: 400 });

    // Resolve thread
    let thread = await db.communicationThread.findUnique({ where: { id: finalThreadId } }).catch(() => null) ||
                 await db.uccConversation.findUnique({ where: { id: finalThreadId } }).catch(() => null);

    if (!thread) return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });

    // RBAC: assigned only unless super_admin
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isSuper) {
      const assignedTo = (thread as any).assignedToId || (thread as any).assignedTo || (thread as any).counselorId;
      if (assignedTo && assignedTo !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Not assigned to this thread' }, { status: 403 });
      }
    }

    const studentId = (thread as any).studentId || (thread as any).contactId;
    const officialNumber = (thread as any).senderNumber || getPool()[0]?.number;

    // Create message
    const msg = await db.communicationMessage.create({
      data: {
        threadId: finalThreadId,
        senderType: 'employee',
        senderId: auth.userId,
        content,
        channel: channel || (thread as any).channel || 'whatsapp',
        fileUrl: attachmentUrl || '',
      },
    }).catch(() => null);

    // Also UccMessage
    try {
      await db.uccMessage.create({
        data: {
          conversationId: finalThreadId,
          direction: 'outbound',
          channel: channel || 'whatsapp',
          content,
          senderId: auth.userId,
          senderName: auth.name || 'Employee',
          senderRole: 'employee',
          status: 'sent',
        },
      });
    } catch {}

    // Update thread lastMessageAt
    try {
      await db.communicationThread.update({ where: { id: finalThreadId }, data: { lastMessageAt: new Date() } });
    } catch {
      try { await db.uccConversation.update({ where: { id: finalThreadId }, data: { lastMessageAt: new Date() } }); } catch {}
    }

    // Resolve SLA
    await resolveSlaOnReply(finalThreadId, auth.userId).catch(() => {});

    // Timeline
    if (studentId) {
      await db.timelineEvent.create({
        data: {
          studentId,
          stage: 'MESSAGE_SENT',
          title: `Reply sent via ${channel || 'whatsapp'} by ${auth.name}`,
          description: content.slice(0,200),
        },
      }).catch(() => {});
    }

    await db.aloAuditLog.create({
      data: {
        studentId: studentId || '',
        actorType: auth.roles[0] || 'counselor',
        actorName: auth.name || auth.userId,
        action: 'INBOX_REPLY',
        resource: 'CommunicationThread',
        resourceId: finalThreadId,
        details: JSON.stringify({ channel, content: content.slice(0,100) }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: msg, officialNumber, note: `Sent via official number ${officialNumber}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
