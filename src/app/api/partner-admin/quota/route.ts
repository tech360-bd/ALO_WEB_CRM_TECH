import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerContext, assertSameTenant } from '@/lib/partner-tenant-guard';
import {
  getQuota,
  currentPeriod,
  STARTER_VIDEO_DURATION_SECONDS,
} from '@/lib/access-check-engine';

/**
 * Marketing quota + usage for the caller's own partner tenant.
 *
 * This endpoint previously had no authentication and read the tenant from a
 * `?partnerId=` query parameter, so any anonymous caller could read any
 * partner's quota — and, when the parameter was omitted, it silently fell back
 * to `findFirst({ role: "PARTNER" })` and returned an unrelated partner's
 * figures. The tenant is now taken from the authenticated session only.
 */
export async function GET(req: NextRequest) {
  const ctx = await requirePartnerContext(req);
  if (ctx instanceof NextResponse) return ctx;

  // A supplied partnerId may only ever confirm the session's own tenant.
  const mismatch = assertSameTenant(ctx, req.nextUrl.searchParams.get('partnerId'));
  if (mismatch) return mismatch;

  try {
    const monthYear = currentPeriod();
    const [quota, usage] = await Promise.all([
      db.partnerMarketingQuota.findUnique({ where: { partnerId: ctx.partnerId } }),
      db.partnerMarketingUsage.findUnique({
        where: { partnerId_monthYear: { partnerId: ctx.partnerId, monthYear } },
      }).catch(() => null),
    ]);

    const imageLimit = await getQuota('PARTNER', ctx.partnerId, 'monthly_images');
    const videoLimit = await getQuota('PARTNER', ctx.partnerId, 'monthly_videos');
    const imagesUsed = usage?.imagesUsed || 0;
    const videosUsed = usage?.videosUsed || 0;

    const pct = (used: number, limit: number) =>
      limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

    return NextResponse.json({
      success: true,
      partnerId: ctx.partnerId,
      period: monthYear,
      imageQuota: {
        limit: imageLimit,
        used: imagesUsed,
        remaining: Math.max(0, imageLimit - imagesUsed),
        percentage: pct(imagesUsed, imageLimit),
      },
      videoQuota: {
        limit: videoLimit,
        used: videosUsed,
        remaining: Math.max(0, videoLimit - videosUsed),
        percentage: pct(videosUsed, videoLimit),
      },
      videoDurationLimit: quota?.videoDurationLimitSeconds || STARTER_VIDEO_DURATION_SECONDS,
      autoPublishAllowed: quota?.autoPublishAllowed ?? false,
      requiresAloApproval: quota?.requiresAloApproval ?? true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to load marketing quota.' },
      { status: 500 },
    );
  }
}
