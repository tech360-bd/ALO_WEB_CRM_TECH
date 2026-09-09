// ============================================================
// /api/admin/quota-requests
// GET  — All extra quota requests (super_admin)
// POST — Partner submits an extra quota request (partner_super_admin)
// PUT  — Admin approves / rejects a request (super_admin)
//        When approved, the corresponding PartnerQuota is updated.
// ============================================================

import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

// ------------------------------------------------------------
// Guards
// ------------------------------------------------------------
function superAdminOnly(auth: any): NextResponse | null {
  if (!auth.roles.includes('super_admin')) {
    return NextResponse.json(
      { success: false, status: 403, error: 'Super admin access required.' },
      { status: 403 }
    );
  }
  return null;
}

function partnerSuperAdminOnly(auth: any): NextResponse | null {
  if (!auth.roles.includes('partner_super_admin')) {
    return NextResponse.json(
      { success: false, status: 403, error: 'Partner super admin access required.' },
      { status: 403 }
    );
  }
  return null;
}

// ============================================================
// GET: All extra quota requests (super_admin)
// ============================================================
async function handleGet(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (partnerId) where.partnerId = partnerId;

    const requests = await db.extraQuotaRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with partner company name
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const partner = await db.partnerProfile.findUnique({
          where: { userId: req.partnerId },
          select: { companyName: true },
        });
        return { ...req, partnerName: partner?.companyName || 'Unknown' };
      })
    );

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Quota requests fetched successfully.',
      data: enriched,
    });
  } catch (error: any) {
    console.error('Admin quota-requests GET error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'ExtraQuotaRequest table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to fetch quota requests.' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: Partner submits an extra quota request (partner_super_admin)
// ============================================================
async function handlePost(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = partnerSuperAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const { requestType, currentLimit, requestedLimit, reason } = body;

    if (!requestType || !requestedLimit) {
      return NextResponse.json(
        { success: false, status: 400, error: 'requestType and requestedLimit are required.' },
        { status: 400 }
      );
    }

    const validTypes = ['user_seats', 'images', 'videos', 'video_length', 'leads'];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { success: false, status: 400, error: `requestType must be one of: ${validTypes.join(', ')}.` },
        { status: 400 }
      );
    }

    // Look up current quota to populate currentLimit if not provided
    const quota = await db.partnerQuota.findUnique({
      where: { partnerId: auth.userId },
    });

    const limitMap: Record<string, number | undefined> = {
      user_seats: quota?.maxUsers,
      images: quota?.maxImages,
      videos: quota?.maxVideos,
      video_length: quota?.videoMaxLength,
      leads: quota?.maxLeads,
    };

    const resolvedCurrentLimit = currentLimit ?? limitMap[requestType] ?? 0;

    const req = await db.extraQuotaRequest.create({
      data: {
        partnerId: auth.userId,
        requestType,
        currentLimit: resolvedCurrentLimit,
        requestedLimit,
        reason: reason || '',
        status: 'pending',
      },
    });

    await logAuditAction(auth, 'submit_quota_request', 'ExtraQuotaRequest', req.id, {
      requestType,
      requestedLimit,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Quota request submitted successfully.',
      data: req,
    });
  } catch (error: any) {
    console.error('Admin quota-requests POST error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'ExtraQuotaRequest table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to submit quota request.' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT: Admin approves / rejects a request (super_admin)
// On approval, update the corresponding PartnerQuota field.
// ============================================================
async function handlePut(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const { id, status: newStatus, reviewNote } = body;

    if (!id || !newStatus) {
      return NextResponse.json(
        { success: false, status: 400, error: 'id and status are required.' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(newStatus)) {
      return NextResponse.json(
        { success: false, status: 400, error: 'status must be "approved" or "rejected".' },
        { status: 400 }
      );
    }

    const existing = await db.extraQuotaRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, status: 404, error: 'Quota request not found.' },
        { status: 404 }
      );
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { success: false, status: 400, error: `Request is already ${existing.status}.` },
        { status: 400 }
      );
    }

    // If approved — update the partner quota
    if (newStatus === 'approved') {
      const fieldMap: Record<string, string> = {
        user_seats: 'maxUsers',
        images: 'maxImages',
        videos: 'maxVideos',
        video_length: 'videoMaxLength',
        leads: 'maxLeads',
      };

      const quotaField = fieldMap[existing.requestType];
      if (quotaField) {
        await db.partnerQuota.upsert({
          where: { partnerId: existing.partnerId },
          update: { [quotaField]: existing.requestedLimit },
          create: {
            partnerId: existing.partnerId,
            [quotaField]: existing.requestedLimit,
            resetAt: new Date(),
          },
        });
      }
    }

    const updated = await db.extraQuotaRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: auth.userId,
        reviewNote: reviewNote || '',
      },
    });

    await logAuditAction(auth, `quota_request_${newStatus}`, 'ExtraQuotaRequest', id, {
      partnerId: existing.partnerId,
      requestType: existing.requestType,
      requestedLimit: existing.requestedLimit,
      reviewNote: reviewNote || '',
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: `Quota request ${newStatus} successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Admin quota-requests PUT error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'ExtraQuotaRequest table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to review quota request.' },
      { status: 500 }
    );
  }
}

// ============================================================
// Route handlers
// ============================================================
export const GET = handleGet;
export const POST = handlePost;
export const PUT = handlePut;
