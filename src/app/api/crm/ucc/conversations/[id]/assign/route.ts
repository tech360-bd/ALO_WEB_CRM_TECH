import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { canAccessUccConversation, canUseUccCommunication, isUccDocumentSupervisor } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

const ASSIGNABLE_ROLES = new Set(['COUNSELOR', 'APPLICATION_TEAM', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER', 'SUPPORT', 'SUPPORT_STAFF', 'FRONT_DESK']);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccCommunication(auth)) return NextResponse.json({ success: false, error: 'Communication access is not permitted.' }, { status: 403 });
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
  if (![...roles].some((role) => ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'COUNSELOR'].includes(role))) {
    return NextResponse.json({ success: false, error: 'Assignment permission is required.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const assignedToUserId = typeof body?.assignedToUserId === 'string' ? body.assignedToUserId.trim() : '';
  const assignedRole = typeof body?.assignedRole === 'string' ? body.assignedRole.trim().toUpperCase() : '';
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!assignedToUserId && !assignedRole) return NextResponse.json({ success: false, error: 'assignedToUserId or assignedRole is required.' }, { status: 400 });
  if (assignedRole && !ASSIGNABLE_ROLES.has(assignedRole)) return NextResponse.json({ success: false, error: 'The selected role cannot be assigned to a conversation.' }, { status: 400 });
  if (reason.length > 1000) return NextResponse.json({ success: false, error: 'Assignment reason must be 1000 characters or fewer.' }, { status: 400 });

  try {
    const conversation = await db.uccConversation.findUnique({ where: { id }, select: { id: true, channel: true, studentId: true, assignedToUserId: true, assignedRole: true } });
    if (!conversation) return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    if (!(await canViewUccConversationB2B(auth, conversation))) return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    if (!isUccDocumentSupervisor(auth) && (!canAccessUccConversation(auth, conversation) || conversation.assignedToUserId !== auth.userId)) {
      return NextResponse.json({ success: false, error: 'Only a supervisor or the currently assigned employee can reassign this conversation.' }, { status: 403 });
    }

    if (assignedToUserId) {
      const [portalUser, legacyUser] = await Promise.all([
        db.portalUser.findUnique({ where: { id: assignedToUserId }, select: { id: true, userType: true, status: true } }).catch(() => null),
        db.user.findUnique({ where: { id: assignedToUserId }, select: { id: true, role: true, status: true } }).catch(() => null),
      ]);
      const target = portalUser || legacyUser;
      const targetRole = String(portalUser?.userType || legacyUser?.role || '').toUpperCase();
      if (!target || ['STUDENT', 'PARTNER'].includes(targetRole) || (target.status && !['ACTIVE', 'active'].includes(target.status))) {
        return NextResponse.json({ success: false, error: 'Assignee must be an active employee account.' }, { status: 400 });
      }
    }

    const updated = await db.uccConversation.update({
      where: { id },
      data: {
        assignedToUserId: assignedToUserId || conversation.assignedToUserId,
        assignedRole: assignedRole || conversation.assignedRole,
      },
    });
    await db.uccMessage.create({
      data: {
        conversationId: id,
        direction: 'system',
        senderName: 'System',
        senderRole: 'system',
        channel: conversation.channel,
        content: `Conversation assignment changed by authorized staff${reason ? `. Reason: ${reason}` : ''}.`,
        messageType: 'text',
        status: 'sent',
      },
    });
    await logAuditAction(auth, 'CONVERSATION_ASSIGNED', 'UccConversation', id, {
      previousAssignee: conversation.assignedToUserId,
      assignedToUserId: assignedToUserId || conversation.assignedToUserId,
      assignedRole: assignedRole || conversation.assignedRole,
      reason,
    });
    return NextResponse.json({ success: true, conversation: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Conversation assignment could not be completed.' }, { status: 503 });
  }
}
