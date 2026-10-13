import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where = {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    };

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.message.count({ where }),
    ]);

    return NextResponse.json({ messages, total });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ messages: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { fromUserId, toUserId, subject, body: messageBody, type } = body;

    if (!fromUserId || !toUserId || !messageBody) {
      return NextResponse.json(
        { error: 'fromUserId, toUserId, and body are required' },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        fromUserId,
        toUserId,
        subject: subject || null,
        body: messageBody,
        type: type || 'internal',
        isRead: false,
      },
    });

    // Create a notification for the recipient
    await db.notification.create({
      data: {
        userId: toUserId,
        title: subject ? `New message: ${subject}` : 'New message received',
        message:
          messageBody.length > 100
            ? messageBody.substring(0, 100) + '...'
            : messageBody,
        type: 'info',
        link: '/messages',
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageIds, userId } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'messageIds array is required' },
        { status: 400 }
      );
    }

    // Only mark messages as read where the user is the recipient
    const result = await db.message.updateMany({
      where: {
        id: { in: messageIds },
        toUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Messages PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
