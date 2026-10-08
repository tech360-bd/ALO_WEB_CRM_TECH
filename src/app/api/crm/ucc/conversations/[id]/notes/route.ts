import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { canAccessUccConversation, canUseUccCommunication } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

async function authorizedConversation(request: Request, id: string) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return { response: auth } as const;
  if (!canUseUccCommunication(auth)) return { response: NextResponse.json({ success: false, error: 'Communication access is not permitted.' }, { status: 403 }) } as const;
  const conversation = await db.uccConversation.findUnique({ where: { id }, select: { id: true, channel: true, assignedToUserId: true, studentId: true } });
  if (!conversation || !canAccessUccConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
    return { response: NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 }) } as const;
  }
  return { auth, conversation } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await authorizedConversation(request, id);
  if ('response' in access) return access.response;
  try {
    const notes = await db.uccMessage.findMany({
      where: { conversationId: id, direction: 'internal_note' },
      orderBy: { createdAt: 'asc' },
      take: 250,
      select: { id: true, senderId: true, senderName: true, senderRole: true, content: true, createdAt: true },
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: access.auth.actorUserId || access.auth.userId,
        action: 'UCC_INTERNAL_NOTES_VIEWED',
        entityType: 'UccConversation',
        entityId: id,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        userAgent: request.headers.get('user-agent') || '',
        metadata: JSON.stringify({ effectiveUserId: access.auth.userId, role: access.auth.roles[0] || access.auth.userType, noteCount: notes.length }),
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, notes });
  } catch {
    return NextResponse.json({ success: false, error: 'Conversation notes are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await authorizedConversation(request, id);
  if ('response' in access) return access.response;
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 5000) {
    return NextResponse.json({ success: false, error: 'A note of 1–5000 characters is required.' }, { status: 400 });
  }

  try {
    const note = await db.uccMessage.create({
      data: {
        conversationId: id,
        direction: 'internal_note',
        senderId: access.auth.userId,
        senderName: access.auth.name || access.auth.email || 'Staff',
        senderRole: 'employee',
        channel: access.conversation.channel,
        content,
        messageType: 'text',
        status: 'sent',
        metadata: JSON.stringify({ addedAt: new Date().toISOString(), senderEmail: access.auth.email }),
      },
    });
    await logAuditAction(access.auth, 'INTERNAL_NOTE_ADDED', 'UccConversation', id, { messageId: note.id });
    return NextResponse.json({ success: true, note });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal note could not be saved.' }, { status: 503 });
  }
}
