import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { logAuditAction } from '@/lib/auth-middleware';
import { requirePartnerContext, requirePartnerSuperAdmin } from '@/lib/partner-tenant-guard';

/**
 * Student benefit + mock-test voucher issuance for a partner's own students.
 *
 * Hardened against three defects found in the original implementation:
 *   1. The application was loaded by id and its eligibility checked, but it was
 *      never verified to belong to the caller's tenant — a partner could mint
 *      vouchers against another partner's application.
 *   2. Nothing prevented repeat calls, so each POST issued another 3 vouchers
 *      and another 2 entitlements for the same student and application.
 *   3. Issuance was not audited.
 */

/** Application stages that make a student ineligible for ALO benefits. */
const INELIGIBLE_STAGES = [
  'cancelled',
  'closed',
  'rejected',
  'rejected_before_submission',
  'withdrawn',
];

/** Benefit package granted per eligible application (§16). */
const BENEFIT_PACKAGE: Array<{ benefitType: string; limitCount: number }> = [
  { benefitType: 'UKVI_INTERVIEW_PREP', limitCount: 1 },
  { benefitType: 'UNIVERSITY_INTERVIEW_PREP', limitCount: 1 },
  { benefitType: 'AI_SPEAKING_PRACTICE', limitCount: 1 },
  { benefitType: 'DOCUMENT_CHECKLIST', limitCount: 1 },
  { benefitType: 'APPLICATION_GUIDANCE', limitCount: 1 },
];

/** Maximum English mock test vouchers per eligible student (§16, §18). */
const MOCK_TEST_VOUCHER_COUNT = 3;

export async function GET(req: NextRequest) {
  const ctx = await requirePartnerContext(req);
  if (ctx instanceof NextResponse) return ctx;

  try {
    const [vouchers, entitlements] = await Promise.all([
      db.studentMockTestVoucher.findMany({
        where: { partnerId: ctx.partnerId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      db.studentBenefitEntitlement.findMany({
        where: { partnerId: ctx.partnerId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    return NextResponse.json({ success: true, partnerId: ctx.partnerId, vouchers, entitlements });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to load vouchers and entitlements.' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requirePartnerSuperAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await req.json().catch(() => ({}));
    const studentId = typeof body?.studentId === 'string' ? body.studentId.trim() : '';
    const applicationId = typeof body?.applicationId === 'string' ? body.applicationId.trim() : '';

    if (!studentId || !applicationId) {
      return NextResponse.json(
        { success: false, error: 'studentId and applicationId are required.' },
        { status: 400 },
      );
    }

    // --- Tenant + ownership: the application must belong to a student of THIS
    // partner, and that student must be the one named in the request. ---
    const application = await db.portalStudentApplication.findUnique({
      where: { id: applicationId },
      include: { studentProfile: { select: { studentId: true, partnerId: true } } },
    });

    if (
      !application ||
      application.studentProfile?.partnerId !== ctx.partnerId ||
      application.studentProfile?.studentId !== studentId
    ) {
      // 404 rather than 403 so tenant membership is not disclosed.
      return NextResponse.json(
        { success: false, error: 'Application not found for this student in your organisation.' },
        { status: 404 },
      );
    }

    // --- Eligibility: benefits require an active ALO application (§15). ---
    if (INELIGIBLE_STAGES.includes(String(application.stage || '').toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Student benefits require an active ALO Education application. This application is ' +
            `${application.stage} and is not eligible.`,
        },
        { status: 400 },
      );
    }

    // --- Idempotency: never issue a second package for the same application. ---
    const existingVoucherCount = await db.studentMockTestVoucher.count({
      where: { studentId, partnerId: ctx.partnerId, applicationId },
    });
    if (existingVoucherCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Benefits have already been issued for this student application.',
          existingVoucherCount,
        },
        { status: 409 },
      );
    }

    const issued = await db.$transaction(async (tx: any) => {
      const codeSeed = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();

      const vouchers: any[] = [];
      for (let i = 1; i <= MOCK_TEST_VOUCHER_COUNT; i++) {
        vouchers.push(
          await tx.studentMockTestVoucher.create({
            data: {
              voucherCode: `ALO-ENG-${codeSeed}-${String(i).padStart(2, '0')}`,
              studentId,
              partnerId: ctx.partnerId,
              applicationId,
              testType: 'ENGLISH_MOCK_TEST',
              usageLimit: 1,
              status: 'available',
            },
          }),
        );
      }

      const entitlements: any[] = [];
      for (const benefit of BENEFIT_PACKAGE) {
        entitlements.push(
          await tx.studentBenefitEntitlement.create({
            data: {
              studentId,
              partnerId: ctx.partnerId,
              applicationId,
              benefitType: benefit.benefitType,
              limitCount: benefit.limitCount,
              usedCount: 0,
              status: 'active',
              createdBy: ctx.userId,
            },
          }),
        );
      }

      return { vouchers, entitlements };
    });

    await logAuditAction(ctx, 'STUDENT_BENEFITS_ISSUED', 'StudentBenefitEntitlement', applicationId, {
      partnerId: ctx.partnerId,
      studentId,
      applicationId,
      voucherCount: issued.vouchers.length,
      benefitTypes: BENEFIT_PACKAGE.map((b) => b.benefitType),
    });

    return NextResponse.json({
      success: true,
      vouchers: issued.vouchers,
      entitlements: issued.entitlements,
      message: `${MOCK_TEST_VOUCHER_COUNT} English mock test vouchers and the interview preparation package were issued for this student application.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to issue student benefits.' },
      { status: 500 },
    );
  }
}
