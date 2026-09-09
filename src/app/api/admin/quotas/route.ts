// ============================================================
// /api/admin/quotas
// GET  — List all PartnerQuota records with partner info (super_admin)
// POST — Create / update PartnerQuota for a partner (super_admin)
// ============================================================

import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

// ------------------------------------------------------------
// Guard: super_admin only
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

// ============================================================
// GET: All partner quotas with partner and package info
// ============================================================
async function handleGet(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || undefined;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;

    const quotas = await db.partnerQuota.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with partner profile info and package name
    const enriched = await Promise.all(
      quotas.map(async (q) => {
        const partner = await db.partnerProfile.findUnique({
          where: { userId: q.partnerId },
          select: { companyName: true, approvalStatus: true },
        });

        const pkg = q.packageId
          ? await db.partnerPackage.findUnique({
              where: { id: q.packageId },
              select: { name: true, slug: true },
            })
          : null;

        return {
          ...q,
          partnerName: partner?.companyName || 'Unknown',
          partnerStatus: partner?.approvalStatus || 'unknown',
          package: pkg
            ? { id: q.packageId, name: pkg.name, slug: pkg.slug }
            : null,
          usagePercent: {
            users: q.maxUsers > 0 ? Math.round((q.usedUsers / q.maxUsers) * 100) : 0,
            images: q.maxImages > 0 ? Math.round((q.usedImages / q.maxImages) * 100) : 0,
            videos: q.maxVideos > 0 ? Math.round((q.usedVideos / q.maxVideos) * 100) : 0,
            leads: q.maxLeads > 0 ? Math.round((q.usedLeads / q.maxLeads) * 100) : 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Quotas fetched successfully.',
      data: enriched,
    });
  } catch (error: any) {
    console.error('Admin quotas GET error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'PartnerQuota table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to fetch quotas.' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: Create / update PartnerQuota for a partner
// ============================================================
async function handlePost(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const {
      partnerId,
      packageId,
      maxUsers,
      maxImages,
      maxVideos,
      videoMaxLength,
      maxLeads,
      usedUsers,
      usedImages,
      usedVideos,
      usedLeads,
      resetAt,
    } = body;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, status: 400, error: 'partnerId is required.' },
        { status: 400 }
      );
    }

    // Validate partner exists
    const partner = await db.partnerProfile.findUnique({
      where: { userId: partnerId },
    });
    if (!partner) {
      return NextResponse.json(
        { success: false, status: 404, error: 'Partner profile not found.' },
        { status: 404 }
      );
    }

    // If packageId provided, validate it exists
    if (packageId) {
      const pkg = await db.partnerPackage.findUnique({ where: { id: packageId } });
      if (!pkg) {
        return NextResponse.json(
          { success: false, status: 404, error: 'Package not found.' },
          { status: 404 }
        );
      }
    }

    // Build quota data
    const quotaData: Record<string, unknown> = {};
    if (packageId !== undefined) quotaData.packageId = packageId;
    if (maxUsers !== undefined) quotaData.maxUsers = maxUsers;
    if (maxImages !== undefined) quotaData.maxImages = maxImages;
    if (maxVideos !== undefined) quotaData.maxVideos = maxVideos;
    if (videoMaxLength !== undefined) quotaData.videoMaxLength = videoMaxLength;
    if (maxLeads !== undefined) quotaData.maxLeads = maxLeads;
    if (usedUsers !== undefined) quotaData.usedUsers = usedUsers;
    if (usedImages !== undefined) quotaData.usedImages = usedImages;
    if (usedVideos !== undefined) quotaData.usedVideos = usedVideos;
    if (usedLeads !== undefined) quotaData.usedLeads = usedLeads;
    if (resetAt !== undefined) quotaData.resetAt = resetAt ? new Date(resetAt) : new Date();

    // Upsert
    const quota = await db.partnerQuota.upsert({
      where: { partnerId },
      update: quotaData,
      create: {
        partnerId,
        packageId: packageId || '',
        maxUsers: maxUsers ?? 1,
        maxImages: maxImages ?? 0,
        maxVideos: maxVideos ?? 0,
        videoMaxLength: videoMaxLength ?? 0,
        maxLeads: maxLeads ?? 0,
        usedUsers: usedUsers ?? 0,
        usedImages: usedImages ?? 0,
        usedVideos: usedVideos ?? 0,
        usedLeads: usedLeads ?? 0,
        resetAt: resetAt ? new Date(resetAt) : new Date(),
      },
    });

    await logAuditAction(auth, 'upsert_quota', 'PartnerQuota', quota.id, {
      partnerId,
      partnerName: partner.companyName,
      changes: Object.keys(quotaData),
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Quota upserted successfully.',
      data: quota,
    });
  } catch (error: any) {
    console.error('Admin quotas POST error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'PartnerQuota table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to upsert quota.' },
      { status: 500 }
    );
  }
}

// ============================================================
// Route handlers
// ============================================================
export const GET = handleGet;
export const POST = handlePost;
