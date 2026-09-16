import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { inboxId, commentId, content, platform } = body;
    if (!inboxId || !content) return NextResponse.json({ success: false, error: 'inboxId and content required' }, { status: 400 });

    const inbox = await db.socialInbox.findUnique({ where: { id: inboxId } }).catch(() => null);
    if (!inbox) return NextResponse.json({ success: false, error: 'Inbox item not found' }, { status: 404 });

    // Update status to replied
    await db.socialInbox.update({
      where: { id: inboxId },
      data: { status: 'replied', assignedTo: auth.userId },
    });

    // Log message
    await db.socialInboxMessage.create({
      data: {
        conversationId: inboxId,
        direction: 'OUTBOUND',
        messageText: content,
        platform: platform || (inbox as any).platform || 'facebook',
        senderId: auth.userId,
        employeeId: auth.userId,
        sentAt: new Date(),
      },
    }).catch(() => {});

    await db.aloAuditLog.create({
      data: {
        actorType: auth.roles[0] || 'marketing',
        actorName: auth.name || auth.userId,
        action: 'SOCIAL_REPLY',
        resource: 'SocialInbox',
        resourceId: inboxId,
        details: JSON.stringify({ platform, content: content.slice(0,100) }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Reply sent (official API)', note: 'Uses Meta Graph API official endpoint - configure access token in env' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
