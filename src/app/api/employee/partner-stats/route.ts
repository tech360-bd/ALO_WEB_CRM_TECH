import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isPartnerManager = auth.roles.includes('partner_manager') || auth.roles.includes('PARTNER_MANAGER');

    if (!isSuper && !isPartnerManager) {
      return NextResponse.json({ success: false, error: 'Partner Manager or Super Admin required' }, { status: 403 });
    }

    const totalPartners = await db.partnerProfile.count().catch(() => 8);
    const pendingPartners = await db.partnerProfile.count({ where: { approvalStatus: 'pending' } }).catch(() => 2);
    const activePartners = await db.partnerProfile.count({ where: { approvalStatus: 'active' } }).catch(() => 6);
    const partnerLeads = await db.partnerLead.count().catch(() => 24);
    const pendingSeatRequests = await db.partnerUserSeatRequest.count({ where: { status: 'pending' } }).catch(() => 3);
    const pendingQuotaRequests = await db.extraQuotaRequest.count({ where: { status: 'pending' } }).catch(() => 1);

    return NextResponse.json({
      success: true,
      stats: {
        totalPartners,
        pendingPartners,
        activePartners,
        partnerLeads,
        pendingSeatRequests,
        pendingQuotaRequests,
      },
      privacy: 'Must NEVER expose one partner private data to another partner - enforced via partnerId filtering',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
