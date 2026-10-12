import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requirePartnerContext } from '@/lib/partner-tenant-guard';
import { checkQuotaBeforeAction, currentPeriod } from '@/lib/access-check-engine';

/** GET /api/partner/marketing/usage — UTC calendar-month partner usage. */
export async function GET(request: Request) {
  const context = await requirePartnerContext(request);
  if (context instanceof NextResponse) return context;

  try {
    const monthYear = currentPeriod();
    const monthStart = new Date(`${monthYear}-01T00:00:00.000Z`);
    const [imageQuota, videoQuota, usage, ideasSubmitted, legacyScheduled, legacyPublished] = await Promise.all([
      checkQuotaBeforeAction('partner', context.partnerId, 'monthly_images'),
      checkQuotaBeforeAction('partner', context.partnerId, 'monthly_videos'),
      db.partnerMarketingUsage.findUnique({ where: { partnerId_monthYear: { partnerId: context.partnerId, monthYear } } }),
      db.partnerMarketingRequest.count({ where: { partnerId: context.partnerId, createdAt: { gte: monthStart } } }),
      db.partnerMarketingRequest.count({ where: { partnerId: context.partnerId, status: 'scheduled', createdAt: { gte: monthStart } } }),
      db.partnerMarketingRequest.count({ where: { partnerId: context.partnerId, status: 'published', createdAt: { gte: monthStart } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        imagesUsed: usage?.imagesUsed ?? imageQuota.currentUsage,
        imagesLimit: imageQuota.limit,
        imagesRemaining: Math.max(0, imageQuota.limit - (usage?.imagesUsed ?? imageQuota.currentUsage)),
        videosUsed: usage?.videosUsed ?? videoQuota.currentUsage,
        videosLimit: videoQuota.limit,
        videosRemaining: Math.max(0, videoQuota.limit - (usage?.videosUsed ?? videoQuota.currentUsage)),
        ideasSubmitted: usage?.ideasSubmitted ?? ideasSubmitted,
        // Retained rows may be legacy state only; no live publisher consumes them.
        legacyScheduledRecords: legacyScheduled,
        legacyPublishedRecords: legacyPublished,
        publishingEnabled: false,
        monthYear,
      },
    });
  } catch (error) {
    console.error('[PARTNER MARKETING USAGE] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load marketing usage.' }, { status: 500 });
  }
}
