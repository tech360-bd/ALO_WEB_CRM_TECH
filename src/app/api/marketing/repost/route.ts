import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Reposting creates a fresh draft only. It never publishes or impersonates an employee account.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const postId = typeof body?.postId === 'string' ? body.postId.trim() : '';
  const targetPlatform = typeof body?.targetPlatform === 'string' ? body.targetPlatform.trim().toUpperCase() : '';
  const captionOverride = typeof body?.captionOverride === 'string' ? body.captionOverride.trim() : undefined;
  if (!postId || postId.length > 191) return NextResponse.json({ success: false, error: 'An approved CampaignPost ID is required.' }, { status: 400 });
  if (captionOverride !== undefined && captionOverride.length > 10000) return NextResponse.json({ success: false, error: 'Caption is too long.' }, { status: 400 });
  if (targetPlatform && !['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'LINKEDIN', 'TIKTOK'].includes(targetPlatform)) {
    return NextResponse.json({ success: false, error: 'Unsupported target platform.' }, { status: 400 });
  }
  try {
    const source = await db.campaignPost.findUnique({ where: { id: postId } });
    if (!source) return NextResponse.json({ success: false, error: 'Post not found.' }, { status: 404 });
    if (!['APPROVED', 'PUBLISHED'].includes(source.approvalStatus)) {
      return NextResponse.json({ success: false, error: 'Only manager-approved content can be copied into a draft.' }, { status: 409 });
    }
    const platform = targetPlatform || source.platform;
    const draft = await db.campaignPost.create({
      data: {
        title: `${source.title.slice(0, 160)} — adapted draft`,
        category: source.category,
        platform,
        caption: captionOverride ?? source.caption,
        hashtags: source.hashtags,
        ctaText: source.ctaText,
        ctaUrl: source.ctaUrl,
        videoScript: source.videoScript,
        reelCaption: source.reelCaption,
        campaignObjective: source.campaignObjective,
        platformSize: source.platformSize,
        approvalStatus: 'DRAFT',
        createdBy: auth.userId,
        brandAssetApplied: source.brandAssetApplied,
        publishedAt: null,
        publishedUrl: null,
      },
    });
    await db.auditLog.create({
      data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'CampaignPostRepost', resourceId: draft.id, details: JSON.stringify({ sourceId: source.id, platform, state: 'DRAFT' }) },
    });
    return NextResponse.json({ success: true, state: 'DRAFT', published: false, reposted: draft, sourceId: source.id, message: 'Copied into a new draft. It must be approved and sent through a verified official provider integration; nothing was published.' }, { status: 201 });
  } catch (error) {
    console.error('[marketing.repost] draft creation failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create repost draft.' }, { status: 500 });
  }
}, 'draft-post');
