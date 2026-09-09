// ============================================================
// GET  /api/partner/marketing/requests - List marketing requests (filtered)
// PUT  /api/partner/marketing/requests - Update a marketing request
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction, type AuthContext } from '@/lib/auth-middleware';

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
// GET — List marketing requests with optional filters
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = { partnerId };
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (dateFrom || dateTo) {
      const createdAt: Record<string, unknown> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    const [requests, total] = await Promise.all([
      db.partnerMarketingRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.partnerMarketingRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Requests loaded.',
      data: {
        requests,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Partner marketing requests GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load requests.', status: 500 },
      { status: 500 },
    );
  }
}

// ============================================================
// PUT — Update a marketing request
// ============================================================
export async function PUT(request: Request) {
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
    const { id, idea, platform, language, targetAudience, ctaText, preferredStyle, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Request id is required.', status: 400 },
        { status: 400 },
      );
    }

    const existing = await db.partnerMarketingRequest.findUnique({
      where: { id },
    });

    if (!existing || existing.partnerId !== partnerId) {
      return NextResponse.json(
        { success: false, message: 'Request not found or access denied.', status: 404 },
        { status: 404 },
      );
    }

    // Published requests cannot be edited
    if (existing.status === 'published') {
      return NextResponse.json(
        { success: false, message: 'Published requests cannot be edited.', status: 400 },
        { status: 400 },
      );
    }

    // Only draft and pending requests can be edited
    const editableStatuses = ['idea_submitted', 'draft', 'ai_generating', 'pending_alo_review', 'partner_approved', 'scheduled', 'rejected'];
    if (!editableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot edit request in '${existing.status}' status.`, status: 400 },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (idea !== undefined) updateData.idea = idea;
    if (platform !== undefined) updateData.platform = platform;
    if (language !== undefined) updateData.language = language;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (ctaText !== undefined) updateData.ctaText = ctaText;
    if (preferredStyle !== undefined) updateData.preferredStyle = preferredStyle;
    if (status !== undefined && auth.roles.includes('PARTNER_SUPER_ADMIN')) {
      updateData.status = status;
    }

    const updated = await db.partnerMarketingRequest.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction(auth, 'partner_marketing_request_updated', 'PartnerMarketingRequest', id, {
      partnerId,
      changedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Request updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Partner marketing requests PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update request.', status: 500 },
      { status: 500 },
    );
  }
}
