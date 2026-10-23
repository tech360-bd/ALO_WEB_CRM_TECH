import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { isMarketingManager, withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function assignedConversationKeys(userId: string): Promise<Set<string>> {
  const assignments = await db.uccConversation.findMany({
    where: { assignedToUserId: userId, status: { not: 'closed' } },
    select: { id: true, externalId: true },
    take: 500,
  });
  return new Set(assignments.flatMap((conversation) => [conversation.id, conversation.externalId].filter((id): id is string => Boolean(id))));
}

function isAssignedConversation(conversationId: string | null | undefined, keys: Set<string>): boolean {
  return Boolean(conversationId && keys.has(conversationId));
}

// GET — managers see the unified social inbox; limited users see only conversations assigned to them in the canonical UCC assignment system.
export const GET = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const params = new URL(req.url).searchParams;
  const platform = params.get('platform');
  const unreadOnly = params.get('unread') === 'true';
  const manager = isMarketingManager(auth);
  const where: Record<string, unknown> = {};
  if (platform && platform !== 'ALL') where.platform = platform;
  if (unreadOnly) where.isRead = false;

  try {
    if (!manager) {
      const assignedKeys = await assignedConversationKeys(auth.userId);
      if (assignedKeys.size === 0) {
        return NextResponse.json({ success: true, conversations: [], totalMessages: 0, unreadCount: 0, aiHandledCount: 0, platformStats: {} });
      }
      where.conversationId = { in: [...assignedKeys] };
    }
    const messages = await db.socialInboxMessage.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: 500,
      select: {
        id: true, platform: true, direction: true, senderId: true, senderName: true,
        senderAvatar: true, recipientId: true, messageText: true, messageMediaUrl: true,
        messageMediaMetadata: true, commentId: true, postId: true, conversationId: true,
        leadId: true, studentId: true, aiHandled: true, aiDraftReply: true,
        humanApproved: true, isRead: true, keywordTriggered: true, externalId: true,
        receivedAt: true, sentAt: true,
      },
    });

    const conversations: Record<string, any> = {};
    for (const message of messages) {
      const key = message.conversationId || `${message.platform}-${message.senderId || 'unknown'}`;
      if (!conversations[key]) {
        conversations[key] = {
          conversationId: key, platform: message.platform, senderName: message.senderName,
          senderId: message.senderId, lastMessage: message.messageText,
          lastMessageAt: message.receivedAt, unread: 0, aiHandled: message.aiHandled, messages: [],
        };
      }
      conversations[key].messages.push(message);
      if (message.direction === 'INBOUND' && !message.isRead) conversations[key].unread++;
      if (new Date(message.receivedAt) > new Date(conversations[key].lastMessageAt)) {
        conversations[key].lastMessage = message.messageText;
        conversations[key].lastMessageAt = message.receivedAt;
      }
    }
    const conversationList = Object.values(conversations).sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    const platformStats: Record<string, number> = {};
    for (const message of messages) platformStats[message.platform] = (platformStats[message.platform] || 0) + 1;
    return NextResponse.json({
      success: true,
      conversations: conversationList,
      totalMessages: messages.length,
      unreadCount: messages.filter((message) => !message.isRead && message.direction === 'INBOUND').length,
      aiHandledCount: messages.filter((message) => message.aiHandled).length,
      platformStats,
    });
  } catch (error) {
    console.error('[marketing.social-inbox] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load the assigned social inbox.' }, { status: 500 });
  }
}, 'social-inbox');

