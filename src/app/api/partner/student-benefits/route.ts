import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

const ACTIVE_APPLICATION_STATUSES = ['active', 'ACTIVE'];
function isPartnerSuperAdmin(auth: { userType: string; roles: string[] }) {
  return auth.userType.toUpperCase() === 'PARTNER_SUPER_ADMIN' || auth.roles.some((role) => role.toLowerCase() === 'partner_super_admin');
}
function isActivePartner(approvalStatus: string) {
  return ['active', 'approved'].includes(String(approvalStatus || '').trim().toLowerCase());
}

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
  return `ALO-VCHR-${randomBytes(8).toString('hex').toUpperCase()}`;
}

// ============================================================
// GET /api/partner/student-benefits
// Partner views benefit entitlements for their students
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      if (!isPartnerSuperAdmin(auth)) return NextResponse.json({ success: false, message: 'Partner Super Admin access is required.' }, { status: 403 });
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
      if (!isActivePartner(partnerProfile.approvalStatus)) {
        return NextResponse.json({ success: false, message: 'Partner account is not active or approved.' }, { status: 403 });
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
          status: { in: ACTIVE_APPLICATION_STATUSES },
        },
        select: { studentId: true },
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
  }, { requireRoles: ['partner_super_admin', 'PARTNER_SUPER_ADMIN'] })(request);
}

// ============================================================
// POST /api/partner/student-benefits
// Manually trigger benefit creation for an eligible student
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      if (!isPartnerSuperAdmin(auth)) return NextResponse.json({ success: false, message: 'Partner Super Admin access is required.' }, { status: 403 });
      const body = await req.json();
      const { studentId, applicationId } = body;

      if (typeof studentId !== 'string' || typeof applicationId !== 'string' || !studentId.trim() || !applicationId.trim() || studentId.length > 191 || applicationId.length > 191) {
        return NextResponse.json(
          { success: false, status: 400, message: 'studentId and applicationId are required.' },
          { status: 400 }
        );
      }
      const requestedStudentId = studentId.trim();
      const requestedApplicationId = applicationId.trim();

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
      if (!isActivePartner(partnerProfile.approvalStatus)) {
        return NextResponse.json({ success: false, message: 'Partner account is not active or approved.' }, { status: 403 });
      }

      const partnerId = partnerProfile.partnerId;

      // Establish student ownership from canonical partner records before checking eligibility.
      const baseStudent = await db.student.findFirst({
        where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] },
        select: { id: true, studentId: true, userId: true },
      });
      const partnerStudent = await db.portalStudentProfile.findFirst({
        where: {
          partnerId,
          OR: [
            { id: requestedStudentId },
            { studentId: requestedStudentId },
            ...(baseStudent?.userId ? [{ userId: baseStudent.userId }] : []),
          ],
        },
        select: { id: true, studentId: true, userId: true },
      });
      const studentAliases = [...new Set([
        requestedStudentId,
        baseStudent?.id,
        baseStudent?.studentId,
        partnerStudent?.id,
        partnerStudent?.studentId,
      ].filter((value): value is string => Boolean(value)))];
      const partnerLead = partnerStudent ? null : await db.partnerLead.findFirst({
        where: { partnerId, studentId: { in: studentAliases } },
        select: { id: true },
      });
      if (!partnerStudent && !partnerLead) {
        return NextResponse.json({ success: false, status: 403, message: 'Student is not linked to your partner account.' }, { status: 403 });
      }

      // Only active ALO applications are eligible; closed/rejected/unknown statuses are excluded.
      const application = await db.aloApplication.findFirst({
        where: {
          id: requestedApplicationId,
          studentId: { in: studentAliases },
          status: { in: ACTIVE_APPLICATION_STATUSES },
        },
      });

      if (!application) {
        return NextResponse.json(
          { success: false, status: 400, message: 'Student does not have an active ALO application. Benefits cannot be created.' },
          { status: 400 }
        );
      }

      const benefitStudentId = application.studentId;
      const benefitApplicationId = application.id;

      // Check if benefits already exist for this student/application
      const existingEntitlements = await db.studentBenefitEntitlement.findMany({
        where: { studentId: benefitStudentId, applicationId: benefitApplicationId, partnerId },
      });

      const existingTypes = new Set(existingEntitlements.map(e => e.benefitType));

      // Create entitlements for each benefit type that doesn't already exist
      const newEntitlements: Array<Awaited<ReturnType<typeof db.studentBenefitEntitlement.create>>> = [];
      for (const [benefitType, limitCount] of Object.entries(BENEFIT_CONFIG)) {
        if (!existingTypes.has(benefitType)) {
          const entitlement = await db.studentBenefitEntitlement.create({
            data: {
              studentId: benefitStudentId,
              partnerId,
              applicationId: benefitApplicationId,
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
        where: { studentId: benefitStudentId, applicationId: benefitApplicationId, partnerId },
      });

      const vouchersToCreate = Math.max(0, voucherCount - existingVoucherCount);
      const newVouchers: Array<Awaited<ReturnType<typeof db.studentMockTestVoucher.create>>> = [];

      for (let i = 0; i < vouchersToCreate; i++) {
        let voucherCode: string | undefined;
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = generateVoucherCode();
          const existing = await db.studentMockTestVoucher.findUnique({ where: { voucherCode: candidate } });
          if (!existing) {
            voucherCode = candidate;
            break;
          }
        }
        if (!voucherCode) throw new Error('Could not allocate a unique voucher code.');

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);

        const voucher = await db.studentMockTestVoucher.create({
          data: {
            voucherCode: voucherCode!,
            studentId: benefitStudentId,
            partnerId,
            applicationId: benefitApplicationId,
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
      await logAuditAction(auth, 'PARTNER_BENEFITS_CREATED', 'StudentBenefitEntitlement', benefitStudentId, {
        partnerId,
        applicationId: benefitApplicationId,
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
  }, { requireRoles: ['partner_super_admin', 'PARTNER_SUPER_ADMIN'] })(request);
}
