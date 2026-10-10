import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';
import { normalizePhone } from '@/lib/phone-normalization';
import { canUseUccCommunication, isUccDocumentSupervisor } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B, filterUccConversationsByB2B } from '@/lib/ucc/conversation-visibility';

type InboxStudent = { id: string; studentId: string; name: string; phone: string };
type InboxLead = { id: string; fullName: string; phone: string };

function normalizedChannel(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function iso(value: Date | string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export const GET = withAuth(async (req, auth) => {
  if (!canUseUccCommunication(auth)) return NextResponse.json({ success: false, error: 'Inbox access is not permitted.' }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const channel = normalizedChannel(searchParams.get('channel'));
    const studentId = searchParams.get('studentId')?.trim() || '';
    const supervisor = isUccDocumentSupervisor(auth);

    const threadWhere: any = {};
    if (!supervisor) threadWhere.assignedToId = auth.userId;
    if (channel && channel !== 'all') threadWhere.channel = channel;
    if (studentId) threadWhere.studentId = studentId;

    const uccWhere: any = {};
    if (!supervisor) uccWhere.assignedToUserId = auth.userId;
    if (channel && channel !== 'all') uccWhere.channel = channel;
    if (studentId) uccWhere.studentId = studentId;

    const [threads, rawUccThreads] = await Promise.all([
      db.communicationThread.findMany({
        where: threadWhere,
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 50 } },
      }),
      db.uccConversation.findMany({
        where: uccWhere,
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 50, include: { attachments: true } } },
      }),
    ]);
    const [visibleThreads, uccThreads] = await Promise.all([
      filterUccConversationsByB2B<any>(auth, threads),
      filterUccConversationsByB2B<any>(auth, rawUccThreads),
    ]);

    const allStudentIds = [...new Set([...visibleThreads.map((thread) => thread.studentId), ...uccThreads.map((thread) => thread.studentId)].filter((value): value is string => typeof value === 'string' && value.length > 0))];
    const students = allStudentIds.length ? await db.student.findMany({
      where: { id: { in: allStudentIds } }, select: { id: true, studentId: true, name: true, phone: true },
    }) : [];
    const studentMap = new Map<string, InboxStudent>((students as InboxStudent[]).map((student) => [student.id, student]));
    const allLeadIds = [...new Set([...visibleThreads.map((thread) => thread.leadId), ...uccThreads.map((thread) => thread.leadId)].filter((value): value is string => typeof value === 'string' && value.length > 0))];
    const leads = allLeadIds.length ? await db.lead.findMany({ where: { id: { in: allLeadIds } }, select: { id: true, fullName: true, phone: true } }) : [];
    const leadMap = new Map<string, InboxLead>((leads as InboxLead[]).map((lead) => [lead.id, lead]));
    const uccStudentIds = new Set(uccThreads.map((thread) => thread.studentId).filter((value): value is string => !!value));
    const uccLeadIds = new Set(uccThreads.map((thread) => thread.leadId).filter((value): value is string => !!value));
    const uccPhoneKeys = new Set(uccThreads.map((thread) => normalizePhone(thread.participantPhone)).filter(Boolean));
    const legacyThreads = visibleThreads.filter((thread) => {
      const student = studentMap.get(thread.studentId);
      const lead = leadMap.get(thread.leadId);
      const phone = normalizePhone(student?.phone || lead?.phone);
      return !(thread.studentId && uccStudentIds.has(thread.studentId)) && !(thread.leadId && uccLeadIds.has(thread.leadId)) && !(phone && uccPhoneKeys.has(phone));
    });

    const conversationList = [
      ...legacyThreads.map((thread) => {
        const student = studentMap.get(thread.studentId);
        const lead = leadMap.get(thread.leadId);
        const messages = [...thread.messages].map((message) => ({
          id: message.id,
          channel: String(message.channel || thread.channel).toUpperCase(),
          direction: String(message.direction || '').toLowerCase() === 'inbound' ? 'INBOUND' : 'OUTBOUND',
          fromName: message.senderName || undefined,
          fromPhone: message.senderContact || student?.phone || undefined,
          body: message.content || message.messageBody || '',
          receivedAt: iso(message.createdAt),
          sentAt: String(message.direction || '').toLowerCase() === 'outbound' ? iso(message.createdAt) : null,
          deliveryStatus: String(message.deliveryStatus || message.status || 'unknown').toUpperCase(),
          read: Boolean(message.isRead),
          aiAssisted: Boolean(message.isAiGenerated),
          attachmentsJson: '[]',
        }));
        return {
          key: thread.id,
          id: thread.id,
          source: 'communication_thread',
          channel: String(thread.channel || 'whatsapp').toUpperCase(),
          studentId: thread.studentId || null,
          studentName: student?.name || lead?.fullName || thread.subject || 'Unknown contact',
          fromPhone: student?.phone || lead?.phone || undefined,
          fromEmail: undefined,
          messages,
          unread: thread.unreadCount || 0,
          lastMessageAt: iso(thread.lastMessageAt),
        };
      }),
      ...uccThreads.map((thread) => {
        const student = thread.studentId ? studentMap.get(thread.studentId) : null;
        const lead = thread.leadId ? leadMap.get(thread.leadId) : null;
        const messages = [...thread.messages].map((message) => {
          const attachments = message.attachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.fileName,
            type: attachment.mimeType,
            size: attachment.fileSize,
            url: attachment.fileUrl,
          }));
          return {
            id: message.id,
            channel: String(message.channel || thread.channel).toUpperCase(),
            direction: String(message.direction || '').toLowerCase() === 'inbound' ? 'INBOUND' : 'OUTBOUND',
            fromName: message.senderName || undefined,
            fromPhone: thread.participantPhone || undefined,
            body: message.content || '',
            receivedAt: iso(message.createdAt),
            sentAt: String(message.direction || '').toLowerCase() === 'outbound' ? iso(message.createdAt) : null,
            deliveryStatus: String(message.status || 'unknown').toUpperCase(),
            read: String(message.status || '').toLowerCase() === 'read',
            aiAssisted: Boolean(message.aiGenerated),
            attachmentsJson: JSON.stringify(attachments),
          };
        });
        return {
          key: thread.id,
          id: thread.id,
          source: 'ucc_conversation',
          channel: String(thread.channel || 'whatsapp').toUpperCase(),
          studentId: thread.studentId || null,
          studentName: thread.participantName || student?.name || lead?.fullName || 'Unknown contact',
          fromPhone: thread.participantPhone || student?.phone || lead?.phone || undefined,
          fromEmail: thread.participantEmail || undefined,
          messages,
          unread: thread.unreadCount || 0,
          lastMessageAt: iso(thread.lastMessageAt),
        };
      }),
    ].sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());

    return NextResponse.json({ success: true, conversations: conversationList, totalMessages: conversationList.reduce((total, item) => total + item.messages.length, 0), total: conversationList.length });
  } catch {
    return NextResponse.json({ success: false, error: 'Inbox data is temporarily unavailable.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  if (!canUseUccCommunication(auth)) return NextResponse.json({ success: false, error: 'Reply permission is not permitted.' }, { status: 403 });
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid reply payload is required.' }, { status: 400 });
    const threadId = typeof body.threadId === 'string' ? body.threadId.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : typeof body.body === 'string' ? body.body.trim() : '';
    const channel = normalizedChannel(body.channel);
    if (!threadId || !content) return NextResponse.json({ success: false, error: 'threadId and message content are required.' }, { status: 400 });
    if (content.length > 4096) return NextResponse.json({ success: false, error: 'WhatsApp message text must be 4,096 characters or fewer.' }, { status: 400 });
    if (body.attachments || body.files || body.fileUrl) return NextResponse.json({ success: false, error: 'Attachments must be privately uploaded and sent through the UCC document workflow.' }, { status: 400 });

    const uccConversation = await db.uccConversation.findUnique({ where: { id: threadId }, select: { id: true } });
    if (uccConversation) return NextResponse.json({ success: false, error: 'Use the authenticated UCC conversation reply route for this conversation.' }, { status: 409 });
    const thread = await db.communicationThread.findUnique({
      where: { id: threadId }, select: { id: true, channel: true, studentId: true, leadId: true, assignedToId: true },
    });
    if (!thread || !(await canViewUccConversationB2B(auth, thread))) return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    if (!isUccDocumentSupervisor(auth) && thread.assignedToId !== auth.userId) return NextResponse.json({ success: false, error: 'You may reply only to assigned conversations.' }, { status: 403 });
    if (channel !== 'whatsapp' || normalizedChannel(thread.channel) !== 'whatsapp') {
      return NextResponse.json({ success: false, error: 'No authorized outbound provider is configured for this conversation channel.' }, { status: 503 });
    }

    let recipient = '';
    if (thread.studentId) {
      const student = await db.student.findUnique({ where: { id: thread.studentId }, select: { phone: true } });
      recipient = student?.phone || '';
    }
    if (!recipient && thread.leadId) {
      const lead = await db.lead.findUnique({ where: { id: thread.leadId }, select: { phone: true } });
      recipient = lead?.phone || '';
    }
    if (!recipient) return NextResponse.json({ success: false, error: 'The conversation has no verified recipient phone number.' }, { status: 422 });

    const providerSend = await sendWhatsAppMessage({ to: recipient, text: content });
    if (!providerSend.success || !providerSend.messageId) {
      const status = /not configured/i.test(providerSend.error || '') ? 503 : 502;
      return NextResponse.json({ success: false, error: providerSend.error || 'WhatsApp provider did not confirm the reply.' }, { status });
    }

    try {
      const message = await db.communicationMessage.create({
        data: {
          threadId: thread.id,
          channel: 'whatsapp',
          direction: 'outbound',
          senderType: 'employee',
          senderId: auth.userId,
          senderUserId: auth.userId,
          senderName: auth.name || auth.email || 'Staff',
          senderContact: auth.email || '',
          recipientContact: recipient,
          communicationCode: providerSend.messageId,
          content,
          messageBody: content,
          status: 'sent',
          deliveryStatus: 'sent',
          isRead: true,
          isAiGenerated: body.aiAssisted === true,
          aiApprovedBy: body.aiAssisted === true ? auth.userId : '',
        },
      });
      await db.communicationThread.update({ where: { id: thread.id }, data: { lastMessageAt: new Date(), lastMessagePreview: content.slice(0, 100) } });
      if (thread.studentId) {
        await db.timelineEvent.create({ data: { studentId: thread.studentId, stage: 'MESSAGE_SENT', title: 'WhatsApp reply sent', description: content.slice(0, 100) } }).catch(() => {});
      }
      return NextResponse.json({ success: true, message, providerMessageId: providerSend.messageId });
    } catch {
      return NextResponse.json({ success: true, sent: true, persistenceWarning: true, providerMessageId: providerSend.messageId, message: null, error: 'The provider accepted the message but the communication timeline could not be updated.' }, { status: 202 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Reply could not be processed.' }, { status: 503 });
  }
});
