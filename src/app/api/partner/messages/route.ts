import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET: Get communication threads for this partner (threads where partner is a participant)
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || undefined;

    const where: any = {
      participants: { some: { participantId: partner.partnerId } },
    };
    if (status) {
      where.status = status;
    }

    const [threads, total] = await Promise.all([
      db.communicationThread.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.communicationThread.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /partner/messages]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a message – create a new thread or add to an existing thread
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const partner = await db.partnerProfile.findFirst({ where: { userId: auth.userId } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });

    const body = await request.json();
    const { threadId, recipientId, subject, content, channel } = body;

    if (!content || (!threadId && !recipientId)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: content, and either threadId or recipientId' },
        { status: 400 },
      );
    }

    if (threadId) {
      // Add message to existing thread
      const thread = await db.communicationThread.findUnique({
        where: { id: threadId },
        include: { participants: true },
      });
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
      }
      if (!thread.participants.some(p => p.participantId === partner.partnerId)) {
        return NextResponse.json({ success: false, error: 'Not a participant in this thread' }, { status: 403 });
      }

      const message = await db.communicationMessage.create({
        data: {
          threadId,
          senderId: auth.userId,
          content,
          type: 'text',
          messageType: 'text',
        },
      });

      await db.communicationThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json({ success: true, data: message });
    } else {
      // Create a new thread with the first message
      const participantIds = [partner.partnerId, recipientId];

      const thread = await db.communicationThread.create({
        data: {
          subject: subject || '',
          channel: channel || 'in_app',
          status: 'active',
          lastMessageAt: new Date(),
          participants: {
            create: participantIds.map(pid => ({
              participantId: pid,
              participantType: pid === partner.partnerId ? 'partner' : 'user',
            })),
          },
          messages: {
            create: {
              senderId: auth.userId,
              content,
              type: 'text',
              messageType: 'text',
            },
          },
        },
        include: { messages: true, participants: true },
      });

      return NextResponse.json({ success: true, data: thread });
    }
  } catch (error) {
    console.error('[POST /partner/messages]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
