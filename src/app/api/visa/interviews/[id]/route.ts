import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { loadAuthorizedVisaInterview } from '@/lib/visa/interview-access';

const updateSchema = z.object({
  interviewType: z.enum(['embassy_mock', 'credibility', 'pre_cas', 'university', 'sponsor', 'study_gap', 'refusal', 'english', 'final_readiness']).optional(),
  difficulty: z.enum(['basic', 'standard', 'strict', 'high_risk_review']).optional(),
  language: z.enum(['english', 'bangla', 'banglish']).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'cancelled']).optional(),
}).strict();

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaInterview(auth, id, 'visa.interviews.view');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    const interview = await db.visaInterview.findUnique({ where: { id }, include: { answers: true, questions: true } });
    if (!interview) return NextResponse.json({ success: false, error: 'Visa interview not found.' }, { status: 404 });
    await db.portalAuditLog.create({
      data: { actorUserId: auth.actorUserId, action: 'VISA_INTERVIEW_VIEW', entityType: 'VisaInterview', entityId: id, metadata: JSON.stringify({ studentId: access.visaCase.studentId, caseId: access.visaCase.id }), ipAddress: '', userAgent: '' },
    });
    return NextResponse.json({ success: true, data: interview }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview view could not be audited or loaded.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaInterview(auth, id, 'visa.interviews.update');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) return NextResponse.json({ success: false, error: 'Invalid interview scheduling update.', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });
    const { scheduledAt, ...fields } = parsed.data;
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.visaInterview.update({ where: { id }, data: { ...fields, ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}) } });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_INTERVIEW_UPDATE', entityType: 'VisaInterview', entityId: id, metadata: JSON.stringify({ studentId: access.visaCase.studentId, caseId: access.visaCase.id, changedFields: Object.keys(parsed.data), before: { status: access.interview.status, scheduledAt: access.interview.scheduledAt }, after: parsed.data }), ipAddress: '', userAgent: '' },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: updated }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview update failed; any audit failure rolled back.' }, { status: 503 });
  }
});
