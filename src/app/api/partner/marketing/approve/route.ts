// ============================================================
// POST /api/partner/marketing/approve - Partner Super Admin approves content
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction, type AuthContext } from '@/lib/auth-middleware';

async function getPartnerId(userId: string): Promise<string | null> {
  const profile = await db.partnerProfile.findUnique({
    where: { userId },
    select: { partnerId: true },
  });
  return profile?.partnerId ?? null;
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  if (!auth.roles.includes('PARTNER_SUPER_ADMIN')) {
    return NextResponse.json(
      { success: false, message: 'Access denied. Only Partner Super Admin can approve content.', status: 403 },
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
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: 'requestId is required.', status: 400 },
        { status: 400 },
      );
    }

    const existingRequest = await db.partnerMarketingRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest || existingRequest.partnerId !== partnerId) {
      return NextResponse.json(
        { success: false, message: 'Marketing request not found or access denied.', status: 404 },
        { status: 404 },
      );
    }

    if (existingRequest.approvalStatus === 'partner_approved') {
      return NextResponse.json(
        { success: false, message: 'Content already approved by partner.', status: 400 },
        { status: 400 },
      );
    }

    if (existingRequest.status !== 'draft') {
      return NextResponse.json(
        { success: false, message: 'Only draft content can be approved.', status: 400 },
        { status: 400 },
      );
    }

    let newStatus: string;
    if (existingRequest.requiresAloApproval) {
      newStatus = 'pending_alo_review';
    } else if (existingRequest.autoPublishAllowed) {
      newStatus = 'scheduled';
    } else {
      newStatus = 'partner_approved';
    }

    const updated = await db.partnerMarketingRequest.update({
      where: { id: requestId },
      data: {
        approvalStatus: 'partner_approved',
        status: newStatus,
        approvedById: auth.userId,
        approvedAt: new Date(),
      },
    });

    await logAuditAction(auth, 'partner_marketing_approved', 'PartnerMarketingRequest', requestId, {
      partnerId,
      previousStatus: existingRequest.status,
      newStatus,
      requiresAloApproval: existingRequest.requiresAloApproval,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: newStatus === 'pending_alo_review'
        ? 'Content approved. Sent to ALO Education for review.'
        : newStatus === 'scheduled'
        ? 'Content approved and scheduled for publishing.'
        : 'Content approved by partner.',
      data: updated,
    });
  } catch (error) {
    console.error('Partner marketing approve error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to approve content.', status: 500 },
      { status: 500 },
    );
  }
}
