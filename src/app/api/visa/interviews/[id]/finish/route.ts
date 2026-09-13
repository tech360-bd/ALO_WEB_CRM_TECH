import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Finish interview requires visa officer — interviews.finish' }, { status: 403 });

    const id = context?.params?.id;
    const existing = await db.visaInterview.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) {
      const visaCase = await db.visaCase.findUnique({ where: { id: existing.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot finish interview for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { overallScore, verdict, officerNotes, finalAssessment, strengths, weaknesses, improvements, documentsRequired, secondInterview, escalation, readiness } = body;

    const validVerdicts = ['READY','NEEDS_PRACTICE','NEEDS_DOCUMENTS','HIGH_RISK','HUMAN_REVIEW_REQUIRED','ready','needs_practice','needs_documents','high_risk','human_review_required'];
    if (readiness && !validVerdicts.includes(readiness)) {
      return NextResponse.json({ success: false, error: 'Invalid readiness — allowed READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED internal not visa decision' }, { status: 400 });
    }

    const updated = await db.visaInterview.update({
      where: { id },
      data: {
        overallScore: overallScore || 0,
        verdict: verdict || readiness || 'HUMAN_REVIEW_REQUIRED',
        officerNotes: officerNotes || '',
        finalAssessment: finalAssessment || '',
        strengths: strengths || '',
        weaknesses: weaknesses || '',
        improvements: improvements || '',
        documentsRequired: documentsRequired || '',
        secondInterview: secondInterview || false,
        escalation: escalation || false,
        readiness: readiness || verdict || 'HUMAN_REVIEW_REQUIRED',
        status: 'completed',
        completedAt: new Date(),
      } as any,
    });

    // Update visa case readiness if score provided
    if (overallScore) {
      await db.visaCase.update({
        where: { id: existing.caseId },
        data: { readinessScore: overallScore, currentStage: readiness === 'READY' ? 'READY_FOR_SUBMISSION' : existing.caseId ? undefined : undefined },
      }).catch(() => {});
    }

    await logAuditAction(auth, 'VISA_INTERVIEW_FINISH', 'VisaInterview', id, { overallScore, verdict, readiness, finalAssessment, studentId: existing.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_INTERVIEW_COMPLETED',
        title: `Visa interview completed — score ${overallScore || 0}% — readiness ${readiness || verdict || 'HUMAN_REVIEW_REQUIRED'} — by ${auth.name}`,
        description: `Final result internal workflow status NOT visa decision — final assessment/strengths/weaknesses/improvements/docs required/second interview/escalation/readiness READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED — AI preliminary only human final — human responsible — officer ${auth.name}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Final result internal workflow status NOT visa decision — Q. Final Result — final assessment/strengths/weaknesses/improvements/docs required/second interview/escalation/readiness READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED internal not visa decision — AI preliminary only human final' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
