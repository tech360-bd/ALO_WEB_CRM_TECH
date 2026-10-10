import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

const MAX_MESSAGE_LENGTH = 5000;

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const partner = await db.partnerProfile.findUnique({ where: { userId: auth.userId }, select: { partnerId: true } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const threadId = (searchParams.get('threadId') || '').trim();
    if (threadId) {
      const thread = await db.communicationThread.findFirst({
        where: { id: threadId, channel: 'partner_support', studentId: auth.userId, partnerId: partner.partnerId },
        select: { id: true, subject: true, status: true, createdAt: true, updatedAt: true, lastMessageAt: true, lastMessagePreview: true, unreadCount: true },
      });
      if (!thread) return NextResponse.json({ success: false, error: 'Support conversation not found.' }, { status: 404 });
      const messages = await db.communicationMessage.findMany({
        where: { threadId: thread.id },
        select: { id: true, content: true, senderId: true, senderType: true, senderName: true, isRead: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });
      await db.communicationMessage.updateMany({
        where: { threadId: thread.id, senderId: { not: auth.userId }, isRead: false },
        data: { isRead: true },
      });
      await db.communicationThread.update({ where: { id: thread.id }, data: { unreadCount: 0 } });
      return NextResponse.json({ success: true, data: { thread, messages: messages.map((message) => ({ ...message, isMine: message.senderId === auth.userId || message.senderType === 'partner' })) } });
    }

    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '30', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 30;
    const where = { channel: 'partner_support', studentId: auth.userId, partnerId: partner.partnerId };
    const [threads, total] = await Promise.all([
      db.communicationThread.findMany({
        where,
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          unreadCount: true,
          messages: { select: { content: true, senderId: true, senderName: true, isRead: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.communicationThread.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data: { threads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('[GET /partner/messages]', error);
    return NextResponse.json({ success: false, error: 'Partner messages are temporarily unavailable.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const partner = await db.partnerProfile.findUnique({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const threadId = typeof body.threadId === 'string' ? body.threadId.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : typeof body.text === 'string' ? body.text.trim() : '';
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: `Message content must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
    }
    if (!threadId && (!subject || subject.length > 200)) {
      return NextResponse.json({ success: false, error: 'A subject of 1 to 200 characters is required for a new support conversation.' }, { status: 400 });
    }

    if (threadId) {
      const thread = await db.communicationThread.findFirst({
        where: { id: threadId, channel: 'partner_support', studentId: auth.userId, partnerId: partner.partnerId },
        select: { id: true, status: true },
      });
      if (!thread) return NextResponse.json({ success: false, error: 'Support conversation not found.' }, { status: 404 });

      const result = await db.$transaction(async (tx) => {
        const message = await tx.communicationMessage.create({
          data: {
            threadId: thread.id,
            studentId: auth.userId,
            partnerId: partner.partnerId,
            senderType: 'partner',
            senderId: auth.userId,
            senderUserId: auth.userId,
            senderName: auth.name || partner.companyName,
            direction: 'outbound',
            source: 'portal',
            channel: 'partner_support',
            content,
            messageBody: content,
            messageType: 'text',
            type: 'text',
            status: 'sent',
            deliveryStatus: 'sent',
            isRead: true,
            isInternal: false,
          },
        });
        await tx.communicationThread.update({
          where: { id: thread.id },
          data: { status: 'open', lastMessageAt: new Date(), lastMessagePreview: content.slice(0, 200), updatedAt: new Date() },
        });
        return message;
      });
      return NextResponse.json({ success: true, data: { threadId: thread.id, message: result } }, { status: 201 });
    }

    const result = await db.$transaction(async (tx) => {
      const thread = await tx.communicationThread.create({
        data: {
          partnerId: partner.partnerId,
          studentId: auth.userId,
          channel: 'partner_support',
          subject,
          status: 'open',
          visibility: 'partner_support',
          lastMessageAt: new Date(),
          lastMessagePreview: content.slice(0, 200),
          unreadCount: 0,
          participants: { create: [{ participantId: partner.partnerId, participantType: 'partner' }, { participantId: auth.userId, participantType: 'partner_user' }] },
        },
        select: { id: true, subject: true, status: true, createdAt: true, lastMessageAt: true, lastMessagePreview: true },
      });
      const message = await tx.communicationMessage.create({
        data: {
          threadId: thread.id,
          studentId: auth.userId,
          partnerId: partner.partnerId,
          senderType: 'partner',
          senderId: auth.userId,
          senderUserId: auth.userId,
          senderName: auth.name || partner.companyName,
          direction: 'outbound',
          source: 'portal',
          channel: 'partner_support',
          messageSubject: subject,
          content,
          messageBody: content,
          messageType: 'text',
          type: 'text',
          status: 'sent',
          deliveryStatus: 'sent',
          isRead: true,
          isInternal: false,
        },
      });
      return { thread, message };
    });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('[POST /partner/messages]', error);
    return NextResponse.json({ success: false, error: 'Message could not be saved.' }, { status: 500 });
  }
}