// POST — only save a human-reviewed draft. Actual replies must go through a verified official-channel delivery integration.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== 'string') return NextResponse.json({ success: false, error: 'An explicit inbox action is required.' }, { status: 400 });

  if (body.action === 'approve_draft') {
    if (!isMarketingManager(auth)) return NextResponse.json({ success: false, error: 'Marketing Manager or Super Admin approval is required.' }, { status: 403 });
    if (typeof body.messageId !== 'string' || !body.messageId.trim()) return NextResponse.json({ success: false, error: 'messageId is required.' }, { status: 400 });
    try {
      const current = await db.socialInboxMessage.findUnique({ where: { id: body.messageId.trim() } });
      if (!current || current.direction !== 'INBOUND') return NextResponse.json({ success: false, error: 'Inbound message not found.' }, { status: 404 });
      if (!current.aiDraftReply?.trim()) return NextResponse.json({ success: false, error: 'No reply draft is awaiting review.' }, { status: 409 });
      if (current.humanApproved) return NextResponse.json({ success: false, error: 'Draft has already been reviewed.' }, { status: 409 });
      const changed = await db.socialInboxMessage.updateMany({ where: { id: current.id, humanApproved: false }, data: { humanApproved: true } });
      if (!changed.count) return NextResponse.json({ success: false, error: 'Draft status changed before review.' }, { status: 409 });
      await db.auditLog.create({ data: { userId: auth.userId, action: 'MESSAGE_ACTION', resource: 'SocialInboxMessage', resourceId: current.id, details: JSON.stringify({ action: 'draft_approved_not_sent', conversationId: current.conversationId }) } });
      return NextResponse.json({ success: true, state: 'APPROVED_DRAFT', sent: false, message: 'Draft approved internally. No message was sent.' });
    } catch (error) {
      console.error('[marketing.social-inbox] draft approval failed', { error: error instanceof Error ? error.name : 'UnknownError' });
      return NextResponse.json({ success: false, error: 'Unable to approve draft.' }, { status: 500 });
    }
  }

  if (body.action === 'reject_draft') {
    if (!isMarketingManager(auth)) return NextResponse.json({ success: false, error: 'Marketing Manager or Super Admin review is required.' }, { status: 403 });
    if (typeof body.messageId !== 'string' || !body.messageId.trim()) return NextResponse.json({ success: false, error: 'messageId is required.' }, { status: 400 });
    try {
      const current = await db.socialInboxMessage.findUnique({ where: { id: body.messageId.trim() } });
      if (!current || current.direction !== 'INBOUND') return NextResponse.json({ success: false, error: 'Inbound message not found.' }, { status: 404 });
      if (!current.aiDraftReply?.trim() || current.humanApproved) return NextResponse.json({ success: false, error: 'No pending reply draft was found.' }, { status: 409 });
      const changed = await db.socialInboxMessage.updateMany({ where: { id: current.id, humanApproved: false }, data: { aiDraftReply: null, humanApproved: false } });
      if (!changed.count) return NextResponse.json({ success: false, error: 'Draft status changed before review.' }, { status: 409 });
      await db.auditLog.create({ data: { userId: auth.userId, action: 'MESSAGE_ACTION', resource: 'SocialInboxMessage', resourceId: current.id, details: JSON.stringify({ action: 'draft_rejected', conversationId: current.conversationId }) } });
      return NextResponse.json({ success: true, state: 'DRAFT_REJECTED', sent: false, message: 'Draft rejected and removed. No message was sent.' });
    } catch (error) {
      console.error('[marketing.social-inbox] draft rejection failed', { error: error instanceof Error ? error.name : 'UnknownError' });
      return NextResponse.json({ success: false, error: 'Unable to reject draft.' }, { status: 500 });
    }
  }

  if (body.action !== 'save_draft') {
    return NextResponse.json({ success: false, deliveryStatus: 'NOT_CONFIGURED', error: 'Official-channel sending is not configured here. No message was sent or marked delivered.' }, { status: 503 });
  }
  const platform = typeof body.platform === 'string' ? body.platform.trim().toUpperCase() : '';
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
  const draftText = typeof body.messageText === 'string' ? body.messageText.trim() : '';
  if (!['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'EMAIL', 'SMS', 'WEBSITE_CHAT'].includes(platform)) {
    return NextResponse.json({ success: false, error: 'Unsupported platform.' }, { status: 400 });
  }
  if (!conversationId || conversationId.length > 191 || !draftText || draftText.length > 5000) {
    return NextResponse.json({ success: false, error: 'A conversation and reply draft of 1–5000 characters are required.' }, { status: 400 });
  }

  try {
    if (!isMarketingManager(auth)) {
      const assignedKeys = await assignedConversationKeys(auth.userId);
      if (!isAssignedConversation(conversationId, assignedKeys)) return NextResponse.json({ success: false, error: 'This conversation is not assigned to your account.' }, { status: 403 });
    }
    const inbound = await db.socialInboxMessage.findFirst({
      where: { platform, conversationId, direction: 'INBOUND' },
      orderBy: { receivedAt: 'desc' },
      select: { id: true, messageText: true, aiDraftReply: true, humanApproved: true },
    });
    if (!inbound) return NextResponse.json({ success: false, error: 'No inbound message found for this conversation.' }, { status: 404 });
    const updated = await db.socialInboxMessage.update({
      where: { id: inbound.id },
      data: { aiDraftReply: draftText, humanApproved: false, aiHandled: Boolean(body.aiDraftUsed) },
      select: { id: true, conversationId: true, aiDraftReply: true, humanApproved: true, receivedAt: true },
    });
    await db.auditLog.create({
      data: { userId: auth.userId, action: 'MESSAGE_ACTION', resource: 'SocialInboxMessage', resourceId: inbound.id, details: JSON.stringify({ action: 'reply_draft_saved', platform, conversationId, aiDraftUsed: Boolean(body.aiDraftUsed) }) },
    });
    return NextResponse.json({ success: true, state: 'DRAFT_PENDING_APPROVAL', sent: false, message: 'Reply saved as a draft for Marketing Manager review. It has not been sent.', draft: updated }, { status: 201 });
  } catch (error) {
    console.error('[marketing.social-inbox] save draft failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to save reply draft.' }, { status: 500 });
  }
}, 'social-inbox');
