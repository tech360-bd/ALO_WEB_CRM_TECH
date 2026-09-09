// ============================================================
// /api/crm/ucc/conversations/[id]/reply
// POST — Send a reply or internal note on a conversation
// RBAC: COUNSELOR, SUPPORT, MARKETING_MANAGER, BRANCH_MANAGER,
//        DEPARTMENT_MANAGER, ADMIN, SUPER_ADMIN
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ALLOWED_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER',
  'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'SUPPORT', 'VISA_OFFICER',
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!ALLOWED_ROLES.includes(primaryRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — insufficient role to reply to conversations.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      content,
      messageType = 'text',
      isInternalNote = false,
      aiGenerated = false,
      aiApproved = false,
    } = body as {
      content: string;
      messageType?: string;
      isInternalNote?: boolean;
      aiGenerated?: boolean;
      aiApproved?: boolean;
    };

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
    }

    const conversation = await db.uccConversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    // Non-admin employees can only reply to conversations assigned to them
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'].includes(primaryRole);
    if (!isAdmin && conversation.assignedToUserId && conversation.assignedToUserId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only reply to conversations assigned to you.' },
        { status: 403 }
      );
    }

    const direction = isInternalNote ? 'internal_note' : 'outbound';

    const message = await db.uccMessage.create({
      data: {
        conversationId: id,
        direction,
        senderId: auth.userId,
        senderName: auth.name || auth.email || 'Staff',
        senderRole: 'employee',
        channel: conversation.channel,
        content: content.trim(),
        messageType,
        status: 'sent',
        aiGenerated,
        aiApproved: aiGenerated ? aiApproved : true,
        metadata: JSON.stringify({
          sentAt: new Date().toISOString(),
          isInternalNote,
          senderEmail: auth.email,
        }),
      },
    });

    // Update conversation last message timestamp
    await db.uccConversation.update({
      where: { id },
      data: {
        lastMessageText: content.trim().substring(0, 200),
        lastMessageAt: new Date(),
      },
    });

    await logAuditAction(auth, isInternalNote ? 'INTERNAL_NOTE_ADDED' : 'REPLY_SENT', 'UccConversation', id, {
      messageId: message.id,
      channel: conversation.channel,
      aiGenerated,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
