import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerContext } from '@/lib/partner-tenant-guard';
import {
  getQuota,
  currentPeriod,
  STARTER_VIDEO_DURATION_SECONDS,
} from '@/lib/access-check-engine';

/**
 * Partner Super Admin dashboard metrics — real data, tenant-scoped.
 *
 * Defects fixed here:
 *   1. CROSS-TENANT LEAK. `activeApplications`, `submittedApplications`,
 *      `offerReceived` and `visaReadyStudents` were counted with no partner
 *      filter at all, so every partner's dashboard displayed ALO Education's
 *      platform-wide application totals as if they were its own. The lead
 *      count had a `.catch()` fallback that counted every lead in the system.
 *   2. The tenant key fell back to `auth.userId` when no partner profile was
 *      present, which is not a tenant identifier.
 *   3. `counselorSeats.used` counted rows in PartnerUserSeatRequest — i.e. the
 *      number of times extra seats had been REQUESTED — rather than the number
 *      of users actually occupying a seat, and the limit was hardcoded to 3
 *      regardless of the partner's package or approved seat grants.
 *   4. Marketing usage was read with `findFirst` ordered by createdAt, so an
 *      earlier month's row could be shown as the current month's consumption.
 *   5. `videoDurationLimitSeconds` was hardcoded to 30 instead of read from
 *      the partner's quota record.
 *
 * Every figure below is derived from real rows for this tenant. Nothing is
 * defaulted to a demo value; absent data yields 0 so the UI can show a proper
 * empty state.
 */
export async function GET(req: NextRequest) {
  const ctx = await requirePartnerContext(req);
  if (ctx instanceof NextResponse) return ctx;
  const partnerId = ctx.partnerId;

  try {
    const monthYear = currentPeriod();

    // Applications belonging to students of THIS partner only.
    const tenantApplication = { studentProfile: { partnerId } };

    const [
      totalStudents,
      activeApplications,
      submittedApplications,
      offerReceived,
      visaReadyStudents,
      seatsUsed,
      supportThreadsCount,
      pendingSeatRequests,
      seatRequests,
      marketingQuota,
      marketingUsage,
      pendingMarketingApprovals,
      vouchersTotal,
      vouchersAvailable,
      vouchersUsed,
      activeEntitlements,
      recentVouchers,
    ] = await Promise.all([
      db.portalStudentProfile.count({ where: { partnerId } }),
      db.portalStudentApplication.count({
        where: { ...tenantApplication, stage: { notIn: ['enrolled', 'withdrawn', 'rejected', 'cancelled'] } },
      }),
      db.portalStudentApplication.count({ where: { ...tenantApplication, stage: 'submitted' } }),
      db.portalStudentApplication.count({ where: { ...tenantApplication, stage: 'offer_received' } }),
      db.portalStudentApplication.count({ where: { ...tenantApplication, stage: 'visa_approved' } }),
      db.portalUser.count({ where: { status: { in: ['active', 'pending_activation'] }, partnerProfile: { partnerId } } }),
      db.communicationThread.count({ where: { partnerId } }),
      db.partnerUserSeatRequest.count({ where: { partnerId, status: { in: ['pending', 'PENDING'] } } }),
      db.partnerUserSeatRequest.findMany({ where: { partnerId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      db.partnerMarketingQuota.findUnique({ where: { partnerId } }),
      db.partnerMarketingUsage.findUnique({
        where: { partnerId_monthYear: { partnerId, monthYear } },
      }).catch(() => null),
      db.partnerMarketingRequest.count({ where: { partnerId, approvalStatus: 'pending' } }),
      db.studentMockTestVoucher.count({ where: { partnerId } }),
      db.studentMockTestVoucher.count({ where: { partnerId, status: 'available' } }),
      db.studentMockTestVoucher.count({ where: { partnerId, status: 'used' } }),
      db.studentBenefitEntitlement.count({ where: { partnerId, status: 'active' } }),
      db.studentMockTestVoucher.findMany({ where: { partnerId }, take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    // Limits come from the partner's package / approved seat grant, never from
    // a hardcoded constant.
    const [seatLimit, imageLimit, videoLimit] = await Promise.all([
      getQuota('PARTNER', partnerId, 'user_seats'),
      getQuota('PARTNER', partnerId, 'monthly_images'),
      getQuota('PARTNER', partnerId, 'monthly_videos'),
    ]);

    const imagesUsed = marketingUsage?.imagesUsed || 0;
    const videosUsed = marketingUsage?.videosUsed || 0;

    return NextResponse.json({
      success: true,
      partnerId,
      period: monthYear,
      kpis: {
        totalStudents,
        activeApplications,
        submittedApplications,
        offerReceived,
        visaReadyStudents,
        userSeats: {
          limit: seatLimit,
          used: seatsUsed,
          available: Math.max(0, seatLimit - seatsUsed),
          pendingSeatRequests,
        },
        marketingQuota: {
          monthlyImageLimit: imageLimit,
          imagesUsed,
          imagesRemaining: Math.max(0, imageLimit - imagesUsed),
          monthlyVideoLimit: videoLimit,
          videosUsed,
          videosRemaining: Math.max(0, videoLimit - videosUsed),
          videoDurationLimitSeconds:
            marketingQuota?.videoDurationLimitSeconds || STARTER_VIDEO_DURATION_SECONDS,
        },
        pendingMarketingApprovals,
        vouchers: {
          total: vouchersTotal,
          available: vouchersAvailable,
          used: vouchersUsed,
        },
        activeEntitlementsCount: activeEntitlements,
        supportThreadsCount,
      },
      recentSeatRequests: seatRequests,
      recentVouchers,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load partner dashboard data.' },
      { status: 500 },
    );
  }
}
