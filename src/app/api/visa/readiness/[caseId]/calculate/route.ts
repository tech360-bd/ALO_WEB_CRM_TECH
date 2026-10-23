import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission } from '@/lib/visa/access';

const COMPLETION_NOTICE = 'Checklist completion indicator only; it is not an eligibility assessment, approval prediction, or guarantee.';

function parseStringList(value: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function auditData(auth: AuthContext, action: string, caseId: string, studentId: string, details: Record<string, unknown>) {
  return { actorUserId: auth.actorUserId, action, entityType: 'VisaCase', entityId: caseId, metadata: JSON.stringify({ studentId, ...details }), ipAddress: '', userAgent: '' };
}

export const POST = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.readiness.update', visaCase)) return NextResponse.json({ success: false, error: 'Assigned case and visa.readiness.update permission required.' }, { status: 403 });

    const [profileSections, passport, academicDocuments, englishTest, application, checklist, funding, studyGap, interviews, riskAssessment] = await Promise.all([
      db.studentProfileSection.findMany({ where: { studentId: visaCase.studentId }, select: { status: true } }),
      db.studentPassport.findFirst({ where: { studentId: visaCase.studentId }, select: { passportNumber: true, expiryDate: true } }),
      db.studentDocument.findMany({ where: { studentId: visaCase.studentId, caseId: { in: [caseId, ''] }, isArchived: false }, select: { category: true, status: true } }),
      db.studentEnglishTest.findFirst({ where: { studentId: visaCase.studentId, overallScore: { gt: 0 } }, orderBy: { createdAt: 'desc' }, select: { id: true } }),
      visaCase.applicationId ? db.application.findUnique({ where: { id: visaCase.applicationId }, select: { offerStatus: true, casI20CoeStatus: true } }) : Promise.resolve(null),
      db.visaChecklistItem.findMany({ where: { caseId, studentId: visaCase.studentId, archivedAt: null }, select: { id: true, isRequired: true, status: true } }),
      db.visaFundingReview.findUnique({ where: { caseId } }),
      db.visaStudyGapReview.findUnique({ where: { caseId } }),
      db.visaInterview.findMany({ where: { caseId, status: 'completed', completedAt: { not: null } }, orderBy: { completedAt: 'desc' }, take: 1, select: { id: true, overallScore: true } }),
      db.visaRiskAssessment.findUnique({ where: { caseId }, select: { officerVerdict: true, humanReviewRequired: true } }),
    ]);

    const completedProfileSections = profileSections.filter((section) => ['complete', 'completed', 'verified'].includes(section.status.toLowerCase())).length;
    const profileScore = profileSections.length ? Math.round((completedProfileSections / profileSections.length) * 10) : 0;
    const expiry = passport?.expiryDate ? Date.parse(passport.expiryDate) : Number.NaN;
    const passportScore = passport?.passportNumber.trim() && Number.isFinite(expiry) && expiry > Date.now() ? 10 : 0;

    const approvedAcademicCategories = new Set(academicDocuments
      .filter((document) => ['approved', 'verified', 'complete'].includes(document.status.toLowerCase()))
      .map((document) => document.category.toLowerCase())
      .filter((category) => /academic|transcript|certificate|education/.test(category)));
    const academicScore = Math.min(10, approvedAcademicCategories.size * 5);
    const englishScore = englishTest ? 10 : 0;
    const offerStatus = (application?.offerStatus || '').toUpperCase();
    const casStatus = (application?.casI20CoeStatus || '').toUpperCase();
    const offerScore = (['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'].includes(offerStatus) ? 5 : 0) + (casStatus === 'RECEIVED' ? 5 : 0);

    const fundingEvidence = [
      Boolean(funding?.sponsorRelation.trim()),
      Boolean(funding?.sourceOfFund.trim()),
      funding?.sourceOfFundExplanation.trim().length >= 20,
      Boolean(funding?.livingCostPlan.trim()),
    ].filter(Boolean).length;
    const fundingScore = Math.round((fundingEvidence / 4) * 15);
    const bankScore = (funding?.hasBankStatement ? 5 : 0) + (funding?.hasSolvencyCert ? 5 : 0);

    const supportingDocumentIds = parseStringList(studyGap?.supportingDocuments);
    const studyGapEvidence = studyGap
      ? (studyGap.hasStudyGap
        ? [Boolean(studyGap.gapPurpose.trim()), studyGap.explanationClarity === 'clear', supportingDocumentIds.length > 0].filter(Boolean).length
        : 3)
      : 0;
    const studyGapScore = studyGap ? Math.round((studyGapEvidence / 3) * 10) : 0;
    const completedInterview = interviews[0] || null;
    const humanInterviewScore = Math.min(100, Math.max(0, Number(completedInterview?.overallScore || 0)));
    const interviewScore = completedInterview ? Math.round((humanInterviewScore / 100) * 10) : 0;
    const riskReviewed = Boolean(riskAssessment && !riskAssessment.humanReviewRequired && ['reviewed', 'completed'].includes(riskAssessment.officerVerdict.toLowerCase()));
    const riskScore = riskReviewed ? 5 : 0;

    const breakdown = {
      profile: { score: profileScore, max: 10 },
      passport: { score: passportScore, max: 10 },
      academic: { score: academicScore, max: 10 },
      english: { score: englishScore, max: 10 },
      offerCas: { score: offerScore, max: 10 },
      funding: { score: fundingScore, max: 15 },
      bankEvidence: { score: bankScore, max: 10 },
      studyHistory: { score: studyGapScore, max: 10 },
      humanInterviewAssessment: { score: interviewScore, max: 10 },
      humanRiskReview: { score: riskScore, max: 5 },
    };
    const overallScore = Object.values(breakdown).reduce((total, component) => total + component.score, 0);
    const requiredChecklist = checklist.filter((item) => item.isRequired);
    const documentsReady = requiredChecklist.filter((item) => ['approved', 'verified', 'complete'].includes(item.status.toLowerCase())).length;
    const documentsTotal = requiredChecklist.length;

    const missing = [
      ...(profileScore < 10 ? ['Complete the profile sections recorded in the portal.'] : []),
      ...(passportScore < 10 ? ['Provide valid passport details for officer review.'] : []),
      ...(academicScore < 10 ? ['Provide approved academic evidence.'] : []),
      ...(englishScore < 10 ? ['Add an English-test record if applicable to this case.'] : []),
      ...(offerScore < 10 ? ['Complete offer/CAS/COE tracking where applicable.'] : []),
      ...(fundingScore < 15 ? ['Complete the funding review with verified source and living-cost details.'] : []),
      ...(bankScore < 10 ? ['Link bank statement and solvency evidence for human review.'] : []),
      ...(studyGapScore < 10 ? ['Complete the study-history review, including an explanation where needed.'] : []),
      ...(interviewScore < 10 ? ['Complete a human-reviewed interview assessment.'] : []),
      ...(riskScore < 5 ? ['Human risk review remains pending.'] : []),
      ...(documentsReady < documentsTotal ? ['Resolve outstanding required checklist items.'] : []),
    ];
    const whatIsStrong = Object.entries(breakdown).filter(([, component]) => component.score === component.max).map(([name]) => `${name} section recorded as complete.`);
    const whatIsWeak = Object.entries(breakdown).filter(([, component]) => component.score < component.max).map(([name]) => `${name} section is incomplete or awaiting human review.`);
    const nextAction = missing[0] || 'Continue the checklist with the assigned visa officer.';
    const responsible = visaCase.visaOfficerName.trim() || 'Assigned visa team';
    const deadline = visaCase.deadline ? visaCase.deadline.toISOString().slice(0, 10) : '';

    const report = await db.$transaction(async (tx) => {
      const saved = await tx.visaReadinessReport.create({
        data: {
          studentId: visaCase.studentId,
          visaCaseId: caseId,
          applicationId: visaCase.applicationId || '',
          overallScore,
          documentsReady,
          documentsTotal,
          interviewReady: Boolean(completedInterview),
          riskFactors: '[]',
          recommendation: COMPLETION_NOTICE,
          breakdown: JSON.stringify({ methodology: 'case-record-completion-v1', components: breakdown }),
          whatIsStrong: JSON.stringify(whatIsStrong),
          whatIsWeak: JSON.stringify(whatIsWeak),
          missing: JSON.stringify(missing),
          nextAction,
          responsible,
          deadline,
        },
      });
      await tx.visaCase.update({ where: { id: caseId }, data: { readinessScore: overallScore, lastUpdated: new Date() } });
      await tx.timelineEvent.create({ data: { studentId: visaCase.studentId, stage: 'VISA_READINESS_UPDATED', title: 'Visa preparation checklist updated.', description: 'A checklist completion indicator was refreshed from recorded case information. It is not an eligibility or outcome decision.', actor: auth.actorUserId } });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_READINESS_CALCULATED', caseId, visaCase.studentId, { overallScore, componentNames: Object.keys(breakdown), missingCount: missing.length }) });
      return saved;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        overallScore,
        documentsReady,
        documentsTotal,
        interviewAssessmentRecorded: Boolean(completedInterview),
        generatedAt: report.generatedAt,
      },
      breakdown,
      whatIsStrong,
      whatIsWeak,
      missing,
      nextAction,
      responsible,
      deadline: deadline || null,
      notice: COMPLETION_NOTICE,
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Readiness could not be calculated from current records; audit or write failure rolled back.' }, { status: 503 });
  }
});
