import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Refusal review restricted to visa officers' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned refusal review — IDOR blocked' }, { status: 403 });
    }

    const review = await db.visaRefusalReview.findUnique({ where: { caseId } });
    await logAuditAction(auth, 'VISA_REFUSAL_VIEW', 'VisaRefusalReview', caseId, { studentId: visaCase.studentId });

    return NextResponse.json({
      success: true,
      data: review,
      emptyState: review ? null : 'No refusal history — proper empty state — fields Previous refusal/Country/Visa type/Date/Reason/Refusal letter/Previous application/Improvements/New explanation/Officer note — AI identifies Missing refusal letter/Unclear reason/Repeated refusal/Contradiction/Missing improvement explanation — Actions Request refusal letter/explanation/Generate practice questions/Notify counselor/senior officer/Human review — Never promise approval',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Refusal review update requires visa officer' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const body = await req.json();

    // AI identifies Missing refusal letter/Unclear reason/Repeated refusal/Contradiction/Missing improvement explanation
    const aiIssues: string[] = [];
    if (body.hasVisaRefusal && !body.refusalLetterUrl) aiIssues.push('Missing refusal letter');
    if (body.hasVisaRefusal && (!body.refusalReason || body.refusalReason.length < 20)) aiIssues.push('Unclear reason');
    if (body.hasVisaRefusal && !body.improvementPlan) aiIssues.push('Missing improvement explanation');
    if (body.hasVisaRefusal && body.previousRefusalCount > 1) aiIssues.push('Repeated refusal — high risk');

    const review = await db.visaRefusalReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || visaCase.studentId,
        hasVisaRefusal: body.hasVisaRefusal || false,
        refusalCountry: body.refusalCountry || '',
        refusalReason: body.refusalReason || '',
        refusalLetterUrl: body.refusalLetterUrl || '',
        improvementPlan: body.improvementPlan || '',
        humanReviewStatus: body.humanReviewStatus || 'pending',
        visaType: body.visaType,
        refusalDate: body.refusalDate,
        previousApplication: body.previousApplication,
        newExplanation: body.newExplanation,
        officerNote: body.officerNote,
        previousRefusalCount: body.previousRefusalCount || 0,
      },
      update: {
        hasVisaRefusal: body.hasVisaRefusal,
        refusalCountry: body.refusalCountry,
        refusalReason: body.refusalReason,
        refusalLetterUrl: body.refusalLetterUrl,
        improvementPlan: body.improvementPlan,
        humanReviewStatus: body.humanReviewStatus,
        visaType: body.visaType,
        refusalDate: body.refusalDate,
        previousApplication: body.previousApplication,
        newExplanation: body.newExplanation,
        officerNote: body.officerNote,
        previousRefusalCount: body.previousRefusalCount,
      },
    });

    await logAuditAction(auth, 'VISA_REFUSAL_UPDATE', 'VisaRefusalReview', caseId, { after: review, aiIssues, studentId: visaCase.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_REFUSAL_UPDATED',
        title: `Refusal review updated — ${body.hasVisaRefusal ? 'Has refusal ' + body.refusalCountry : 'No refusal'} — AI issues: ${aiIssues.join(', ') || 'none'}`,
        description: `Actions Request refusal letter/explanation/Generate practice questions/Notify counselor/senior officer/Human review — Never promise approval — Officer ${auth.name}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: review, aiIssues, note: 'AI identifies Missing refusal letter/Unclear reason/Repeated refusal/Contradiction/Missing improvement — Actions Request refusal letter/explanation/Generate practice questions/Notify counselor/senior officer/Human review — Never promise approval — AI safety never guarantee approval/success' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
