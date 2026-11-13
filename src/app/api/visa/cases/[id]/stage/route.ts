import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canUpdateVisaCase } from '@/lib/visa/access';

const VALID_STAGES = ['not_started', 'visa_checklist_created', 'documents_requested', 'documents_uploaded', 'documents_under_review', 'missing_documents', 'ai_interview_pending', 'ai_interview_completed', 'officer_review_pending', 'officer_feedback_sent', 'ready_for_visa_application', 'visa_submitted', 'decision_pending', 'case_closed'];
const schema = z.object({ stage: z.string().trim().min(1).max(80), reason: z.string().trim().min(3).max(180) }).strict();

function auditData(auth: AuthContext, action: string, id: string, metadata: Record<string, unknown>) {
  return { actorUserId: auth.actorUserId, action, entityType: 'VisaCase', entityId: id, metadata: JSON.stringify(metadata), ipAddress: '', userAgent: '' };
}

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Stage and a 3–180 character reason are required.', details: parsed.error.flatten() }, { status: 400 });
    const stage = parsed.data.stage.toLowerCase().replace(/[\s-]+/g, '_');
    if (!VALID_STAGES.includes(stage)) return NextResponse.json({ success: false, error: 'Invalid visa preparation stage.' }, { status: 400 });

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canUpdateVisaCase(auth, existing)) return NextResponse.json({ success: false, error: 'Assigned case and visa.cases.update permission required.' }, { status: 403 });

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.visaCase.update({ where: { id }, data: { currentStage: stage, lastUpdated: new Date() } });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_STAGE_UPDATE', id, { studentId: existing.studentId, before: { stage: existing.currentStage }, after: { stage }, reason: parsed.data.reason }) });
      await tx.timelineEvent.create({
        data: { studentId: existing.studentId, stage: 'VISA_STAGE_UPDATED', title: 'Visa preparation stage updated.', description: `${existing.currentStage} → ${stage}. Reason recorded. This is an internal preparation status, not a visa decision.`, actor: auth.actorUserId },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: { id: updated.id, caseCode: updated.caseCode, currentStage: updated.currentStage, updatedAt: updated.updatedAt, lastUpdated: updated.lastUpdated }, note: 'Internal visa preparation workflow status; never a visa guarantee or automated decision.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[visa-stage] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update visa stage.' }, { status: 500 });
  }
});
