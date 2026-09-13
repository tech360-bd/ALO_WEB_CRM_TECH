import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

const VALID_STAGES = ['NOT_STARTED','DOCUMENT_COLLECTION','DOCUMENT_REVIEW','FUNDING_REVIEW','STUDY_GAP_REVIEW','REFUSAL_REVIEW','INTERVIEW_PREP','AI_INTERVIEW','HUMAN_INTERVIEW','READINESS_CHECK','SENIOR_REVIEW','READY_FOR_SUBMISSION','SUBMITTED','DECISION_PENDING','APPROVED','REFUSED','CLOSED','READY','NEEDS_PRACTICE','NEEDS_DOCUMENTS','HIGH_RISK','HUMAN_REVIEW_REQUIRED'];

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Stage update requires visa officer permission — cases.stage.update' }, { status: 403 });

    const id = context?.params?.id;
    const { stage, reason } = await req.json();

    if (!VALID_STAGES.includes(stage)) {
      return NextResponse.json({ success: false, error: `Invalid stage — allowed: ${VALID_STAGES.join(', ')} — pipeline 16 stages NOT_STARTED→CLOSED — internal READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED NOT visa decision` }, { status: 400 });
    }

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && existing.visaOfficerId && existing.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot update stage of unassigned case — IDOR blocked' }, { status: 403 });
    }

    const updated = await db.visaCase.update({ where: { id }, data: { currentStage: stage } });

    await db.timelineEvent.create({
      data: {
        studentId: updated.studentId || '',
        stage: 'VISA_STAGE_UPDATED',
        title: `Visa Stage Updated to ${stage} by ${auth.name} — reason ${reason || 'officer decision'}`,
        description: `Stage changed from ${existing.currentStage} to ${stage} — pipeline 16 stages NOT_STARTED→CLOSED — internal READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED NOT visa decision — human responsible`,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'VISA_STAGE_UPDATE', 'VisaCase', id, { before: { stage: existing.currentStage }, after: { stage }, reason, studentId: existing.studentId });

    return NextResponse.json({ success: true, data: updated, note: 'Pipeline 16 stages NOT_STARTED→CLOSED — internal READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED internal workflow not visa decision' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
