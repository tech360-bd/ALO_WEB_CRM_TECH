import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR') || auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Interview view requires permission' }, { status: 403 });

    const id = context?.params?.id;
    const interview = await db.visaInterview.findUnique({ where: { id }, include: { answers: true } });
    if (!interview) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent && interview.studentId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
    }

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isSuper && !isStudent && isVisa) {
      const visaCase = await db.visaCase.findUnique({ where: { id: interview.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot view interview for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    await logAuditAction(auth, 'VISA_INTERVIEW_VIEW', 'VisaInterview', id, { studentId: interview.studentId, caseId: interview.caseId });

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Interview update requires visa officer — interviews.update' }, { status: 403 });

    const id = context?.params?.id;
    const existing = await db.visaInterview.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) {
      const visaCase = await db.visaCase.findUnique({ where: { id: existing.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot update interview for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { status, overallScore, verdict, officerNotes, studentFeedback, finalAssessment, strengths, weaknesses, improvements, documentsRequired, secondInterview, escalation, readiness } = body;

    // Final result validation — internal workflow NOT visa decision
    const validReadiness = ['READY','NEEDS_PRACTICE','NEEDS_DOCUMENTS','HIGH_RISK','HUMAN_REVIEW_REQUIRED','ready','needs_practice','needs_documents','high_risk','human_review_required'];
    if (readiness && !validReadiness.includes(readiness)) {
      return NextResponse.json({ success: false, error: `Invalid readiness — allowed READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED — internal workflow NOT visa decision` }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (overallScore !== undefined) dataToUpdate.overallScore = overallScore;
    if (verdict !== undefined) dataToUpdate.verdict = verdict;
    if (officerNotes !== undefined) dataToUpdate.officerNotes = officerNotes;
    if (studentFeedback !== undefined) dataToUpdate.studentFeedback = studentFeedback;
    if (finalAssessment !== undefined) dataToUpdate.finalAssessment = finalAssessment;
    if (strengths !== undefined) dataToUpdate.strengths = strengths;
    if (weaknesses !== undefined) dataToUpdate.weaknesses = weaknesses;
    if (improvements !== undefined) dataToUpdate.improvements = improvements;
    if (documentsRequired !== undefined) dataToUpdate.documentsRequired = documentsRequired;
    if (secondInterview !== undefined) dataToUpdate.secondInterview = secondInterview;
    if (escalation !== undefined) dataToUpdate.escalation = escalation;
    if (readiness !== undefined) dataToUpdate.readiness = readiness;

    const updated = await db.visaInterview.update({ where: { id }, data: dataToUpdate });

    await logAuditAction(auth, 'VISA_INTERVIEW_UPDATE', 'VisaInterview', id, { before: existing, after: dataToUpdate, studentId: existing.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: existing.studentId,
        stage: 'VISA_INTERVIEW_UPDATED',
        title: `Interview updated by ${auth.name} — readiness ${readiness || verdict || 'pending'} — score ${overallScore || existing.overallScore || 0}% — final assessment ${finalAssessment ? 'present' : 'pending'}`,
        description: `Human review fields final assessment/strengths/weaknesses/improvements/docs required/second interview/escalation/readiness READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED internal not visa decision — AI preliminary only human final — human responsible`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated, note: 'Final result internal workflow NOT visa decision — AI preliminary only human final — human responsible — scorecard 12 scores AI preliminary only human final' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
