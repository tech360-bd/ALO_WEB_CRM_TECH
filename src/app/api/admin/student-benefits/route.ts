import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/admin/student-benefits
// Super Admin views all student benefits across all partners
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, _auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const partnerId = searchParams.get('partnerId') || undefined;
      const benefitType = searchParams.get('benefitType') || undefined;
      const status = searchParams.get('status') || undefined;

      const where: Record<string, unknown> = {};
      if (partnerId) where.partnerId = partnerId;
      if (benefitType) where.benefitType = benefitType;
      if (status) where.status = status;

      const entitlements = await db.studentBenefitEntitlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const vouchers = await db.studentMockTestVoucher.findMany({
        where: partnerId ? { partnerId } : {},
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        status: 200,
        message: 'Retrieved all student benefits across all partners.',
        data: { entitlements, vouchers },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch benefits.';
      return NextResponse.json({ success: false, status: 500, message }, { status: 500 });
    }
  }, { requireRoles: ['super_admin'] })(request);
}

// ============================================================
// POST /api/admin/student-benefits
// Super Admin manually adjusts benefit entitlements
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { entitlementId, action, newLimit, reason } = body;

      if (!entitlementId || !action) {
        return NextResponse.json(
          { success: false, status: 400, message: 'entitlementId and action are required.' },
          { status: 400 }
        );
      }

      if (!['adjust_limit', 'cancel'].includes(action)) {
        return NextResponse.json(
          { success: false, status: 400, message: 'action must be adjust_limit or cancel.' },
          { status: 400 }
        );
      }

      const entitlement = await db.studentBenefitEntitlement.findUnique({
        where: { id: entitlementId },
      });

      if (!entitlement) {
        return NextResponse.json(
          { success: false, status: 404, message: 'Entitlement not found.' },
          { status: 404 }
        );
      }

      let updatedEntitlement;

      if (action === 'adjust_limit') {
        if (newLimit === undefined || newLimit === null) {
          return NextResponse.json(
            { success: false, status: 400, message: 'newLimit is required for adjust_limit action.' },
            { status: 400 }
          );
        }

        if (typeof newLimit !== 'number' || newLimit < 0) {
          return NextResponse.json(
            { success: false, status: 400, message: 'newLimit must be a non-negative number.' },
            { status: 400 }
          );
        }

        updatedEntitlement = await db.studentBenefitEntitlement.update({
          where: { id: entitlementId },
          data: { limitCount: newLimit },
        });

        await logAuditAction(auth, 'BENEFIT_LIMIT_ADJUSTED', 'StudentBenefitEntitlement', entitlementId, {
          previousLimit: entitlement.limitCount,
          newLimit,
          benefitType: entitlement.benefitType,
          studentId: entitlement.studentId,
          reason: reason || '',
        });
      } else if (action === 'cancel') {
        updatedEntitlement = await db.studentBenefitEntitlement.update({
          where: { id: entitlementId },
          data: { status: 'cancelled' },
        });

        await logAuditAction(auth, 'BENEFIT_CANCELLED', 'StudentBenefitEntitlement', entitlementId, {
          benefitType: entitlement.benefitType,
          studentId: entitlement.studentId,
          previousStatus: entitlement.status,
          reason: reason || '',
        });
      }

      return NextResponse.json({
        success: true,
        status: 200,
        message: `Benefit entitlement ${action} successful.`,
        data: updatedEntitlement,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to adjust benefit entitlement.';
      return NextResponse.json({ success: false, status: 500, message }, { status: 500 });
    }
  }, { requireRoles: ['super_admin'] })(request);
}
