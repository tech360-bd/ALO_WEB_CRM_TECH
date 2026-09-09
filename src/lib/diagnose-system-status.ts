import { db } from './db';

export async function runEndToEndVerificationAudit() {
  console.log(`\n============================================================`);
  console.log(`ALO EDUCATION SYSTEM AUDIT — REAL WORKFLOW & DATABASE TEST`);
  console.log(`============================================================\n`);

  const auditReport: {
    passed: string[];
    failed: string[];
    partial: string[];
    details: Record<string, any>;
  } = {
    passed: [],
    failed: [],
    partial: [],
    details: {},
  };

  // 1. Database Table Checks
  console.log(`--- 1. DATABASE MODELS AUDIT ---`);
  const models = [
    { name: 'User', count: () => db.user.count() },
    { name: 'CrmUniversity', count: () => db.crmUniversity.count() },
    { name: 'CrmCourse', count: () => db.crmCourse.count() },
    { name: 'CrmScholarship', count: () => db.crmScholarship.count() },
    { name: 'LeadForm', count: () => db.leadForm.count() },
    { name: 'MarketingLead', count: () => db.marketingLead.count() },
    { name: 'Student', count: () => db.student.count() },
    { name: 'Application', count: () => db.application.count() },
    { name: 'StudentDocument', count: () => db.studentDocument.count() },
    { name: 'CommunicationThread', count: () => db.communicationThread.count() },
    { name: 'CrmAuditLog', count: () => db.crmAuditLog.count() },
  ];

  for (const m of models) {
    try {
      const c = await m.count();
      auditReport.passed.push(`DB Model [${m.name}] connected (${c} records)`);
      console.log(`[PASS] DB Model [${m.name}]: ${c} records`);
    } catch (e: any) {
      auditReport.failed.push(`DB Model [${m.name}]: ${e.message}`);
      console.error(`[FAIL] DB Model [${m.name}]: ${e.message}`);
    }
  }

  // 2. Real Lead Creation Workflow
  console.log(`\n--- 2. REAL LEAD CAPTURE WORKFLOW AUDIT ---`);
  try {
    const testLead = await db.marketingLead.create({
      data: {
        name: 'Verification Student',
        email: `test-${Date.now()}@aloeducation.com`,
        phone: '+8801700000000',
        destination: 'United Kingdom',
        source: 'automated_audit',
        sourceDetail: 'Automated test verification lead.',
        status: 'new',
        score: 80,
        hotLead: true,
        consent: true,
      },
    });

    const leadFound = await db.marketingLead.findUnique({ where: { id: testLead.id } });
    if (leadFound) {
      auditReport.passed.push('Lead creation workflow is REAL and writing to database');
      console.log(`[PASS] Lead captured successfully in DB: ID ${testLead.id}`);
      // Clean up test lead
      await db.marketingLead.delete({ where: { id: testLead.id } });
    } else {
      auditReport.failed.push('Lead created but not found in DB');
    }
  } catch (e: any) {
    auditReport.failed.push(`Lead capture failed: ${e.message}`);
    console.error(`[FAIL] Lead capture failed: ${e.message}`);
  }

  // 3. Real Course & University Search Query Verification
  console.log(`\n--- 3. COURSE SEARCH & UNIVERSITY QUERY AUDIT ---`);
  try {
    const courses = await db.crmCourse.findMany({
      where: { country: 'United Kingdom' },
      take: 3,
      include: { university: true, intakeFees: true },
    });

    if (courses.length > 0) {
      auditReport.passed.push(`Course query connected with university relation (${courses.length} courses loaded)`);
      console.log(`[PASS] Course relation query working: e.g. "${courses[0].courseTitle}" at "${courses[0].university?.name}"`);
    } else {
      auditReport.partial.push('No UK courses found in CrmCourse table');
    }
  } catch (e: any) {
    auditReport.failed.push(`Course query failed: ${e.message}`);
    console.error(`[FAIL] Course query failed: ${e.message}`);
  }

  // 4. Real Scholarships Query Verification
  console.log(`\n--- 4. SCHOLARSHIPS QUERY AUDIT ---`);
  try {
    const scholarships = await db.crmScholarship.findMany({
      take: 3,
      include: { university: true },
    });
    if (scholarships.length > 0) {
      auditReport.passed.push(`Scholarships query connected (${scholarships.length} loaded)`);
      console.log(`[PASS] Scholarship query working: e.g. "${scholarships[0].scholarshipName || 'International Merit Scholarship'}"`);
    } else {
      auditReport.partial.push('No scholarships found in CrmScholarship table');
    }
  } catch (e: any) {
    auditReport.failed.push(`Scholarship query failed: ${e.message}`);
  }

  // 5. Communication / UCC Workflow
  console.log(`\n--- 5. UCC & COMMUNICATION THREADS AUDIT ---`);
  try {
    const testThread = await db.communicationThread.create({
      data: {
        channel: 'whatsapp',
        status: 'open',
        slaStatus: 'normal',
        lastMessagePreview: 'Audit test message',
        lastMessageAt: new Date(),
        studentId: 'STU-AUDIT',
      },
    });
    await db.communicationMessage.create({
      data: {
        threadId: testThread.id,
        channel: 'whatsapp',
        direction: 'inbound',
        content: 'Hello from verification audit',
        messageBody: 'Hello from verification audit',
        status: 'received',
      },
    });

    const threadWithMessages = await db.communicationThread.findUnique({
      where: { id: testThread.id },
      include: { messages: true },
    });

    if (threadWithMessages && threadWithMessages.messages.length > 0) {
      auditReport.passed.push('UCC thread + message workflow is REAL and relational in DB');
      console.log(`[PASS] UCC thread & messages saved: Thread ID ${testThread.id}`);
      // Clean up
      await db.communicationMessage.deleteMany({ where: { threadId: testThread.id } });
      await db.communicationThread.delete({ where: { id: testThread.id } });
    }
  } catch (e: any) {
    auditReport.failed.push(`UCC workflow failed: ${e.message}`);
    console.error(`[FAIL] UCC workflow failed: ${e.message}`);
  }

  console.log(`\n============================================================`);
  console.log(`TOTAL CHECKS: ${auditReport.passed.length + auditReport.failed.length + auditReport.partial.length}`);
  console.log(`PASSED: ${auditReport.passed.length}`);
  console.log(`FAILED: ${auditReport.failed.length}`);
  console.log(`PARTIAL: ${auditReport.partial.length}`);
  console.log(`============================================================\n`);

  return auditReport;
}

runEndToEndVerificationAudit().catch(console.error);
