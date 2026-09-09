// ============================================================
// GET  /api/partner/marketing        — Dashboard (quota, recent, published)
// POST /api/partner/marketing        — Submit new marketing idea
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction, type AuthContext } from '@/lib/auth-middleware';
import { checkQuotaBeforeAction } from '@/lib/access-check-engine';

// ---------- helpers ----------
function isPartnerRole(auth: AuthContext): boolean {
  return (
    auth.roles.includes('PARTNER_SUPER_ADMIN') ||
    auth.roles.includes('PARTNER_EMPLOYEE')
  );
}

async function getPartnerId(userId: string): Promise<string | null> {
  const profile = await db.partnerProfile.findUnique({
    where: { userId },
    select: { partnerId: true },
  });
  return profile?.partnerId ?? null;
}

// ============================================================
// GET — Marketing Studio Dashboard
// ============================================================
export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  if (!isPartnerRole(auth)) {
    return NextResponse.json(
      { success: false, message: 'Access denied. Partner role required.', status: 403 },
      { status: 403 },
    );
  }

  const partnerId = await getPartnerId(auth.userId);
  if (!partnerId) {
    return NextResponse.json(
      { success: false, message: 'Partner profile not found.', status: 404 },
      { status: 404 },
    );
  }

  try {
    const imageQuota = await checkQuotaBeforeAction('partner', partnerId, 'marketing_images');
    const videoQuota = await checkQuotaBeforeAction('partner', partnerId, 'marketing_videos');

    const recentRequests = await db.partnerMarketingRequest.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const publishedPosts = await db.partnerMarketingRequest.findMany({
      where: { partnerId, status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Marketing dashboard loaded.',
      data: {
        quota: {
          imagesUsed: imageQuota.used,
          imagesLimit: imageQuota.limit,
          videosUsed: videoQuota.used,
          videosLimit: videoQuota.limit,
        },
        recentRequests,
        publishedPosts,
      },
    });
  } catch (error) {
    console.error('Partner marketing GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load dashboard.', status: 500 },
      { status: 500 },
    );
  }
}

// ============================================================
// POST — Submit New Marketing Idea
// ============================================================
export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  if (!isPartnerRole(auth)) {
    return NextResponse.json(
      { success: false, message: 'Access denied. Partner role required.', status: 403 },
      { status: 403 },
    );
  }

  const partnerId = await getPartnerId(auth.userId);
  if (!partnerId) {
    return NextResponse.json(
      { success: false, message: 'Partner profile not found.', status: 404 },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const { idea, countryId, universityId, courseId, intake, platform, language, targetAudience, cta, preferredStyle } = body;

    if (!idea || !idea.trim()) {
      return NextResponse.json(
        { success: false, message: 'Idea is required.', status: 400 },
        { status: 400 },
      );
    }

    const imageQuota = await checkQuotaBeforeAction('partner', partnerId, 'marketing_images');
    const videoQuota = await checkQuotaBeforeAction('partner', partnerId, 'marketing_videos');

    if (!imageQuota.allowed && !videoQuota.allowed) {
      return NextResponse.json(
        { success: false, message: 'All marketing quotas exhausted. Request extra quota from ALO Education.', status: 403 },
        { status: 403 },
      );
    }

    const marketingRequest = await db.partnerMarketingRequest.create({
      data: {
        partnerId,
        requestedBy: auth.userId,
        idea: idea.trim(),
        countryId: countryId || '',
        universityId: universityId || '',
        courseId: courseId || '',
        intake: intake || '',
        platform: platform || 'facebook',
        language: language || 'english',
        targetAudience: targetAudience || '',
        ctaText: cta || '',
        preferredStyle: preferredStyle || 'professional',
        status: 'idea_submitted',
        approvalStatus: 'pending',
      },
    });

    await logAuditAction(auth, 'partner_marketing_idea_submitted', 'PartnerMarketingRequest', marketingRequest.id, {
      partnerId,
      idea: idea.trim(),
      platform,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Marketing idea submitted successfully.',
      data: marketingRequest,
    });
  } catch (error) {
    console.error('Partner marketing POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit idea.', status: 500 },
      { status: 500 },
    );
  }
}
