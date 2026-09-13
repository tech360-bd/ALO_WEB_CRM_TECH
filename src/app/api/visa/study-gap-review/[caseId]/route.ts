import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Study gap review permission required' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const review = await db.visaStudyGapReview.findUnique({ where: { caseId } });
    await logAuditAction(auth, 'VISA_STUDY_GAP_VIEW', 'VisaStudyGapReview', caseId, { studentId: visaCase.studentId });

    return NextResponse.json({
      success: true,
      data: review,
      emptyState: review ? null : 'No study gap review — proper empty state — fields Study Gap/From/To/Duration/Purpose/Employment/Training/Family/Medical/Visa Reason/Supporting Documents — AI checks Duration/Explanation/Evidence/Career relevance/Course relevance/Education/work consistency — actions Request explanation/document/Generate questions/Notify counselor/High-risk flag',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Study gap update requires visa officer' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const body = await req.json();

    // AI checks: Duration/Explanation/Evidence/Career relevance/Course relevance/Education/work consistency
    const aiChecks: string[] = [];
    if ((body.gapDurationMonths || 0) > 24) aiChecks.push('Long gap >24 months requires detailed explanation');
    if (!body.gapPurpose || body.gapPurpose.length < 20) aiChecks.push('Gap purpose explanation unclear');
    if (!body.workExpDuringGap && body.hasStudyGap) aiChecks.push('Evidence of work/training during gap missing');
    if (body.gapPurpose && !body.gapPurpose.toLowerCase().includes('work') && !body.gapPurpose.toLowerCase().includes('train') && body.gapDurationMonths > 6) aiChecks.push('Career relevance not explained');

    const review = await db.visaStudyGapReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || visaCase.studentId,
        hasStudyGap: body.hasStudyGap || false,
        gapDurationMonths: body.gapDurationMonths || 0,
        gapPurpose: body.gapPurpose || '',
        workExpDuringGap: body.workExpDuringGap || '',
        explanationClarity: body.explanationClarity || 'clear',
        riskFlag: aiChecks.length > 1 ? 'high' : body.riskFlag || 'low',
        gapFrom: body.gapFrom,
        gapTo: body.gapTo,
        supportingDocuments: body.supportingDocuments,
        employmentDetails: body.employmentDetails,
        trainingDetails: body.trainingDetails,
        familyReason: body.familyReason,
        medicalReason: body.medicalReason,
        visaReason: body.visaReason,
      },
      update: {
        hasStudyGap: body.hasStudyGap,
        gapDurationMonths: body.gapDurationMonths,
        gapPurpose: body.gapPurpose,
        workExpDuringGap: body.workExpDuringGap,
        explanationClarity: body.explanationClarity,
        riskFlag: aiChecks.length > 1 ? 'high' : body.riskFlag,
        gapFrom: body.gapFrom,
        gapTo: body.gapTo,
        supportingDocuments: body.supportingDocuments,
        employmentDetails: body.employmentDetails,
        trainingDetails: body.trainingDetails,
        familyReason: body.familyReason,
        medicalReason: body.medicalReason,
        visaReason: body.visaReason,
      },
    });

    await logAuditAction(auth, 'VISA_STUDY_GAP_UPDATE', 'VisaStudyGapReview', caseId, { after: review, aiChecks, studentId: visaCase.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_STUDY_GAP_UPDATED',
        title: `Study gap review updated — ${body.hasStudyGap ? body.gapDurationMonths + ' months gap' : 'No gap'} — risk ${review.riskFlag}`,
        description: `AI checks Duration/Explanation/Evidence/Career relevance/Course relevance/Education/work consistency — ${aiChecks.join(', ') || 'No issues'} — Actions Request explanation/document/Generate questions/Notify counselor/High-risk flag`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: review, aiChecks, note: 'Study Gap fields + AI checks Duration/Explanation/Evidence/Career relevance/Course relevance/Education/work consistency — actions request explanation/document/generate questions/notify counselor/high-risk flag' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
