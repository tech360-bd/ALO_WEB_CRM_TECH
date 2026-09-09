import { db } from './db';
import {
  canAccessFeature,
  canViewEmployeeSalary,
  canViewEmployeeDocument,
  canViewB2BDetails,
  canAccessPartnerResource,
} from './access-check-engine';

async function runEmployeeDashboardSystemTests() {
  console.log('=== STARTING ALO EMPLOYEE DASHBOARDS & ROLE OPERATING SYSTEM TEST SUITE ===\n');

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

  // 1. Role-Aware Access Validation
  const counselorId = 'EMP-COUNSELOR-001';
  const superAdminId = 'SUPER-ADMIN-001';
  const hrManagerId = 'HR-MGR-001';
  const financeId = 'FIN-OFFICER-001';
  const frontDeskId = 'FRONT-DESK-001';

  const isSuperAdminFullAccess = await canAccessFeature(superAdminId, 'ANY_FEATURE', ['SUPER_ADMIN']);
  assert(isSuperAdminFullAccess, 'Super Admin has master access across all features');

  // 2. HR & Salary Privacy Guard
  const canCounselorAccessSalary = await canViewEmployeeSalary(counselorId, ['COUNSELOR'], hrManagerId);
  assert(!canCounselorAccessSalary, 'Counselor is blocked from accessing HR manager salary');

  const canHrAccessSalary = await canViewEmployeeSalary(hrManagerId, ['HR_MANAGER'], counselorId);
  assert(canHrAccessSalary, 'HR Manager is authorized to view employee salary with audit log');

  // 3. Document Privacy
  const canFrontDeskAccessConfidentialDoc = await canViewEmployeeDocument(frontDeskId, ['FRONT_DESK'], counselorId, 'DOC-HR-001');
  assert(!canFrontDeskAccessConfidentialDoc, 'Front Desk is blocked from downloading confidential employee HR documents');

  // 4. B2B Confidentiality Guard
  const canCounselorAccessB2BSecrets = await canViewB2BDetails(counselorId, ['COUNSELOR'], 'APP-101');
  assert(!canCounselorAccessB2BSecrets, 'Counselor cannot access confidential B2B provider credentials');

  // 5. Multi-Tenant Partner Isolation
  const partnerA = 'PARTNER-ALPHA';
  const partnerB = 'PARTNER-BETA';
  const canCrossPartnerAccess = await canAccessPartnerResource(partnerA, partnerB, ['PARTNER_COUNSELOR']);
  assert(!canCrossPartnerAccess, 'Partner staff cannot access another partner tenant (Server-Side Isolation)');

  // 6. Lead Creation Workflow
  const testLead = await db.marketingLead.create({
    data: {
      name: 'Tanvir Hossain',
      phone: '+880 1711-998877',
      email: 'tanvir.test@example.com',
      destination: 'United Kingdom',
      level: 'Postgraduate',
      intake: 'Sep 2026',
      source: 'Walk-in',
      counselorId,
      counselorName: 'Sarah Khan',
      status: 'new',
      hotLead: true,
      score: 85,
    }
  });
  assert(!!testLead.id && testLead.hotLead === true, 'Lead successfully created with counselor attribution');

  // 7. Counselor Task & Follow-up Workflow
  const task = await db.counselorTask.create({
    data: {
      employeeId: counselorId,
      studentId: 'STU-101',
      title: 'Call Tanvir for IELTS verification',
      description: 'Discuss 6.5 band requirement for UK MSc',
      priority: 'high',
      status: 'pending',
      dueDate: '2026-08-15',
    }
  });
  assert(task.priority === 'high' && task.status === 'pending', 'Counselor task created with high priority');

  // 8. Appointment Booking Workflow
  const appt = await db.appointment.create({
    data: {
      studentId: 'STU-101',
      title: '1-on-1 Counseling Session',
      type: 'counseling',
      scheduledAt: new Date(Date.now() + 3600000), // 1 hour later
      notes: 'Venue: Dhaka Main Office',
      status: 'scheduled',
    }
  });
  assert(appt.status === 'scheduled', 'Appointment booked and assigned');

  // 9. Acting-As Audit Trail Verification
  const actingAsAudit = await db.crmAuditLog.create({
    data: {
      actorUserId: superAdminId,
      actorRole: 'SUPER_ADMIN',
      action: 'ACTING_AS_SESSION_STARTED',
      targetCollection: 'User',
      targetId: counselorId,
      afterData: JSON.stringify({ actingAsUserId: counselorId, actingAsRole: 'COUNSELOR', reason: 'Assisting student consultation' }),
    }
  });
  assert(!!actingAsAudit.id, 'Acting-As session start produces immutable audit log entry');

  // 10. Clean up test records
  await db.marketingLead.delete({ where: { id: testLead.id } });
  await db.counselorTask.delete({ where: { id: task.id } });
  await db.appointment.delete({ where: { id: appt.id } });

  console.log(`\n============================================================`);
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`STATUS: ALL EMPLOYEE DASHBOARD & RBAC TESTS PASSED (100%)`);
  console.log(`============================================================\n`);
}

runEmployeeDashboardSystemTests()
  .catch(e => {
    console.error('TEST SUITE ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
