import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// ============================================================
// GET — Partner commission summary and payment history
// ============================================================
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findFirst({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Fetch all leads for this partner to calculate commission
    const leadsWhere: Record<string, unknown> = { partnerId: partner.partnerId };
    if (status) {
      leadsWhere.commissionStatus = status;
    }

    const [leads, partnerProfile] = await Promise.all([
      db.partnerLead.findMany({
        where: leadsWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.partnerProfile.findFirst({
        where: { partnerId: partner.partnerId },
        select: {
          commissionPending: true,
          commissionPaid: true,
          totalLeads: true,
          activeStudents: true,
        },
      }),
    ]);

    // Calculate summary from leads
    const totalCommissionExpected = leads.reduce((sum, lead) => sum + (lead.commissionExpected || 0), 0);
    const totalCommissionReceived = leads.reduce((sum, lead) => sum + (lead.commissionReceived || 0), 0);
    const totalCommissionPending = totalCommissionExpected - totalCommissionReceived;

    // Group by commission status for breakdown
    const statusBreakdown: Record<string, { count: number; expected: number; received: number }> = {};
    for (const lead of leads) {
      const key = lead.commissionStatus || 'none';
      if (!statusBreakdown[key]) {
        statusBreakdown[key] = { count: 0, expected: 0, received: 0 };
      }
      statusBreakdown[key].count += 1;
      statusBreakdown[key].expected += lead.commissionExpected || 0;
      statusBreakdown[key].received += lead.commissionReceived || 0;
    }

    // Payment history: leads that have received commission
    const paymentHistory = leads
      .filter((lead) => (lead.commissionReceived || 0) > 0)
      .map((lead) => ({
        leadId: lead.id,
        studentId: lead.studentId,
        partnerRef: lead.partnerRef,
        commissionExpected: lead.commissionExpected,
        commissionReceived: lead.commissionReceived,
        commissionStatus: lead.commissionStatus,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      }));

    const summary = {
      totalCommissionExpected: partnerProfile?.commissionPending || 0,
      totalCommissionPaid: partnerProfile?.commissionPaid || 0,
      totalCommissionPending: Math.max(0, (partnerProfile?.commissionPending || 0) - (partnerProfile?.commissionPaid || 0)),
      totalLeads: partnerProfile?.totalLeads || 0,
      activeStudents: partnerProfile?.activeStudents || 0,
      leadLevelExpected: totalCommissionExpected,
      leadLevelReceived: totalCommissionReceived,
      leadLevelPending: totalCommissionPending,
      statusBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        paymentHistory,
        leads,
      },
    });
  } catch (error) {
    console.error('[PARTNER COMMISSION GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch commission data' }, { status: 500 });
  }
}

// ============================================================
// POST — Record a commission payment for a lead
// ============================================================
export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findFirst({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { leadId, amount, commissionStatus, notes } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'A valid positive amount is required' }, { status: 400 });
    }

    // Verify lead belongs to this partner
    const lead = await db.partnerLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    if (lead.partnerId !== partner.partnerId) {
      return NextResponse.json({ success: false, error: 'Lead does not belong to your partner account' }, { status: 403 });
    }

    // Update lead commission info
    const newCommissionReceived = (lead.commissionReceived || 0) + amount;
    const updateData: Record<string, unknown> = {
      commissionReceived: newCommissionReceived,
      commissionStatus: commissionStatus || 'partial',
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedLead = await db.partnerLead.update({
      where: { id: leadId },
      data: updateData,
    });

    // Update partner profile commission totals
    const allPartnerLeads = await db.partnerLead.findMany({
      where: { partnerId: partner.partnerId },
      select: { commissionExpected: true, commissionReceived: true },
    });

    const totalExpected = allPartnerLeads.reduce((sum, l) => sum + (l.commissionExpected || 0), 0);
    const totalReceived = allPartnerLeads.reduce((sum, l) => sum + (l.commissionReceived || 0), 0);

    await db.partnerProfile.updateMany({
      where: { partnerId: partner.partnerId },
      data: {
        commissionPending: totalExpected,
        commissionPaid: totalReceived,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        lead: updatedLead,
        paymentRecorded: { leadId, amount, commissionStatus: updateData.commissionStatus, timestamp: new Date() },
      },
    });
  } catch (error) {
    console.error('[PARTNER COMMISSION POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record commission payment' }, { status: 500 });
  }
}
