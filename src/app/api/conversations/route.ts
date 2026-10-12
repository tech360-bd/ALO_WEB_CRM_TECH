import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';

// ─── GET: List conversations or messages ─────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;

    // If conversationId is present, return messages for that conversation
    const conversationId = sp.get('conversationId');
    if (conversationId) {
      const { page, limit, skip } = parsePagination(sp, 50);

      const [messages, total] = await Promise.all([
        db.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        }),
        db.message.count({ where: { conversationId } }),
      ]);

      return NextResponse.json({ success: true, data: messages, meta: { page, limit, total } });
    }

    // Otherwise list conversations
    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('studentId')) where.studentId = sp.get('studentId');
    if (sp.get('type')) where.type = sp.get('type');

    // Students see only own conversations
    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    }

    const [data, total] = await Promise.all([
      db.conversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.conversation.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error in conversations GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conversations.' }, { status: 500 });
  }
}

// ─── POST: Create conversation + first message OR reply ──────

const createConversationSchema = z.object({
  studentId: z.string().optional(),
  type: z.string().default('GENERAL'),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const replyTo = sp.get('replyTo');

    const body = await req.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Reply to existing conversation
    if (replyTo) {
      const conversation = await db.conversation.findUnique({ where: { id: replyTo } });
      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
      }

      const message = await db.message.create({
        data: {
          conversationId: replyTo,
          senderId: auth.user.id,
          senderRole: auth.user.role,
          content: parsed.data.content,
        },
      });

      await db.conversation.update({
        where: { id: replyTo },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ success: true, data: message }, { status: 201 });
    }

    // Create new conversation + first message
    const studentId = auth.user.role === 'STUDENT' ? auth.user.id : (parsed.data.studentId || undefined);
    const participantIds = JSON.stringify([auth.user.id, ...(studentId ? [studentId] : [])]);

    const conversation = await db.conversation.create({
      data: {
        studentId: studentId || undefined,
        participantIds,
        type: parsed.data.type,
        title: parsed.data.title || undefined,
        messages: {
          create: {
            senderId: auth.user.id,
            senderRole: auth.user.role,
            content: parsed.data.content,
          },
        },
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CONVERSATION_CREATE',
      resource: 'Conversation',
      resourceId: conversation.id,
      details: { type: parsed.data.type },
    });

    return NextResponse.json({ success: true, data: conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ success: false, error: 'Failed to create conversation.' }, { status: 500 });
  }
}
