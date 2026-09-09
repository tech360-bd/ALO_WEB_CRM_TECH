import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { generateText } from '@/lib/ai';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── GET: Social inbox with filters and pagination ────────────────────────────

export const GET = withAuth(async (request: Request, _auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'inbox') {
      return handleInbox(searchParams);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=inbox' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Social GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load social data' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

async function handleInbox(searchParams: URLSearchParams) {
  const platform = searchParams.get('platform') || undefined;
  const channel = searchParams.get('channel') || undefined;
  const resolved = searchParams.get('resolved');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (channel) where.channel = channel;
  if (resolved === 'false') {
    where.isResolved = false;
  } else if (resolved === 'true') {
    where.isResolved = true;
  }

  const [messages, total] = await Promise.all([
    db.marketingSocialMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.marketingSocialMessage.count({ where }),
  ]);

  return NextResponse.json({
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─── POST: Reply suggest, reply send ──────────────────────────────────────────

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'reply-suggest') {
      return handleReplySuggest(body);
    }
    if (action === 'reply-send') {
      return handleReplySend(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=reply-suggest or ?action=reply-send' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Social POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── AI Suggested Reply ──────────────────────────────────────────────────────

interface ReplySuggestInput {
  messageId: string;
}

async function handleReplySuggest(body: ReplySuggestInput) {
  const { messageId } = body;

  if (!messageId) {
    return NextResponse.json(
      { error: 'messageId is required' },
      { status: 400 }
    );
  }

  const message = await db.marketingSocialMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    );
  }

  const prompt = `You are a helpful social media manager for ALO Education, a study abroad consultancy in Bangladesh.

A ${message.senderName} sent this message on ${message.platform} (${message.channel}):
"${message.message}"

Their detected intent: ${message.intent || 'unknown'}

Generate a professional, helpful reply that:
1. Acknowledges their question/interest
2. Provides relevant information about studying abroad
3. Is warm and encouraging
4. Invites them to contact ALO Education for personalized counseling
5. Is concise but informative
6. Matches the platform tone (${message.platform})

Reply in ${message.platform === 'whatsapp' || message.platform === 'messenger' ? 'a casual, friendly tone' : 'a professional yet approachable tone'}.

Return ONLY the reply text, nothing else.`;

  const result = await generateText({ prompt, model: 'glm-4-flash' });
  const suggestedReply = (result.text || '').trim();

  const updated = await db.marketingSocialMessage.update({
    where: { id: messageId },
    data: { suggestedReply },
  });

  return NextResponse.json({ message: updated });
}

// ─── Send Reply ──────────────────────────────────────────────────────────────

interface ReplySendInput {
  messageId: string;
  replyText: string;
}

async function handleReplySend(body: ReplySendInput, auth: AuthContext) {
  const { messageId, replyText } = body;

  if (!messageId || !replyText) {
    return NextResponse.json(
      { error: 'messageId and replyText are required' },
      { status: 400 }
    );
  }

  const message = await db.marketingSocialMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    );
  }

  const updated = await db.marketingSocialMessage.update({
    where: { id: messageId },
    data: {
      replySent: replyText,
      repliedAt: new Date(),
      isResolved: true,
    },
  });

  await createAuditLog({
    userId: auth.userId,
    role: auth.roles[0] || 'marketing',
    action: 'social.reply_send',
    resource: 'MarketingSocialMessage',
    resourceId: messageId,
    details: { platform: message.platform, channel: message.channel },
  });

  return NextResponse.json({ message: updated });
}
