import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  return withAuth(async () => {
    try {
      const [allPartners, activePartners, pendingPartners, totalLeads, totalApplications] = await Promise.all([
        db.partnerProfile.groupBy({ by: ['partnerId'] }),
        db.partnerProfile.groupBy({ by: ['partnerId'], where: { approvalStatus: { in: ['approved', 'active'] } } }),
        db.partnerProfile.groupBy({ by: ['partnerId'], where: { approvalStatus: 'pending' } }),
        db.partnerLead.count(),
        db.portalStudentApplication.count(),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          totalPartners: allPartners.length,
          activePartners: activePartners.length,
          pendingApprovals: pendingPartners.length,
          totalLeads,
          totalApplications,
        },
      });
    } catch (error) {
      console.error('[PARTNER ADMIN SUMMARY] GET error:', error);
      return NextResponse.json({ success: false, error: 'Partner administration summary could not be loaded.' }, { status: 500 });
    }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}
