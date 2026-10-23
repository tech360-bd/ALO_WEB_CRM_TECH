import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission } from '@/lib/visa/access';

const schema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'critical', 'human_review_required']),
  reason: z.string().trim().min(3).max(500),
}).strict();

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Valid risk level and reason required.', details: parsed.error.flatten() }, { status: 400 });
    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canManageVisaPermission(auth, 'visa.risk.update', existing)) {
      return NextResponse.json({ success: false, error: 'Assigned case and visa.risk.update permission required.' }, { status: 403 });
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.visaCase.update({ where: { id }, data: { riskLevel: parsed.data.riskLevel, lastUpdated: new Date() } });
      await tx.visaRiskAssessment.upsert({
        where: { caseId: id },
        create: {
          caseId: id,
          studentId: existing.studentId,
          fundingRisk: 'not_assessed',
          studyGapRisk: 'not_assessed',
          refusalRisk: 'not_assessed',
          sensitiveRisk: 'not_assessed',
          overallRiskLevel: parsed.data.riskLevel,
          officerVerdict: 'reviewed',
          humanReviewRequired: ['high', 'critical', 'human_review_required'].includes(parsed.data.riskLevel),
        },
        update: {
          overallRiskLevel: parsed.data.riskLevel,
          officerVerdict: 'reviewed',
          humanReviewRequired: ['high', 'critical', 'human_review_required'].includes(parsed.data.riskLevel),
        },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_RISK_UPDATE', entityType: 'VisaCase', entityId: id, metadata: JSON.stringify({ studentId: existing.studentId, before: { riskLevel: existing.riskLevel }, after: { riskLevel: parsed.data.riskLevel }, reason: parsed.data.reason }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({
        data: { studentId: existing.studentId, stage: 'VISA_RISK_UPDATED', title: 'Internal visa risk assessment updated.', description: `Internal assessment changed to ${parsed.data.riskLevel}; human review remains required.`, actor: auth.actorUserId },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: updated, note: 'Internal workflow risk label only; not a visa decision.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[visa-risk] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update visa risk.' }, { status: 500 });
  }
});
