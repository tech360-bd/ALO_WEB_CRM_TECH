import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const partnerId = auth.partnerId || 'PARTNER-DEMO';

    const [vouchers, entitlements] = await Promise.all([
      db.studentMockTestVoucher.findMany({ where: { partnerId }, orderBy: { createdAt: 'desc' } }),
      db.studentBenefitEntitlement.findMany({ where: { partnerId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({ success: true, vouchers, entitlements });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch vouchers and entitlements', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const body = await req.json();
    const { studentId, applicationId } = body;

    if (!studentId || !applicationId) {
      return NextResponse.json({ error: 'studentId and applicationId are required' }, { status: 400 });
    }

    const partnerId = auth.partnerId || 'PARTNER-DEMO';

    const app = await db.portalStudentApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app || ['cancelled', 'withdrawn', 'rejected'].includes(app.stage)) {
      return NextResponse.json(
        { error: 'Student benefits require an active, non-cancelled ALO Education application.' },
        { status: 400 }
      );
    }

    const voucherPrefix = `ALO-ENG-${Date.now().toString().slice(-6)}`;
    const createdVouchers = await Promise.all([
      db.studentMockTestVoucher.create({
        data: {
          voucherCode: `${voucherPrefix}-01`,
          studentId,
          partnerId,
          applicationId,
          testType: 'ENGLISH_MOCK_TEST',
          usageLimit: 1,
          status: 'available',
        },
      }),
      db.studentMockTestVoucher.create({
        data: {
          voucherCode: `${voucherPrefix}-02`,
          studentId,
          partnerId,
          applicationId,
          testType: 'ENGLISH_MOCK_TEST',
          usageLimit: 1,
          status: 'available',
        },
      }),
      db.studentMockTestVoucher.create({
        data: {
          voucherCode: `${voucherPrefix}-03`,
          studentId,
          partnerId,
          applicationId,
          testType: 'ENGLISH_MOCK_TEST',
          usageLimit: 1,
          status: 'available',
        },
      }),
    ]);

    const entitlements = await Promise.all([
      db.studentBenefitEntitlement.create({
        data: {
          studentId,
          partnerId,
          applicationId,
          benefitType: 'UKVI_INTERVIEW_PREP',
          limitCount: 1,
          usedCount: 0,
          status: 'active',
          createdBy: auth.email || auth.userId,
        },
      }),
      db.studentBenefitEntitlement.create({
        data: {
          studentId,
          partnerId,
          applicationId,
          benefitType: 'UNIVERSITY_INTERVIEW_PREP',
          limitCount: 1,
          usedCount: 0,
          status: 'active',
          createdBy: auth.email || auth.userId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      vouchers: createdVouchers,
      entitlements,
      message: '3 English Mock Test Vouchers & Interview Prep Package generated for student application.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate student vouchers', details: error.message }, { status: 500 });
  }
}
