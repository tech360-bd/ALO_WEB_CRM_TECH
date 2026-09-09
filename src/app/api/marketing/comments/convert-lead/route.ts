import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── POST: Convert a comment to a lead ────────────────────────────────────────

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
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

    // Create a MarketingLead from the comment data
    const lead = await db.marketingLead.create({
      data: {
        name: comment.authorName,
        source: 'comment',
        sourceDetail: `Comment on ${comment.postId} via ${comment.platform}`,
        destination: comment.intent && comment.intent.includes('country_asking') ? '' : '',
        status: 'new',
        hotLead: comment.intent === 'interested' || comment.intent === 'urgent',
        createdById: userId,
      },
    });

    // Update the comment to reference the new lead
    const updatedComment = await db.marketingComment.update({
      where: { id: commentId },
      data: {
        leadId: lead.id,
        convertedToLead: lead.id,
        status: 'converted',
      },
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
    console.error('Comment convert-lead error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);
