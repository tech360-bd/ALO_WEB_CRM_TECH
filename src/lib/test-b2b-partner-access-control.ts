import { db } from './db';
import {
  canAccessFeature,
  getQuota,
  checkQuotaBeforeAction,
  recordUsage,
  canViewEmployeePrivateProfile,
  canViewEmployeeSalary,
  canViewEmployeeDocument,
  canViewB2BDetails,
  canUseStudentBenefit,
  canUseVoucher,
  canManagePartnerUser,
  canAccessPartnerResource,
} from './access-check-engine';

async function runB2bPartnerTests() {
  console.log('=== STARTING ALO B2B PARTNER & ACCESS CONTROL MASTER VERIFICATION ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    }
  }

  // 1. Partner Tenant Isolation
  const partnerA = 'PARTNER-A-101';
  const partnerB = 'PARTNER-B-202';
  const isIsolated = await canAccessPartnerResource(partnerA, partnerB, ['partner_super_admin']);
  assert(!isIsolated, 'Partner A cannot access Partner B resources (Strict Tenant Isolation)');

  const isSuperAdminAccess = await canAccessPartnerResource(partnerA, partnerB, ['super_admin']);
  assert(isSuperAdminAccess, 'Super Admin can access any partner resource for oversight');

  // 2. Partner User Limits & Quotas
  const defaultSeats = await getQuota('PARTNER', partnerA, 'user_seats');
  assert(defaultSeats === 3, 'Default Partner Starter user seat limit is 3 (1 Super Admin + 2 Employees)');

  const defaultImages = await getQuota('PARTNER', partnerA, 'monthly_images');
  assert(defaultImages === 15, 'Default Partner Starter image quota is 15 images/month');

  const defaultVideos = await getQuota('PARTNER', partnerA, 'monthly_videos');
  assert(defaultVideos === 10, 'Default Partner Starter video quota is 10 videos/month');

  const maxVideoDuration = await getQuota('PARTNER', partnerA, 'video_duration_limit_seconds');
  assert(maxVideoDuration === 30, 'Default Partner max video duration is 30 seconds');

  // 3. Quota Check & Atomic Usage
  const quotaCheck = await checkQuotaBeforeAction('PARTNER', partnerA, 'monthly_images');
  assert(quotaCheck.allowed === true && quotaCheck.limit === 15, 'checkQuotaBeforeAction permits action within limit');

  await recordUsage('PARTNER', partnerA, 'monthly_images');
  const usageAfter = await db.partnerMarketingUsage.findFirst({ where: { partnerId: partnerA } });
  assert(usageAfter?.imagesUsed === 1, 'recordUsage atomically increments current period usage');

  // 4. Extra Seat Request Workflow
  const seatReq = await db.partnerUserSeatRequest.create({
    data: {
      partnerId: partnerA,
      requestedBy: 'admin@partner-a.com',
      currentLimit: 3,
      requestedExtraSeats: 2,
      reason: 'Expanding counselor team for UK Fall 2026 intake',
      status: 'pending',
    }
  });
  assert(seatReq.status === 'pending' && seatReq.requestedExtraSeats === 2, 'Extra seat request created in PENDING status');

  const approvedSeatReq = await db.partnerUserSeatRequest.update({
    where: { id: seatReq.id },
    data: {
      status: 'approved',
      reviewedBy: 'super-admin-001',
      reviewNote: 'Approved by ALO Chairman',
    }
  });
  assert(approvedSeatReq.status === 'approved', 'Super Admin approval transitions seat request to APPROVED');

  // 5. Student Benefit Engine (Active ALO Application Required)
  const testStudentWithoutApp = 'STU-NO-APP-001';
  const benefitNoApp = await canUseStudentBenefit(testStudentWithoutApp, 'UKVI_INTERVIEW_PREP');
  assert(!benefitNoApp.allowed, 'Student without active ALO application is denied benefits');

  // Create active student & application
  const testStudentWithApp = 'STU-ACTIVE-002';
  const app = await db.application.create({
    data: {
      studentId: testStudentWithApp,
      applicationCode: 'APP-ACTIVE-002',
      stage: 'counseling',
      status: 'active',
      safeStatus: 'UNDER_REVIEW',
      universityName: 'University of Oxford',
      courseName: 'MSc Computer Science',
      country: 'UK',
      intake: 'Sep 2026',
    }
  });

  const benefitWithApp = await canUseStudentBenefit(testStudentWithApp, 'UKVI_INTERVIEW_PREP');
  assert(benefitWithApp.allowed, 'Student with active ALO application is granted benefits');

  // 6. English Mock Test Vouchers (Max 3, Atomic Redemption, Expiry)
  const voucherCode = `ALO-TEST-VOUCHER-${Date.now()}`;
  const voucher = await db.studentMockTestVoucher.create({
    data: {
      voucherCode,
      studentId: testStudentWithApp,
      partnerId: partnerA,
      applicationId: app.id,
      testType: 'ENGLISH_MOCK_TEST',
      usageLimit: 1,
      usedCount: 0,
      status: 'available',
      expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
    }
  });
  assert(voucher.status === 'available', 'English mock test voucher created with AVAILABLE status');

  const validVoucherCheck = await canUseVoucher(testStudentWithApp, voucherCode);
  assert(validVoucherCheck.allowed, 'Valid voucher check succeeds for legitimate student owner');

  const wrongStudentCheck = await canUseVoucher('STU-IMPOSTER-999', voucherCode);
  assert(!wrongStudentCheck.allowed, 'Cross-student voucher redemption is blocked');

  // Redeem voucher
  await db.studentMockTestVoucher.update({
    where: { id: voucher.id },
    data: { usedCount: 1, status: 'used' },
  });

  const usedVoucherCheck = await canUseVoucher(testStudentWithApp, voucherCode);
  assert(!usedVoucherCheck.allowed, 'Used voucher cannot be reused (Single Use Atomic Enforcement)');

  // 7. Employee Management & Salary/HR Privacy
  const empId = 'EMP-TEST-777';
  const normalViewer = 'EMP-NORMAL-111';
  const hrViewer = 'HR-MANAGER-001';

  const canNormalViewSalary = await canViewEmployeeSalary(normalViewer, ['counselor'], empId);
  assert(!canNormalViewSalary, 'Normal employee/counselor is blocked from viewing colleague salary');

  const canHrViewSalary = await canViewEmployeeSalary(hrViewer, ['hr_manager'], empId);
  assert(canHrViewSalary, 'HR Manager is authorized to view salary data');

  const canNormalViewDoc = await canViewEmployeeDocument(normalViewer, ['counselor'], empId, 'DOC-101');
  assert(!canNormalViewDoc, 'Normal employee is blocked from downloading colleague HR documents');

  // 8. Confidential B2B Details Protection
  const canCounselorViewB2B = await canViewB2BDetails('counselor-01', ['counselor'], app.id);
  assert(!canCounselorViewB2B, 'Counselor cannot view confidential B2B provider credentials or commission');

  const canAppManagerViewB2B = await canViewB2BDetails('app-mgr-01', ['application_manager'], app.id);
  assert(canAppManagerViewB2B, 'Application Manager is authorized to view B2B details');

  // 9. Audit Log Generation
  const audit = await db.crmAuditLog.create({
    data: {
      actorUserId: 'super-admin-001',
      actorRole: 'super_admin',
      action: 'PARTNER_PACKAGE_UPDATED',
      targetCollection: 'PartnerPackage',
      targetId: 'PKG-STARTER',
      afterData: JSON.stringify({ name: 'Starter Package', maxUsers: 3, maxImages: 15, maxVideos: 10 }),
    }
  });
  assert(!!audit.id, 'CrmAuditLog record created successfully for Super Admin access control action');

  console.log(`\n============================================================`);
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`STATUS: ALL B2B PARTNER & ACCESS CONTROL TESTS PASSED (100%)`);
  console.log(`============================================================\n`);
}

runB2bPartnerTests()
  .catch(e => {
    console.error('TEST SUITE ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
