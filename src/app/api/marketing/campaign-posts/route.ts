import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { isMarketingManager, withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readText(value: unknown, max: number, required = false): string | undefined | null {
  if (value === undefined || value === null || value === '') return required ? null : undefined;
  if (typeof value !== 'string' || value.trim().length > max) return null;
  const result = value.trim();
  return required && !result ? null : result;
}

// GET — managers see all posts; approved limited users see only drafts they created.
export const GET = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const params = new URL(req.url).searchParams;
  const status = params.get('status');
  const platform = params.get('platform');
  const where: Record<string, unknown> = {};
  if (!isMarketingManager(auth)) where.createdBy = auth.userId;
  if (status) where.approvalStatus = status;
  if (platform) where.platform = platform;

  try {
    const posts = await db.campaignPost.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const logo = await db.brandAsset.findFirst({ where: { assetType: 'LOGO', isActive: true }, select: { value: true, name: true } });
    return NextResponse.json({
      posts,
      logoExists: !!logo,
      logo: logo ? { fileUrl: logo.value, name: logo.name } : null,
      summary: {
        total: posts.length,
        draft: posts.filter((post) => post.approvalStatus === 'DRAFT').length,
        pendingApproval: posts.filter((post) => post.approvalStatus === 'PENDING_APPROVAL').length,
        approved: posts.filter((post) => post.approvalStatus === 'APPROVED').length,
        published: posts.filter((post) => post.approvalStatus === 'PUBLISHED').length,
        rejected: posts.filter((post) => post.approvalStatus === 'REJECTED').length,
      },
    });
  } catch (error) {
    console.error('[marketing.campaign-posts] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load campaign posts.' }, { status: 500 });
  }
}, 'draft-post');

// POST — create content only as an unapproved draft; creator identity comes from authentication.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  const title = readText(body.title, 200, true);
  const category = readText(body.category, 100, true);
  const platform = readText(body.platform, 40, true);
  const caption = readText(body.caption, 10000);
  const ctaText = readText(body.ctaText, 300);
  const ctaUrl = readText(body.ctaUrl, 2000);
  const videoScript = readText(body.videoScript, 10000);
  const reelCaption = readText(body.reelCaption, 10000);
  const landingLink = readText(body.landingLink, 2000);
  const campaignObjective = readText(body.campaignObjective, 500);
  const platformSize = readText(body.platformSize, 100);
  if ([title, category, platform].includes(null)) {
    return NextResponse.json({ success: false, error: 'title, category and platform are required and must be valid text.' }, { status: 400 });
  }
  if (platform && !['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'LINKEDIN', 'TIKTOK', 'EMAIL', 'SMS'].includes(platform.toUpperCase())) {
    return NextResponse.json({ success: false, error: 'Unsupported marketing platform.' }, { status: 400 });
  }
  if ([caption, ctaText, ctaUrl, videoScript, reelCaption, landingLink, campaignObjective, platformSize].includes(null)) {
    return NextResponse.json({ success: false, error: 'One or more draft fields are invalid or too long.' }, { status: 400 });
  }
  if (ctaUrl && !/^https:\/\//i.test(ctaUrl)) {
    return NextResponse.json({ success: false, error: 'CTA links must use HTTPS.' }, { status: 400 });
  }
  if (landingLink && !/^https:\/\//i.test(landingLink)) {
    return NextResponse.json({ success: false, error: 'Landing links must use HTTPS.' }, { status: 400 });
  }
  const hashtags = body.hashtags === undefined ? [] : body.hashtags;
  if (!Array.isArray(hashtags) || hashtags.length > 30 || hashtags.some((tag) => typeof tag !== 'string' || tag.length > 80)) {
    return NextResponse.json({ success: false, error: 'hashtags must be a list of up to 30 short strings.' }, { status: 400 });
  }

  try {
    const logo = await db.brandAsset.findFirst({ where: { assetType: 'LOGO', isActive: true } });
    if (!logo) return NextResponse.json({ success: false, error: 'ALO logo is missing. Upload the approved brand asset before creating posts.' }, { status: 400 });
    const post = await db.campaignPost.create({
      data: {
        title: title!, category: category!, platform: platform!.toUpperCase(),
        caption: caption ?? null, hashtags: JSON.stringify(hashtags.map((tag: string) => tag.trim())),
        ctaText: ctaText ?? null, ctaUrl: ctaUrl ?? null,
        videoScript: videoScript ?? null, reelCaption: reelCaption ?? null,
        landingLink: landingLink ?? null, campaignObjective: campaignObjective ?? null,
        platformSize: platformSize ?? null, approvalStatus: 'DRAFT',
        createdBy: auth.userId, brandAssetApplied: true,
      },
    });
    await db.auditLog.create({
      data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'CampaignPost', resourceId: post.id, details: JSON.stringify({ action: 'draft_created', platform: post.platform, category: post.category }) },
    });
    return NextResponse.json({ success: true, post, message: 'Draft created. Submit it for Marketing Manager approval; no post has been published.' }, { status: 201 });
  } catch (error) {
    console.error('[marketing.campaign-posts] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create campaign draft.' }, { status: 500 });
  }
}, 'draft-post');

