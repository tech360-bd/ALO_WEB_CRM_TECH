import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

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
      packages: packages.length ? packages : [
        { id: 'PKG-STARTER', name: 'Starter Partner', maxUsers: 3, maxImages: 15, maxVideos: 10, videoMaxLength: 30, isActive: true },
        { id: 'PKG-GROWTH', name: 'Growth Partner', maxUsers: 5, maxImages: 30, maxVideos: 20, videoMaxLength: 30, isActive: true },
        { id: 'PKG-PREMIUM', name: 'Premium Partner', maxUsers: 10, maxImages: 100, maxVideos: 50, videoMaxLength: 60, isActive: true },
      ],
      seatRequests,
      extraQuotaRequests,
      featureAccessRules,
      employeesCount,
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
