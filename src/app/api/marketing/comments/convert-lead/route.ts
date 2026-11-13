import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

// ─── POST: Convert a comment to a lead ────────────────────────────────────────

export const POST = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  try {
    const body = await request.json();
    const { commentId } = body;
    const userId = auth.userId;

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    const comment = await db.marketingComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.convertedToLead) {
      return NextResponse.json(
        { error: 'Comment already converted to lead' },
        { status: 400 }
      );
    }

    // Create/link atomically so a retry cannot make a second lead. Inbound interest is not marketing consent.
    const { lead, updatedComment } = await db.$transaction(async (tx) => {
      const current = await tx.marketingComment.findUnique({ where: { id: commentId } });
      if (!current || current.convertedToLead) throw new Error('COMMENT_ALREADY_CONVERTED');
      const createdLead = await tx.marketingLead.create({
        data: {
          name: current.authorName,
          source: 'comment',
          sourceDetail: `Comment on ${current.postId} via ${current.platform}`,
          destination: '', status: 'new', consent: false,
          hotLead: current.intent === 'interested' || current.intent === 'urgent',
          createdById: userId,
        },
      });
      const changed = await tx.marketingComment.updateMany({
        where: { id: commentId, convertedToLead: '' },
        data: { leadId: createdLead.id, convertedToLead: createdLead.id, status: 'converted' },
      });
      if (!changed.count) throw new Error('COMMENT_ALREADY_CONVERTED');
      return { lead: createdLead, updatedComment: await tx.marketingComment.findUnique({ where: { id: commentId } }) };
    });

    await createAuditLog({
      userId,
      role: auth.roles[0] || 'marketing',
      action: 'comment.convert_to_lead',
      resource: 'MarketingComment',
      resourceId: commentId,
      details: {
        leadId: lead.id,
        authorName: comment.authorName,
        platform: comment.platform,
      },
    });

    return NextResponse.json({ lead, comment: updatedComment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'COMMENT_ALREADY_CONVERTED') return NextResponse.json({ success: false, error: 'Comment was already converted by another request.' }, { status: 409 });
    console.error('Comment convert-lead error:', error instanceof Error ? error.name : 'UnknownError');
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'manager');
