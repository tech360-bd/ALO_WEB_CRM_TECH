import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { canAccessUccConversation, canUseUccCommunication } from '@/lib/ucc/document-access';
import { visibleUccAttachmentsByMessage } from '@/lib/ucc/visible-attachments';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccCommunication(auth)) return NextResponse.json({ success: false, error: 'Communication inbox access is not permitted.' }, { status: 403 });
  const { id } = await params;

  try {
    const conversation = await db.uccConversation.findUnique({
      where: { id },
      select: { id: true, assignedToUserId: true, studentId: true, channel: true },
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
    return NextResponse.json({ success: true, data: messages, messages });
  } catch {
    return NextResponse.json({ success: false, error: 'Conversation messages are temporarily unavailable.' }, { status: 503 });
  }
}
