import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// POST /api/student/vouchers/redeem
// Student redeems a mock test voucher
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { voucherCode } = body;

      if (!voucherCode) {
        return NextResponse.json(
          { success: false, status: 400, message: 'voucherCode is required.' },
          { status: 400 }
        );
      }

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

      // 1. Validate voucher exists and belongs to this student
      const voucher = await db.studentMockTestVoucher.findUnique({
        where: { voucherCode },
      });

      if (!voucher) {
        return NextResponse.json(
          { success: false, status: 404, message: 'Voucher not found.' },
          { status: 404 }
        );
      }

      if (voucher.studentId !== profile.studentId) {
        return NextResponse.json(
          { success: false, status: 403, message: 'This voucher does not belong to you.' },
          { status: 403 }
        );
      }

      // 2. Validate voucher status is 'available'
      if (voucher.status !== 'available') {
        return NextResponse.json(
          { success: false, status: 400, message: `Voucher is already ${voucher.status}.` },
          { status: 400 }
        );
      }

      // 3. Validate voucher not expired
      if (voucher.expiresAt && new Date() > voucher.expiresAt) {
        // Auto-expire the voucher
        await db.studentMockTestVoucher.update({
          where: { id: voucher.id },
          data: { status: 'expired' },
        });
        return NextResponse.json(
          { success: false, status: 400, message: 'Voucher has expired.' },
          { status: 400 }
        );
      }

      // 4. Validate usedCount < usageLimit
      if (voucher.usedCount >= voucher.usageLimit) {
        return NextResponse.json(
          { success: false, status: 400, message: 'Voucher has no remaining uses.' },
          { status: 400 }
        );
      }

      // Increment usedCount
      const newUsedCount = voucher.usedCount + 1;
      const isFullyUsed = newUsedCount >= voucher.usageLimit;

      const updatedVoucher = await db.studentMockTestVoucher.update({
        where: { id: voucher.id },
        data: {
          usedCount: newUsedCount,
          status: isFullyUsed ? 'used' : 'available',
        },
      });

      // Audit log
      await logAuditAction(auth, 'VOUCHER_REDEEMED', 'StudentMockTestVoucher', voucher.id, {
        voucherCode,
        testType: voucher.testType,
        newUsedCount,
        fullyUsed: isFullyUsed,
      });

      return NextResponse.json({
        success: true,
        status: 200,
        message: 'Voucher redeemed successfully.',
        data: {
          voucherCode: updatedVoucher.voucherCode,
          testType: updatedVoucher.testType,
          remainingUses: updatedVoucher.usageLimit - updatedVoucher.usedCount,
          status: updatedVoucher.status,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to redeem voucher.';
      return NextResponse.json({ success: false, status: 500, message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
