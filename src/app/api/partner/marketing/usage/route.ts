// ============================================================
// GET /api/partner/marketing/usage - Current month's marketing usage
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { checkQuotaBeforeAction } from '@/lib/access-check-engine';

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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [ideasSubmitted, postsScheduled, postsPublished] = await Promise.all([
      db.partnerMarketingRequest.count({
        where: {
          partnerId,
          createdAt: { gte: monthStart },
        },
      }),
      db.partnerMarketingRequest.count({
        where: {
          partnerId,
          status: 'scheduled',
          createdAt: { gte: monthStart },
        },
      }),
      db.partnerMarketingRequest.count({
        where: {
          partnerId,
          status: 'published',
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Usage stats loaded.',
      data: {
        imagesUsed: imageQuota.currentUsage,
        imagesLimit: imageQuota.limit,
        imagesRemaining: Math.max(0, imageQuota.limit - imageQuota.currentUsage),
        videosUsed: videoQuota.currentUsage,
        videosLimit: videoQuota.limit,
        videosRemaining: Math.max(0, videoQuota.limit - videoQuota.currentUsage),
        ideasSubmitted,
        postsScheduled,
        postsPublished,
        monthYear: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      },
    });
  } catch (error) {
    console.error('Partner marketing usage error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load usage stats.', status: 500 },
      { status: 500 },
    );
  }
}
