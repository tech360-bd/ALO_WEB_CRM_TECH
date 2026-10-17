import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  requireMarketingAccess,
  requireMarketingManager,
} from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Marketing posts with approval workflow.
 * - AI / approved marketing users (3) can create drafts.
 * - Marketing Manager reviews and approves.
 * - Super Admin can approve/manage all.
 * - Nothing publishes without approval.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (category) where.contentType = category;

    const skip = (page - 1) * limit;
    const [posts, total, pendingApprovals] = await Promise.all([
      db.marketingContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { campaign: { select: { id: true, name: true } } },
      }),
      db.marketingContent.count({ where }),
      db.marketingContent.count({ where: { status: 'under_review' } }),
    ]);
    const approvals = await db.postApproval.findMany({
      where: { decision: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      posts,
      pendingApprovals,
      approvals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Marketing posts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action: approve, reject, publish, create_draft
    if (action === 'approve' || action === 'reject') {
      // Manager-only
      const authOrResponse = await requireMarketingManager(request);
      if (authOrResponse instanceof NextResponse) return authOrResponse;
      const auth = authOrResponse;

      const { contentId, reviewedBy, reviewNote, scheduledChannels } = body;
      if (!contentId) {
        return NextResponse.json(
          { error: 'contentId is required' },
          { status: 400 }
        );
      }

      const existing = await db.marketingContent.findUnique({
        where: { id: contentId },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }

      const reviewerId = reviewedBy || auth.user.id;

      if (action === 'approve') {
        const content = await db.marketingContent.update({
          where: { id: contentId },
          data: {
            status: 'approved',
            approvedBy: reviewerId,
            approvedAt: new Date(),
          },
        });

        // FIX: requestedBy must be the ORIGINAL requester (content's submittedBy),
        // not content.approvedBy (which we just set to reviewerId — that was the field-swap bug).
        // Look up the existing pending PostApproval to get the original requestedBy.
        const pendingApproval = await db.postApproval.findFirst({
          where: { contentId, decision: 'pending' },
          orderBy: { createdAt: 'desc' },
        });

        await db.postApproval.create({
          data: {
            contentId,
            requestedBy: pendingApproval?.requestedBy || null,
            reviewedBy: reviewerId,
            decision: 'approved',
            reviewNote: reviewNote || null,
            scheduledChannels: scheduledChannels
              ? JSON.stringify(scheduledChannels)
              : null,
            reviewedAt: new Date(),
          },
        });

        // Mark all pending approvals for this content as approved
        if (pendingApproval) {
          await db.postApproval.updateMany({
            where: { contentId, decision: 'pending' },
            data: {
              reviewedBy: reviewerId,
              decision: 'approved',
              reviewNote: reviewNote || null,
              scheduledChannels: scheduledChannels
                ? JSON.stringify(scheduledChannels)
                : null,
              reviewedAt: new Date(),
            },
          });
        }

        await logAudit({
          userId: auth.user.id,
          action: 'social_post.approved',
          module: 'marketing',
          recordId: contentId,
          oldData: existing,
          newData: content,
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.json({ content, approved: true });
      }

      // action === 'reject'
      const content = await db.marketingContent.update({
        where: { id: contentId },
        data: { status: 'rejected' },
      });

      const pendingApproval = await db.postApproval.findFirst({
        where: { contentId, decision: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      await db.postApproval.create({
        data: {
          contentId,
          requestedBy: pendingApproval?.requestedBy || null,
          reviewedBy: reviewerId,
          decision: 'rejected',
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
        },
      });

      if (pendingApproval) {
        await db.postApproval.updateMany({
          where: { contentId, decision: 'pending' },
          data: {
            reviewedBy: reviewerId,
            decision: 'rejected',
            reviewNote: reviewNote || null,
            reviewedAt: new Date(),
          },
        });
      }

      await logAudit({
        userId: auth.user.id,
        action: 'social_post.rejected',
        module: 'marketing',
        recordId: contentId,
        oldData: existing,
        newData: { ...content, reason: reviewNote || null },
        reason: reviewNote || undefined,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ content, rejected: true });
    }

    if (action === 'publish') {
      // Publishing requires manager approval — enforce manager
      const authOrResponse = await requireMarketingManager(request);
      if (authOrResponse instanceof NextResponse) return authOrResponse;
      const auth = authOrResponse;

      const { contentId, postUrl } = body;
      if (!contentId) {
        return NextResponse.json(
          { error: 'contentId is required' },
          { status: 400 }
        );
      }

      const existing = await db.marketingContent.findUnique({
        where: { id: contentId },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }

      // Only allow publishing approved content
      if (existing.status !== 'approved') {
        return NextResponse.json(
          { error: 'Content must be approved before publishing' },
          { status: 400 }
        );
      }

      const content = await db.marketingContent.update({
        where: { id: contentId },
        data: {
          status: 'published',
          publishedAt: new Date(),
          postUrl: postUrl || null,
        },
      });

      await logAudit({
        userId: auth.user.id,
        action: 'social_post.published',
        module: 'marketing',
        recordId: contentId,
        oldData: existing,
        newData: content,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json({ content, published: true });
    }

    // Default: create_draft — marketing_executive, marketing_manager, super_admin
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const {
      contentType,
      platform,
      title,
      caption,
      hashtags,
      bodyContent,
      imagePrompt,
      videoScript,
      ctaText,
      ctaLink,
      sizeTemplate,
      campaignId,
      requestedBy,
    } = body;

    if (!contentType) {
      return NextResponse.json(
        { error: 'contentType is required' },
        { status: 400 }
      );
    }

    const content = await db.marketingContent.create({
      data: {
        contentType,
        platform: platform || null,
        title: title || null,
        caption: caption || null,
        hashtags: hashtags || null,
        bodyContent: bodyContent || null,
        imagePrompt: imagePrompt || null,
        videoScript: videoScript || null,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        sizeTemplate: sizeTemplate || null,
        campaignId: campaignId || null,
        status: 'draft',
      },
    });

    const requesterId = requestedBy || auth.user.id;

    await db.postApproval.create({
      data: {
        contentId: content.id,
        requestedBy: requesterId,
        decision: 'pending',
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'social_post.draft_submitted',
      module: 'marketing',
      recordId: content.id,
      newData: { ...content, requestedBy: requesterId },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    console.error('Marketing posts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
