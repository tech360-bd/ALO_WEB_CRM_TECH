import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// Benefit types and their default limits
// ============================================================
const BENEFIT_CONFIG: Record<string, number> = {
  UKVI_INTERVIEW_PREP: 1,
  UNIVERSITY_INTERVIEW_PREP: 1,
  ENGLISH_MOCK_TEST: 3,
  AI_SPEAKING_PRACTICE: 1,
  DOCUMENT_CHECKLIST: 1,
  APPLICATION_GUIDANCE: 1,
};

// ============================================================
// Generate a unique voucher code: ALO-VCHR-XXXXXXXX
// ============================================================
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ALO-VCHR-${code}`;
}

// ============================================================
// GET /api/partner/student-benefits
// Partner views benefit entitlements for their students
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      // Resolve partnerId from the authenticated partner user
      const partnerProfile = await db.partnerProfile.findUnique({
        where: { userId: auth.userId },
      });

      if (!partnerProfile) {
        return NextResponse.json(
          { success: false, message: 'Partner profile not found.' },
          { status: 404 }
        );
      }

      const partnerId = partnerProfile.partnerId;
      const { searchParams } = new URL(req.url);
      const studentId = searchParams.get('studentId') || undefined;
      const applicationId = searchParams.get('applicationId') || undefined;

      // Build where clause — only show benefits for this partner's students
      const where: Record<string, unknown> = { partnerId };
      if (studentId) where.studentId = studentId;
      if (applicationId) where.applicationId = applicationId;

      // Get all entitlements for this partner's students
      const entitlements = await db.studentBenefitEntitlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Get the student IDs to check their application status
      const studentIds = [...new Set(entitlements.map(e => e.studentId))];

      if (studentIds.length === 0) {
        return NextResponse.json({
          success: true,
          status: 200,
          message: 'No benefit entitlements found.',
          data: { entitlements: [], vouchers: [] },
        });
      }

      // Find active ALO applications for these students
      const activeApps = await db.aloApplication.findMany({
        where: {
          studentId: { in: studentIds },
          status: { notIn: ['cancelled', 'closed', 'rejected'] },
        },
      });

      const activeStudentIds = new Set(activeApps.map(a => a.studentId));

      // Filter entitlements: only students with active applications
      const filteredEntitlements = entitlements.filter(
        e => activeStudentIds.has(e.studentId)
      );

      // Get vouchers — only for students with active applications
      const vouchers = await db.studentMockTestVoucher.findMany({
        where: {
          partnerId,
          ...(studentId ? { studentId } : {}),
          ...(applicationId ? { applicationId } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter vouchers: only for students with active applications
      const filteredVouchers = vouchers.filter(
        v => activeStudentIds.has(v.studentId)
      );

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
      const message = error instanceof Error ? error.message : 'Failed to fetch student benefits.';
      return NextResponse.json({ success: false, status: 500, message }, { status: 500 });
    }
  }, { requireRoles: ['PARTNER_SUPER_ADMIN'] })(request);
}

// ============================================================
// POST /api/partner/student-benefits
// Manually trigger benefit creation for an eligible student
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { studentId, applicationId } = body;

      if (!studentId || !applicationId) {
        return NextResponse.json(
          { success: false, status: 400, message: 'studentId and applicationId are required.' },
          { status: 400 }
        );
      }

      // Resolve partnerId from the authenticated partner user
      const partnerProfile = await db.partnerProfile.findUnique({
        where: { userId: auth.userId },
      });

      if (!partnerProfile) {
        return NextResponse.json(
          { success: false, status: 404, message: 'Partner profile not found.' },
          { status: 404 }
        );
      }

      const partnerId = partnerProfile.partnerId;

      // Check: Does student have an active ALO application?
      const application = await db.aloApplication.findFirst({
        where: {
          id: applicationId,
          studentId,
          status: { notIn: ['cancelled', 'closed', 'rejected'] },
        },
      });

      if (!application) {
        return NextResponse.json(
          { success: false, status: 400, message: 'Student does not have an active ALO application. Benefits cannot be created.' },
          { status: 400 }
        );
      }

      // Check if benefits already exist for this student/application
      const existingEntitlements = await db.studentBenefitEntitlement.findMany({
        where: { studentId, applicationId, partnerId },
      });

      const existingTypes = new Set(existingEntitlements.map(e => e.benefitType));

      // Create entitlements for each benefit type that doesn't already exist
      const newEntitlements: Array<Awaited<ReturnType<typeof db.studentBenefitEntitlement.create>>> = [];
      for (const [benefitType, limitCount] of Object.entries(BENEFIT_CONFIG)) {
        if (!existingTypes.has(benefitType)) {
          const entitlement = await db.studentBenefitEntitlement.create({
            data: {
              studentId,
              partnerId,
              applicationId,
              benefitType,
              limitCount,
              usedCount: 0,
              status: 'active',
              createdBy: auth.userId,
            },
          });
          newEntitlements.push(entitlement);
        }
      }

      // Generate mock test vouchers (up to 3) with unique codes
      const voucherCount = BENEFIT_CONFIG.ENGLISH_MOCK_TEST;
      const existingVoucherCount = await db.studentMockTestVoucher.count({
        where: { studentId, applicationId, partnerId },
      });

      const vouchersToCreate = Math.max(0, voucherCount - existingVoucherCount);
      const newVouchers: Array<Awaited<ReturnType<typeof db.studentMockTestVoucher.create>>> = [];

      for (let i = 0; i < vouchersToCreate; i++) {
        let voucherCode: string | undefined;
        let isUnique = false;

        // Ensure voucher code is unique
        while (!isUnique) {
          voucherCode = generateVoucherCode();
          const existing = await db.studentMockTestVoucher.findUnique({
            where: { voucherCode },
          });
          if (!existing) isUnique = true;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);

        const voucher = await db.studentMockTestVoucher.create({
          data: {
            voucherCode: voucherCode!,
            studentId,
            partnerId,
            applicationId,
            testType: 'ENGLISH_MOCK_TEST',
            usageLimit: 1,
            usedCount: 0,
            expiresAt: expiryDate,
            status: 'available',
          },
        });
        newVouchers.push(voucher);
      }

      // Audit log
      await logAuditAction(auth, 'PARTNER_BENEFITS_CREATED', 'StudentBenefitEntitlement', studentId, {
        partnerId,
        applicationId,
        entitlementsCreated: newEntitlements.length,
        vouchersCreated: newVouchers.length,
      });

      return NextResponse.json({
        success: true,
        status: 201,
        message: `Created ${newEntitlements.length} benefit entitlements and ${newVouchers.length} mock test vouchers for student.`,
        data: {
          entitlements: [...existingEntitlements, ...newEntitlements],
          vouchers: newVouchers,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create student benefits.';
      return NextResponse.json({ success: false, status: 500, message }, { status: 500 });
    }
  }, { requireRoles: ['PARTNER_SUPER_ADMIN'] })(request);
}
