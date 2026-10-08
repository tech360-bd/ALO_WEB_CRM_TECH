import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { canAccessUccConversation, canUseUccCommunication, canViewUccB2B, isUccDocumentSupervisor } from '@/lib/ucc/document-access';
import { visibleUccAttachmentsByMessage } from '@/lib/ucc/visible-attachments';
import { canViewUccConversationB2B, filterUccConversationsByB2B } from '@/lib/ucc/conversation-visibility';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccCommunication(auth)) return NextResponse.json({ success: false, error: 'Communication inbox access is not permitted.' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  if (id) {
    const conversation = await db.uccConversation.findUnique({
      where: { id },
      select: {
        id: true, channel: true, participantName: true, participantPhone: true, participantEmail: true,
        studentId: true, leadId: true, assignedToUserId: true, assignedRole: true, destinationCountry: true,
        status: true, priority: true, lastMessageText: true, lastMessageAt: true, unreadCount: true,
      },
    });
    if (!conversation || !canAccessUccConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
      return NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 });
    }
    const newestMessages = await db.uccMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
      take: 250,
      select: {
        id: true, direction: true, senderId: true, senderName: true, senderRole: true, channel: true,
        content: true, messageType: true, status: true, aiGenerated: true, aiApproved: true, metadata: true, createdAt: true,
      },
    });
    const orderedMessages = newestMessages.reverse();
    const attachmentsByMessage = await visibleUccAttachmentsByMessage(auth, id, orderedMessages.map((message) => message.id));
    const messages = orderedMessages.map((message) => ({
      ...message,
      attachments: attachmentsByMessage.get(message.id) || [],
    }));
    const applications = conversation.studentId
      ? await db.application.findMany({
          where: { studentId: conversation.studentId, ...(!canViewUccB2B(auth) ? { isB2bConfidential: false } : {}) },
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: { id: true, applicationCode: true, universityName: true, courseName: true, isB2bConfidential: true },
        })
      : [];
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'UCC_CONVERSATION_VIEWED',
        entityType: 'UccConversation',
        entityId: id,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        userAgent: request.headers.get('user-agent') || '',
        metadata: JSON.stringify({ effectiveUserId: auth.userId, role: auth.roles[0] || auth.userType, messageCount: messages.length }),
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, conversation, applications, data: messages, messages });
  }

  const where: any = {};
  const status = searchParams.get('status');
  const channel = searchParams.get('channel');
  const assignedToId = searchParams.get('assignedToId');
  const search = (searchParams.get('search') || '').trim().slice(0, 100);
  if (status && status !== 'all') where.status = status;
  if (channel && channel !== 'all' && channel !== 'ALL') where.channel = channel;
  if (isUccDocumentSupervisor(auth)) {
    if (assignedToId) where.assignedToUserId = assignedToId;
  } else {
    where.assignedToUserId = auth.userId;
  }
  if (search) {
    where.OR = [
      { participantName: { contains: search } },
      { participantPhone: { contains: search } },
      { participantEmail: { contains: search } },
      { lastMessageText: { contains: search } },
    ];
  }

  try {
    const conversations = await db.uccConversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      select: {
        id: true, channel: true, participantName: true, participantPhone: true, participantEmail: true,
        studentId: true, leadId: true, assignedToUserId: true, assignedRole: true, destinationCountry: true,
        status: true, priority: true, lastMessageText: true, lastMessageAt: true, unreadCount: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, direction: true, senderName: true, content: true, messageType: true, status: true, createdAt: true } },
      },
    });
    const visibleConversations = await filterUccConversationsByB2B(auth, conversations);
    return NextResponse.json({ success: true, conversations: visibleConversations, data: visibleConversations, total: visibleConversations.length });
  } catch {
    return NextResponse.json({ success: false, error: 'Conversations are temporarily unavailable.' }, { status: 503 });
  }
}

// Use the provider-backed reply route so text and media are never recorded as
// delivered without an authorized external provider acknowledgement.
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'This legacy send route is disabled. Use the conversation-specific /reply endpoint.',
  }, { status: 410, headers: { Allow: 'GET' } });
}
