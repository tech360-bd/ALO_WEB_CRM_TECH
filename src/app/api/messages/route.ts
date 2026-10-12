import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventRouter, EventType } from '@/lib/ai/event-router';

/* ------------------------------------------------------------------ */
/*  Valid message types                                                */
/* ------------------------------------------------------------------ */

const VALID_TYPES = ['INTERNAL', 'EMAIL', 'SMS', 'WHATSAPP'];

/* ------------------------------------------------------------------ */
/*  GET — List messages for current user (sent + received)              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build where clause — user is sender OR recipient
    const baseWhere: Record<string, unknown> = {
      OR: [{ senderId: userId }, { recipientId: userId }],
    };

    if (type && VALID_TYPES.includes(type)) {
      (baseWhere.OR as any[]).forEach((cond: any) => {
        cond.type = type;
      });
    }

    // For status filter, only apply to received messages (status belongs to recipient)
    if (status && ['UNREAD', 'READ', 'ARCHIVED'].includes(status)) {
      (baseWhere.OR as any[]).forEach((cond: any) => {
        cond.status = status;
      });
    }

    const [messages, unreadCount] = await Promise.all([
      db.message.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          sender: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          recipient: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      }),
      db.message.count({
        where: { recipientId: userId, status: 'UNREAD' },
      }),
    ]);

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Send a message                                              */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { error: authError, user } = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { recipientId, subject, body: msgBody, type } = body;

    // Validate required fields
    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json(
        { error: 'Recipient ID is required.' },
        { status: 400 },
      );
    }
    if (!msgBody || typeof msgBody !== 'string' || msgBody.trim().length < 1) {
      return NextResponse.json(
        { error: 'Message body is required.' },
        { status: 400 },
      );
    }

    // Validate type if provided
    const msgType = typeof type === 'string' && VALID_TYPES.includes(type)
      ? type
      : 'INTERNAL';

    // Verify recipient exists
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true, status: true },
    });
    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found.' },
        { status: 404 },
      );
    }

    const senderId = user!.id;

    const message = await db.message.create({
      data: {
        senderId,
        recipientId,
        subject: typeof subject === 'string' ? subject.trim() || null : null,
        body: msgBody.trim(),
        type: msgType,
        status: 'UNREAD',
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        recipient: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Fire AI event — message classification & response draft
    eventRouter.dispatch({
      type: EventType.NEW_MESSAGE,
      entityType: 'Message',
      entityId: message.id,
      data: { messageId: message.id, senderId, body: msgBody, type: msgType },
    }).catch(e => console.error('[AI Event] Failed:', e));

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