// PATCH — limited users can submit their own drafts; only a Marketing Manager/Super Admin can decide approval.
export const PATCH = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== 'string' || !body.id.trim() || typeof body.action !== 'string') {
    return NextResponse.json({ success: false, error: 'id and action are required.' }, { status: 400 });
  }
  const id = body.id.trim();
  const action = body.action;
  const manager = isMarketingManager(auth);
  try {
    const current = await db.campaignPost.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, error: 'Campaign post not found.' }, { status: 404 });
    if (!manager && current.createdBy !== auth.userId) return NextResponse.json({ success: false, error: 'You may only submit your own draft.' }, { status: 403 });

    if (action === 'submit_approval') {
      if (current.approvalStatus !== 'DRAFT') return NextResponse.json({ success: false, error: 'Only a draft can be submitted for approval.' }, { status: 409 });
      const changed = await db.campaignPost.updateMany({ where: { id, approvalStatus: 'DRAFT', createdBy: current.createdBy }, data: { approvalStatus: 'PENDING_APPROVAL' } });
      if (!changed.count) return NextResponse.json({ success: false, error: 'Draft changed before submission; reload and retry.' }, { status: 409 });
      const post = await db.campaignPost.findUnique({ where: { id } });
      await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'CampaignPost', resourceId: id, details: JSON.stringify({ action: 'submitted_for_approval' }) } });
      return NextResponse.json({ success: true, post, message: 'Submitted for manager approval. It is not published.' });
    }

    if (action === 'approve' || action === 'reject') {
      if (!manager) return NextResponse.json({ success: false, error: 'Marketing Manager or Super Admin approval is required.' }, { status: 403 });
      if (current.approvalStatus !== 'PENDING_APPROVAL') return NextResponse.json({ success: false, error: 'Only a pending post can be approved or rejected.' }, { status: 409 });
      const rejectionReason = readText(body.rejectionReason, 2000) ?? '';
      const data = action === 'approve'
        ? { approvalStatus: 'APPROVED', approvedBy: auth.userId, approvedAt: new Date(), rejectionReason: null }
        : { approvalStatus: 'REJECTED', approvedBy: auth.userId, approvedAt: null, rejectionReason };
      const changed = await db.campaignPost.updateMany({ where: { id, approvalStatus: 'PENDING_APPROVAL' }, data });
      if (!changed.count) return NextResponse.json({ success: false, error: 'Post status changed before review; reload and retry.' }, { status: 409 });
      const post = await db.campaignPost.findUnique({ where: { id } });
      await db.auditLog.create({ data: { userId: auth.userId, action: 'PUBLIC_PUBLISH', resource: 'CampaignPost', resourceId: id, details: JSON.stringify({ action: action === 'approve' ? 'approved' : 'rejected', reason: action === 'reject' ? rejectionReason : undefined }) } });
      return NextResponse.json({ success: true, post, message: action === 'approve' ? 'Approved by the authenticated manager. No social post has been published.' : 'Post rejected.' });
    }

    if (action === 'schedule' || action === 'publish') {
      if (!manager) return NextResponse.json({ success: false, error: 'Manager approval is required.' }, { status: 403 });
      return NextResponse.json({
        success: false,
        deliveryStatus: 'NOT_CONFIGURED',
        error: action === 'schedule'
          ? 'No verified publishing scheduler is configured. The post remains unchanged.'
          : 'No verified official provider delivery is configured. The post remains approved and was not published.',
      }, { status: 503 });
    }

    return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('[marketing.campaign-posts] action failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update campaign post.' }, { status: 500 });
  }
}, 'draft-post');
