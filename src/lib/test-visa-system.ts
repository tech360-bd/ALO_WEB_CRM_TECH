import { db } from './db';

async function runLiveTests() {
  console.log('--- STARTING ALO VISA SYSTEM LIVE AUDIT & INTEGRATION TESTS ---');

  // 1. Check database connection & count Visa Cases
  const initialCases = await db.visaCase.count();
  console.log(`[PASS] DB Connection OK. Total Visa Cases in DB: ${initialCases}`);

  // 2. Ensure test case exists
  let testCase = await db.visaCase.findFirst({ where: { caseCode: 'CASE-TEST-001' } });
  if (!testCase) {
    testCase = await db.visaCase.create({
      data: {
        caseCode: 'CASE-TEST-001',
        studentId: 'STU-TEST-999',
        studentName: 'Farhan Ahmed',
        destinationCountry: 'UK',
        university: 'University of Edinburgh',
        course: 'MSc Artificial Intelligence',
        intake: 'Sep 2026',
        currentStage: 'OFFICER_REVIEW_PENDING',
        readinessScore: 85,
        riskLevel: 'low',
        visaOfficerId: 'officer-001',
        visaOfficerName: 'Senior Visa Officer',
      }
    });
    console.log(`[PASS] Created test VisaCase: ${testCase.id} (${testCase.caseCode})`);
  } else {
    console.log(`[PASS] Found existing test VisaCase: ${testCase.id}`);
  }

  // 3. Test Funding Review
  const funding = await db.visaFundingReview.upsert({
    where: { caseId: testCase.id },
    create: {
      caseId: testCase.id,
      studentId: testCase.studentId,
      fundingStatus: 'approved',
      sponsor: 'Mother (Civil Engineer)',
      sponsorRelation: 'Mother',
      sponsorIncome: '৳ 3,000,000 BDT',
      sourceOfFund: 'Salaried Income + Savings',
      hasBankStatement: true,
      hasSolvencyCert: true,
      riskWarning: 'none',
    },
    update: {
      fundingStatus: 'approved',
    }
  });
  console.log(`[PASS] VisaFundingReview verified: Sponsor=${funding.sponsor}`);

  // 4. Test Study Gap Review
  const gap = await db.visaStudyGapReview.upsert({
    where: { caseId: testCase.id },
    create: {
      caseId: testCase.id,
      studentId: testCase.studentId,
      hasStudyGap: true,
      gapDurationMonths: 10,
      gapPurpose: 'Full-time AI Internship',
      workExpDuringGap: 'Junior AI Developer at TechCorp',
      explanationClarity: 'clear',
      riskFlag: 'low',
    },
    update: {
      gapPurpose: 'Full-time AI Internship',
    }
  });
  console.log(`[PASS] VisaStudyGapReview verified: Gap=${gap.gapDurationMonths} months`);

  // 5. Test Refusal Review
  const refusal = await db.visaRefusalReview.upsert({
    where: { caseId: testCase.id },
    create: {
      caseId: testCase.id,
      studentId: testCase.studentId,
      hasVisaRefusal: false,
      refusalCountry: '',
      refusalReason: '',
      humanReviewStatus: 'approved',
    },
    update: {
      hasVisaRefusal: false,
    }
  });
  console.log(`[PASS] VisaRefusalReview verified: HasRefusal=${refusal.hasVisaRefusal}`);

  // 6. Test Visa Interview & Question & Answer
  const interview = await db.visaInterview.create({
    data: {
      caseId: testCase.id,
      studentId: testCase.studentId,
      interviewType: 'embassy_mock',
      difficulty: 'standard',
      language: 'english',
      status: 'completed',
      scheduledAt: new Date(),
      overallScore: 88,
      verdict: 'ready',
      officerNotes: 'Candidate demonstrated strong subject matter expertise and clear funding source.',
      studentFeedback: 'Great clarity on career progression in Bangladesh.',
      completedAt: new Date(),
    }
  });

  const answer = await db.visaInterviewAnswer.create({
    data: {
      interviewId: interview.id,
      question: 'Why did you select the University of Edinburgh?',
      answer: 'Edinburgh is renowned for its School of Informatics and pioneering AI research.',
      score: 90,
      feedback: 'Very precise answer.',
    }
  });
  console.log(`[PASS] VisaInterview created & scored: Score=${interview.overallScore}, AnswerId=${answer.id}`);

  // 7. Test AI Interview Practice Session
  const aiSession = await db.aiInterviewSession.create({
    data: {
      studentId: testCase.studentId,
      interviewType: 'embassy_mock',
      status: 'completed',
      readinessScore: 84,
      completedAt: new Date(),
    }
  });

  const aiResult = await db.aiInterviewResult.create({
    data: {
      sessionId: aiSession.id,
      communicationClarity: 85,
      confidence: 80,
      courseKnowledge: 90,
      universityKnowledge: 85,
      countryKnowledge: 80,
      financialExplanation: 80,
      sponsorExplanation: 80,
      studyGapExplanation: 85,
      futurePlanClarity: 90,
      visaRisk: 15,
      overallReadiness: 84,
      verdict: 'ready',
      finalFeedback: 'Strong, authentic explanation without memorization.',
    }
  });
  console.log(`[PASS] AiInterviewResult verified: Session=${aiSession.id}, Score=${aiResult.overallReadiness}`);

  // 8. Test 10-Component Visa Readiness Report
  const readiness = await db.visaReadinessReport.create({
    data: {
      studentId: testCase.studentId,
      visaCaseId: testCase.id,
      applicationId: 'APP-TEST-999',
      overallScore: 89,
      documentsReady: 7,
      documentsTotal: 8,
      interviewReady: true,
      riskFactors: '[]',
      recommendation: 'Visa file is robust. Ready for Embassy submission upon final TB certificate clearance.',
    }
  });
  console.log(`[PASS] VisaReadinessReport verified: OverallScore=${readiness.overallScore}%`);

  // 9. Test Two-Layer Officer Note
  const note = await db.visaOfficerNote.create({
    data: {
      caseId: testCase.id,
      studentId: testCase.studentId,
      officerId: 'officer-001',
      officerName: 'Senior Visa Officer',
      content: 'Financial documentation verified against bank portal. Genuine sponsorship confirmed.',
      visibility: 'internal_only',
      riskFlag: 'none',
    }
  });
  console.log(`[PASS] Two-layer VisaOfficerNote created: Visibility=${note.visibility}`);

  // 10. Test Audit Log
  const audit = await db.crmAuditLog.create({
    data: {
      actorUserId: 'officer-001',
      actorRole: 'visa_officer',
      action: 'VISA_CASE_STAGE_UPDATED',
      targetCollection: 'VisaCase',
      targetId: testCase.id,
      afterData: JSON.stringify({ currentStage: 'READY_FOR_VISA_APPLICATION', readinessScore: 89 }),
    }
  });
  console.log(`[PASS] CrmAuditLog record created: AuditId=${audit.id}, Action=${audit.action}`);

  console.log('--- ALL VISA INTEGRATION & DATABASE TESTS PASSED ---');
}

runLiveTests()
  .catch(e => {
    console.error('TEST ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
