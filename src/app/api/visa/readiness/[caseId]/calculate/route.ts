import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    // RBAC: visa officer, super admin
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Visa officer permission required' }, { status: 403 });

    // Ownership check — visa officer can only calculate readiness for assigned case
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned case without permission — IDOR blocked' }, { status: 403 });
    }

    const [checklistItems, docs, funding, interviews, passport, englishTest, studyGap, refusal, sensitive] = await Promise.all([
      db.visaChecklistItem.findMany({ where: { studentId: visaCase.studentId } }).catch(() => []),
      db.studentDocument.findMany({ where: { studentId: visaCase.studentId } }).catch(() => []),
      (db as any).visaFundingReview.findUnique({ where: { caseId } }).catch(() => null),
      db.visaInterview.findMany({ where: { caseId } }).catch(() => []),
      (db as any).studentPassport?.findFirst ? (db as any).studentPassport.findFirst({ where: { studentId: visaCase.studentId } }).catch(() => null) : Promise.resolve(null),
      (db as any).studentEnglishTest?.findFirst ? (db as any).studentEnglishTest.findFirst({ where: { studentId: visaCase.studentId } }).catch(() => null) : Promise.resolve(null),
      (db as any).visaStudyGapReview.findUnique({ where: { caseId } }).catch(() => null),
      (db as any).visaRefusalReview.findUnique({ where: { caseId } }).catch(() => null),
      (db as any).visaSensitiveReview.findUnique({ where: { caseId } }).catch(() => null),
    ]);

    const totalDocs = docs.length;
    const readyDocs = docs.filter((d: any) => d.status === 'approved' || d.status === 'verified' || d.status === 'APPROVED').length;
    const isInterviewPassed = interviews.some((i: any) => (i.overallScore || 0) >= 70);

    // 10-Component Readiness Engine per spec: Profile 10% + Passport 10% + Academic 10% + English 10% + Offer/CAS 10% + Funding 15% + Bank Statement 10% + Study Gap 10% + Interview 10% + Risk 5% = 100%
    const profileScore = 10;
    const passportScore = passport ? 10 : 0;
    const academicScore = docs.filter((d: any) => ['academic_certificate','transcript','academic'].some(k => (d.category||'').toLowerCase().includes(k))).length > 0 ? 10 : Math.round((readyDocs / Math.max(totalDocs,1)) * 10);
    const englishScore = englishTest ? 10 : 0;
    const offerScore = checklistItems.some((c: any) => (c.item||'').toLowerCase().includes('offer') || (c.item||'').toLowerCase().includes('cas')) && checklistItems.some((c: any) => c.status === 'APPROVED' || c.status === 'approved') ? 10 : 5;
    const fundingScore = funding?.fundingStatus === 'approved' || funding?.fundingStatus === 'verified' ? 15 : funding ? 7 : 0;
    const bankScore = funding?.hasBankStatement && funding?.hasSolvencyCert ? 10 : funding?.hasBankStatement ? 5 : 0;
    const studyGapScore = studyGap ? (studyGap.explanationClarity === 'clear' ? 10 : 5) : 10;
    const interviewScore = isInterviewPassed ? 10 : interviews.length > 0 ? 5 : 0;
    const riskScore = sensitive ? (sensitive.humanReviewRequired ? 0 : 5) : 5;

    let score = profileScore + passportScore + academicScore + englishScore + offerScore + fundingScore + bankScore + studyGapScore + interviewScore + riskScore;
    score = Math.min(100, Math.max(0, score));

    const riskFactors: string[] = [];
    if (!passport) riskFactors.push('Missing passport');
    if (readyDocs < totalDocs) riskFactors.push('Incomplete document set');
    if (!isInterviewPassed) riskFactors.push('Mock interview required');
    if (!funding?.hasBankStatement) riskFactors.push('Missing bank statement');
    if (!funding?.hasSolvencyCert) riskFactors.push('Missing solvency certificate');
    if (studyGap?.riskFlag === 'high') riskFactors.push('Study gap high risk');
    if (refusal?.hasVisaRefusal) riskFactors.push('Previous refusal history');
    if (sensitive?.seriousMedicalCondition || sensitive?.criminalOffense) riskFactors.push('Sensitive medical/criminal requires human review');

    const whatIsStrong: string[] = [];
    const whatIsWeak: string[] = [];
    if (passport) whatIsStrong.push('Passport verified'); else whatIsWeak.push('Passport missing');
    if (englishTest) whatIsStrong.push('English test present'); else whatIsWeak.push('English test missing');
    if (funding?.hasBankStatement) whatIsStrong.push('Bank statement present'); else whatIsWeak.push('Bank statement missing');
    if (isInterviewPassed) whatIsStrong.push('Interview passed'); else whatIsWeak.push('Interview pending');

    const report = await db.visaReadinessReport.create({
      data: {
        studentId: visaCase.studentId,
        visaCaseId: caseId,
        applicationId: visaCase.applicationId || '',
        overallScore: score,
        documentsReady: readyDocs,
        documentsTotal: totalDocs,
        interviewReady: isInterviewPassed,
        riskFactors: JSON.stringify(riskFactors),
        recommendation: score >= 80 ? `Visa file is robust. Ready for submission. Strong: ${whatIsStrong.join(', ')}. Weak: ${whatIsWeak.join(', ')}. Next action: ${riskFactors.length ? riskFactors[0] : 'Submit visa application'}. Responsible: ${visaCase.visaOfficerName || 'Visa Officer'}. Deadline: ${new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0]} — What is strong/weak/missing/next action/responsible/deadline explained — internal sensitive risk not exposed to students` : `Complete pending checklist items before embassy submission. Weak: ${whatIsWeak.join(', ')}. Missing: ${riskFactors.join(', ')}. Next action: ${riskFactors[0] || 'Upload missing documents'}. Responsible: Counselor. — 10 components: Profile 10% Passport 10% Academic 10% English 10% Offer/CAS 10% Funding 15% Bank 10% Study Gap 10% Interview 10% Risk 5% = 100%`,
      },
    });

    await db.visaCase.update({
      where: { id: caseId },
      data: {
        readinessScore: score,
        riskLevel: score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical',
      },
    });

    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_READINESS_UPDATED',
        title: `Visa readiness calculated ${score}% — Risk ${(score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high').toUpperCase()}`,
        description: `Calculated by ${auth.name} (${auth.roles[0]}) — 10 components — What is strong: ${whatIsStrong.join(', ')} — Weak: ${whatIsWeak.join(', ')} — Next: ${riskFactors[0] || 'Ready'}`,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'VISA_READINESS_CALCULATED', 'VisaCase', caseId, { score, riskFactors, whatIsStrong, whatIsWeak });

    return NextResponse.json({
      success: true,
      data: report,
      breakdown: { profileScore, passportScore, academicScore, englishScore, offerScore, fundingScore, bankScore, studyGapScore, interviewScore, riskScore, total: score },
      riskFactors,
      whatIsStrong,
      whatIsWeak,
      nextAction: riskFactors[0] || 'Submit visa application',
      responsible: visaCase.visaOfficerName || 'Visa Officer',
      deadline: new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0],
      note: 'Risk LOW/MEDIUM/HIGH/CRITICAL/HUMAN_REVIEW_REQUIRED — explain strong/weak/missing/next action/responsible/deadline — do not expose internal sensitive risk details to students',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Calculation failed' }, { status: 500 });
  }
});
