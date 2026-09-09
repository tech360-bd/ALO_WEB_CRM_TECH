import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM SOCIAL API — MarketingSocialMessage + MarketingComment
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const platform = searchParams.get('platform') || '';
      const status = searchParams.get('status') || '';
      const intent = searchParams.get('intent') || '';
      const isLead = searchParams.get('isLead');
      const tab = searchParams.get('tab') || 'messages';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      if (tab === 'comments') {
        const where: Record<string, unknown> = {};
        if (platform) where.platform = platform;
        if (status) where.status = status;
        if (intent) where.intent = intent;
        if (isLead !== null) where.isLead = isLead === 'true';

        const [data, total] = await Promise.all([
          db.marketingComment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.marketingComment.count({ where }),
        ]);

        return NextResponse.json({
          success: true, data, total, page,
          totalPages: Math.ceil(total / limit),
          meta: { tab: 'comments' },
        });
      }

      const where: Record<string, unknown> = {};
      if (platform) where.platform = platform;
      if (status) where.status = status;
      if (intent) where.intent = intent;
      if (searchParams.get('unreplied') === 'true') where.isResolved = false;

      const [data, total] = await Promise.all([
        db.marketingSocialMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.marketingSocialMessage.count({ where }),
      ]);

      return NextResponse.json({
        success: true, data, total, page,
        totalPages: Math.ceil(total / limit),
        meta: { tab: 'messages' },
      });
    } catch (error) {
      console.error('Social GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load social data' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { type, id, replyText, status } = body;

      if (!type || !id || !replyText) {
        return NextResponse.json({ success: false, error: 'type, id, and replyText are required' }, { status: 400 });
      }

      if (type === 'message') {
        const existing = await db.marketingSocialMessage.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
        }
        const updated = await db.marketingSocialMessage.update({
          where: { id },
          data: { replySent: replyText, repliedAt: new Date(), isResolved: true },
        });
        await logAuditAction(auth, 'reply_social_message', 'MarketingSocialMessage', id, { replyText });
        return NextResponse.json({ success: true, data: updated });
      }

      if (type === 'comment') {
        const existing = await db.marketingComment.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
        }
        const updated = await db.marketingComment.update({
          where: { id },
          data: { replyText, repliedAt: new Date(), status: status || 'replied' },
        });
        await logAuditAction(auth, 'reply_comment', 'MarketingComment', id, { replyText });
        return NextResponse.json({ success: true, data: updated });
      }

      return NextResponse.json({ success: false, error: 'Invalid type. Use message or comment.' }, { status: 400 });
    } catch (error) {
      console.error('Social POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to reply' }, { status: 500 });
    }
  })(request);
}
