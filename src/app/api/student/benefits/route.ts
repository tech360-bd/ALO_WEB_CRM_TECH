import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student/benefits
// Student views their own benefit entitlements and vouchers
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (_req, auth) => {
    try {
      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });

      if (!profile) {
        return NextResponse.json(
          { success: false, status: 404, message: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const studentId = profile.studentId;

      // Find active ALO applications for this student
      const activeApplications = await db.aloApplication.findMany({
        where: {
          studentId,
          status: { notIn: ['cancelled', 'closed', 'rejected'] },
        },
        select: { id: true },
      });

      const activeAppIds = new Set(activeApplications.map(a => a.id));

      // Get benefit entitlements — only for active applications
      const entitlements = await db.studentBenefitEntitlement.findMany({
        where: {
          studentId,
          status: 'active',
        },
        orderBy: { createdAt: 'desc' },
      });

      const filteredEntitlements = entitlements.filter(
        e => activeAppIds.has(e.applicationId)
      );

      // Get vouchers — only for active applications
      const vouchers = await db.studentMockTestVoucher.findMany({
        where: {
          studentId,
        },
        orderBy: { createdAt: 'desc' },
      });

      const filteredVouchers = vouchers.filter(
        v => activeAppIds.has(v.applicationId)
      ).map(v => ({
        id: v.id,
        voucherCode: v.voucherCode,
        testType: v.testType,
        usageLimit: v.usageLimit,
        usedCount: v.usedCount,
        remainingUses: v.usageLimit - v.usedCount,
        status: v.status,
        expiresAt: v.expiresAt,
        createdAt: v.createdAt,
      }));

      return NextResponse.json({
        success: true,
        status: 200,
        message: `Found ${filteredEntitlements.length} entitlements and ${filteredVouchers.length} vouchers.`,
        data: {
          entitlements: filteredEntitlements,
          vouchers: filteredVouchers,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch benefits.';
      return NextResponse.json({ success: false, status: 500, message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
