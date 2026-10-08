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

      // 5. Consume the voucher ATOMICALLY.
      //
      // Reading usedCount and then writing `usedCount + 1` is a lost-update
      // race: two concurrent redemptions of the same voucher both read 0, both
      // write 1, and the student gets two mock tests for one voucher. The
      // conditional `updateMany` below makes the database itself re-check
      // `usedCount < usageLimit` and `status = 'available'` as part of the
      // write, so exactly one concurrent caller can succeed.
      const newUsedCount = voucher.usedCount + 1;
      const isFullyUsed = newUsedCount >= voucher.usageLimit;

      const claim = await db.studentMockTestVoucher.updateMany({
        where: {
          id: voucher.id,
          status: 'available',
          usedCount: { lt: voucher.usageLimit },
        },
        data: {
          usedCount: { increment: 1 },
          status: isFullyUsed ? 'used' : 'available',
        },
      });

      if (claim.count === 0) {
        // Another request consumed the final use first.
        return NextResponse.json(
          { success: false, status: 409, message: 'This voucher has just been used. Please refresh and try again.' },
          { status: 409 }
        );
      }

      const updatedVoucher = await db.studentMockTestVoucher.findUniqueOrThrow({
        where: { id: voucher.id },
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
