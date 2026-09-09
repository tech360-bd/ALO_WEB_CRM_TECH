// ============================================================
// /api/admin/partner-assignments
// GET  — All partner package assignments with enriched data (super_admin)
// POST — Assign a package to a partner (super_admin)
//        Also creates / updates the PartnerQuota with package defaults.
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
// GET: All assignments with package and partner info
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
    const status = searchParams.get('status') || undefined;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;

    const assignments = await db.partnerPackageAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with partner name and package details
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const [partner, pkg] = await Promise.all([
          db.partnerProfile.findUnique({
            where: { userId: a.partnerId },
            select: { companyName: true, approvalStatus: true },
          }),
          db.partnerPackage.findUnique({
            where: { id: a.packageId },
            select: { name: true, slug: true, price: true, billingCycle: true },
          }),
        ]);

        return {
          ...a,
          partnerName: partner?.companyName || 'Unknown',
          partnerStatus: partner?.approvalStatus || 'unknown',
          package: pkg || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Assignments fetched successfully.',
      data: enriched,
    });
  } catch (error: any) {
    console.error('Admin partner-assignments GET error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'PartnerPackageAssignment table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to fetch assignments.' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: Assign a package to a partner
// Also creates / updates PartnerQuota with package defaults
// ============================================================
async function handlePost(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const denied = superAdminOnly(auth);
    if (denied) return denied;

    const body = await request.json();
    const { partnerId, packageId, startsAt, expiresAt, status: assignmentStatus } = body;

    if (!partnerId || !packageId) {
      return NextResponse.json(
        { success: false, status: 400, error: 'partnerId and packageId are required.' },
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

    // Validate package exists
    const pkg = await db.partnerPackage.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json(
        { success: false, status: 404, error: 'Package not found.' },
        { status: 404 }
      );
    }

    // Check for existing active assignment to avoid duplicates
    const existing = await db.partnerPackageAssignment.findFirst({
      where: {
        partnerId,
        packageId,
        status: 'active',
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, status: 409, error: 'An active assignment already exists for this partner and package.' },
        { status: 409 }
      );
    }

    // Create the assignment
    const assignment = await db.partnerPackageAssignment.create({
      data: {
        partnerId,
        packageId,
        assignedBy: auth.userId,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: assignmentStatus || 'active',
      },
    });

    // Create / update PartnerQuota with package defaults
    const quota = await db.partnerQuota.upsert({
      where: { partnerId },
      update: {
        packageId,
        maxUsers: pkg.maxUsers,
        maxImages: pkg.maxImages,
        maxVideos: pkg.maxVideos,
        videoMaxLength: pkg.videoMaxLength,
        maxLeads: pkg.maxLeads,
      },
      create: {
        partnerId,
        packageId,
        maxUsers: pkg.maxUsers,
        maxImages: pkg.maxImages,
        maxVideos: pkg.maxVideos,
        videoMaxLength: pkg.videoMaxLength,
        maxLeads: pkg.maxLeads,
        resetAt: new Date(),
      },
    });

    await logAuditAction(auth, 'assign_package', 'PartnerPackageAssignment', assignment.id, {
      partnerId,
      partnerName: partner.companyName,
      packageId,
      packageName: pkg.name,
      quotaUpdated: true,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Package assigned successfully. Quota updated with package defaults.',
      data: {
        assignment,
        quota,
      },
    });
  } catch (error: any) {
    console.error('Admin partner-assignments POST error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false, status: 503, error: 'PartnerPackageAssignment table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, status: 500, error: 'Failed to assign package.' },
      { status: 500 }
    );
  }
}

// ============================================================
// Route handlers
// ============================================================
export const GET = handleGet;
export const POST = handlePost;
