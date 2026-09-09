// ============================================================
// /api/crm/ucc/conversations/[id]/assign
// POST — Assign or re-assign a conversation to a user or role
// RBAC: ADMIN, SUPER_ADMIN, BRANCH_MANAGER, DEPARTMENT_MANAGER, COUNSELOR
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'COUNSELOR'].includes(primaryRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { assignedToUserId, assignedRole, reason } = await request.json() as {
      assignedToUserId?: string;
      assignedRole?: string;
      reason?: string;
    };

    if (!assignedToUserId && !assignedRole) {
      return NextResponse.json(
        { success: false, error: 'assignedToUserId or assignedRole is required.' },
        { status: 400 }
      );
    }

    const conversation = await db.uccConversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    const previousAssignee = conversation.assignedToUserId;

    const updated = await db.uccConversation.update({
      where: { id },
      data: {
        assignedToUserId: assignedToUserId || conversation.assignedToUserId,
        assignedRole: assignedRole || conversation.assignedRole,
      },
    });

    // System message in thread
    await db.uccMessage.create({
      data: {
        conversationId: id,
        direction: 'system',
        senderName: 'System',
        senderRole: 'system',
        channel: conversation.channel,
        content: `Conversation assigned to ${assignedRole || assignedToUserId || 'team'}${reason ? `. Reason: ${reason}` : ''}.`,
        messageType: 'text',
        status: 'sent',
      },
    });

    await logAuditAction(auth, 'CONVERSATION_ASSIGNED', 'UccConversation', id, {
      previousAssignee,
      assignedToUserId,
      assignedRole,
      reason,
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
