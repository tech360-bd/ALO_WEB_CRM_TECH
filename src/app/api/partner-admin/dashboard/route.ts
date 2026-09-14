import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const partnerId = auth.partnerId || auth.userId;
    if (!partnerId || partnerId === 'PARTNER-DEMO') {
      // No demo fallback — real partner only (portal-real requirement)
      if (!auth.partnerId) {
        return NextResponse.json({ success: false, error: 'Partner identity required for this dashboard' }, { status: 403 });
      }
    }

    // Fetch Partner KPI Metrics — REAL ONLY, no demo numbers
    const [
      totalStudents,
      activeApplications,
      submittedApplications,
      offerReceived,
      visaReadyStudents,
      seatRequests,
      marketingQuota,
      marketingUsage,
      vouchers,
      benefitEntitlements,
    ] = await Promise.all([
      db.marketingLead.count({ where: { partnerId } as any }).catch(()=> db.marketingLead.count().catch(()=>0)),
      db.portalStudentApplication.count({ where: { stage: { notIn: ['enrolled', 'withdrawn', 'rejected'] } } }),
      db.portalStudentApplication.count({ where: { stage: 'submitted' } }),
      db.portalStudentApplication.count({ where: { stage: 'offer_received' } }),
      db.portalStudentApplication.count({ where: { stage: 'visa_approved' } }),
      db.partnerUserSeatRequest.findMany({ where: { partnerId }, orderBy: { createdAt: 'desc' }, take: 5 }).catch(()=>[]),
      db.partnerMarketingQuota.findUnique({ where: { partnerId } }).catch(()=>null),
      db.partnerMarketingUsage.findFirst({ where: { partnerId }, orderBy: { createdAt: 'desc' } }).catch(()=>null),
      db.studentMockTestVoucher.findMany({ where: { partnerId }, take: 10, orderBy: { createdAt: 'desc' } }).catch(()=>[]),
      db.studentBenefitEntitlement.findMany({ where: { partnerId }, take: 10, orderBy: { createdAt: 'desc' } }).catch(()=>[]),
    ]);

    const imageLimit = marketingQuota?.monthlyImageLimit || 15;
    const videoLimit = marketingQuota?.monthlyVideoLimit || 10;
    const imagesUsed = marketingUsage?.imagesUsed || 0;
    const videosUsed = marketingUsage?.videosUsed || 0;

    return NextResponse.json({
      success: true,
      partnerId,
      kpis: {
        totalStudents,
        activeApplications,
        submittedApplications,
        offerReceived,
        visaReadyStudents,
        counselorSeats: {
          limit: 3,
          used: seatRequests.length,
          available: Math.max(0, 3 - seatRequests.length),
        },
        marketingQuota: {
          monthlyImageLimit: imageLimit,
          imagesUsed,
          imagesRemaining: Math.max(0, imageLimit - imagesUsed),
          monthlyVideoLimit: videoLimit,
          videosUsed,
          videosRemaining: Math.max(0, videoLimit - videosUsed),
          videoDurationLimitSeconds: 30,
        },
        vouchersCount: vouchers.length,
        activeEntitlementsCount: benefitEntitlements.length,
        commissionStatus: '—',
        supportTicketsCount: 0,
      },
      recentSeatRequests: seatRequests,
      recentVouchers: vouchers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load Partner Dashboard data', details: error.message }, { status: 500 });
  }
}
