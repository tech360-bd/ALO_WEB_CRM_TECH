import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { PARTNER_PACKAGES, ALO_HARD_VIDEO_CEILING_SECONDS, ACCESS_CONTROL_SECTIONS } from '@/lib/partner/entitlement-policy';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('super_admin') || auth.userType === 'admin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const [
      packages,
      seatRequests,
      extraQuotaRequests,
      featureAccessRules,
      employeesCount,
    ] = await Promise.all([
      db.partnerPackage.findMany({ orderBy: { createdAt: 'desc' } }),
      db.partnerUserSeatRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      db.extraQuotaRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      db.featureAccessRule.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
      db.employee.count(),
    ]);

    return NextResponse.json({
      success: true,
      masterRole: 'ALO_SUPER_ADMIN',
      // When the table is empty we return the catalogue ALO is *entitled to publish*
      // (the same numbers the access checks use) instead of inventing rows with ids
      // that do not exist. `isSeeded: false` tells the UI these cannot be assigned
      // yet, so a Super Admin is never shown a package that would fail to save.
      packages: packages.length ? packages : [],
      packageDefaults: packages.length
        ? []
        : Object.values(PARTNER_PACKAGES).map((pkg) => ({
            slug: pkg.slug,
            name: pkg.name,
            description: pkg.description,
            defaultUserLimit: pkg.defaultUserLimit,
            monthlyImageLimit: pkg.monthlyImageLimit,
            monthlyVideoLimit: pkg.monthlyVideoLimit,
            videoDurationLimitSeconds: pkg.videoDurationLimitSeconds,
            englishMockVoucherLimit: pkg.englishMockVoucherLimit,
            interviewPrepLimit: pkg.interviewPrepLimit,
            autoPublishAllowed: pkg.autoPublishAllowed,
            requiresAloApproval: pkg.requiresAloApproval,
          })),
      packagesSeeded: packages.length > 0,
      packagesNote: packages.length
        ? null
        : 'No partner packages exist in the database yet. The catalogue below is the ALO-approved default, not saved data — create the packages before assigning them to a partner.',
      seatRequests,
      extraQuotaRequests,
      featureAccessRules,
      employeesCount,
      // The twelve sections ALO master control owns, each with the feature keys it
      // governs, so the panel can show a rule next to the switch that enforces it.
      sections: ACCESS_CONTROL_SECTIONS,
      hardCeilings: {
        videoDurationLimitSeconds: ALO_HARD_VIDEO_CEILING_SECONDS,
        defaultPartnerUserLimit: PARTNER_PACKAGES.starter.defaultUserLimit,
        defaultMonthlyImageLimit: PARTNER_PACKAGES.starter.monthlyImageLimit,
        defaultMonthlyVideoLimit: PARTNER_PACKAGES.starter.monthlyVideoLimit,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load Access Control Center data', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN') || roles.includes('super_admin');

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, requestId, newStatus, reviewNote, packageData } = body;

    if (action === 'APPROVE_SEAT_REQUEST') {
      const sReq = await db.partnerUserSeatRequest.update({
        where: { id: requestId },
        data: {
          status: newStatus || 'approved',
          reviewedBy: auth.email || auth.userId,
          reviewNote: reviewNote || 'Approved by ALO Super Admin',
        },
      });

      await db.integrationAuditLog.create({
        data: {
          actorId: auth.userId,
          actorName: auth.name || auth.email,
          actorRole: 'SUPER_ADMIN',
          action: 'PARTNER_SEAT_REQUEST_APPROVED',
          resourceType: 'PartnerUserSeatRequest',
          resourceId: requestId,
          newState: JSON.stringify(sReq),
        },
      });

      return NextResponse.json({ success: true, message: `Seat request ${requestId} ${newStatus}.` });
    }

    if (action === 'CREATE_PARTNER_PACKAGE') {
      const name = packageData?.name || 'Custom B2B Package';
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const pkg = await db.partnerPackage.create({
        data: {
          name,
          slug,
          description: packageData?.description || 'Custom B2B partner feature package',
          maxUsers: Number(packageData?.defaultUserLimit) || 3,
          maxImages: Number(packageData?.monthlyImageLimit) || 15,
          maxVideos: Number(packageData?.monthlyVideoLimit) || 10,
          videoMaxLength: Number(packageData?.videoDurationLimitSeconds) || 30,
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, package: pkg, message: 'Partner Package created successfully.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Access Control Center action failed', details: error.message }, { status: 500 });
  }
}
