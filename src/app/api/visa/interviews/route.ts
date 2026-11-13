import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, visaCaseListScope, visaCaseViewScope } from '@/lib/visa/access';

const interviewTypes = ['embassy_mock', 'credibility', 'pre_cas', 'university', 'sponsor', 'study_gap', 'refusal', 'english', 'final_readiness'] as const;
const schema = z.object({
  caseId: z.string().trim().min(1).max(191),
  interviewType: z.enum(interviewTypes).default('embassy_mock'),
  difficulty: z.enum(['basic', 'standard', 'strict', 'high_risk_review']).default('standard'),
  language: z.enum(['english', 'bangla', 'banglish']).default('english'),
  scheduledAt: z.string().datetime().optional(),
}).strict();

function auditData(auth: AuthContext, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  return { actorUserId: auth.actorUserId, action, entityType, entityId, metadata: JSON.stringify(metadata), ipAddress: '', userAgent: '' };
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    if (!hasVisaPermission(auth, 'visa.interviews.view')) return NextResponse.json({ success: false, error: 'visa.interviews.view permission required.' }, { status: 403 });
    const scope = visaCaseListScope(auth);
    if (!scope || scope.viewScope !== 'full') return NextResponse.json({ success: false, error: 'Interview transcripts are limited to authorized visa staff and administrators.' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const requestedStudentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    let caseIds: string[];
    if (caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: caseId }, select: { id: true, studentId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
      if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
      if (visaCaseViewScope(auth, visaCase) !== 'full') return NextResponse.json({ success: false, error: 'Visa case is outside this account’s assigned scope.' }, { status: 403 });
      caseIds = [visaCase.id];
    } else {
      const cases = await db.visaCase.findMany({
        where: { ...scope.where, ...(requestedStudentId ? { studentId: requestedStudentId } : {}) },
        select: { id: true },
      });
      caseIds = cases.map((visaCase) => visaCase.id);
      if (requestedStudentId && !caseIds.length) return NextResponse.json({ success: false, error: 'No assigned visa case found for this student.' }, { status: 404 });
    }

    const where: any = { caseId: { in: caseIds } };
    if (status) where.status = status;
    const interviews = caseIds.length ? await db.visaInterview.findMany({ where, orderBy: { scheduledAt: 'desc' }, include: { answers: true, questions: true } }) : [];
    try {
      await db.portalAuditLog.create({ data: auditData(auth, 'VISA_INTERVIEWS_VIEW', 'VisaInterview', caseId || 'assigned-list', { count: interviews.length, caseCount: caseIds.length }) });
    } catch {
      return NextResponse.json({ success: false, error: 'Interview view could not be audited.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, data: interviews, emptyState: interviews.length ? null : 'No assigned visa interviews.' }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch (error) {
    console.error('[visa-interviews] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to fetch visa interviews.' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    if (!hasVisaPermission(auth, 'visa.interviews.create')) return NextResponse.json({ success: false, error: 'visa.interviews.create permission required.' }, { status: 403 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid visa interview request.', details: parsed.error.flatten() }, { status: 400 });

    const visaCase = await db.visaCase.findUnique({ where: { id: parsed.data.caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (visaCaseViewScope(auth, visaCase) !== 'full') return NextResponse.json({ success: false, error: 'Interview can only be scheduled for an assigned visa case.' }, { status: 403 });

    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : new Date();
    const interview = await db.$transaction(async (tx) => {
      const created = await tx.visaInterview.create({
        data: {
          caseId: visaCase.id,
          studentId: visaCase.studentId,
          interviewType: parsed.data.interviewType,
          difficulty: parsed.data.difficulty,
          language: parsed.data.language,
          status: 'scheduled',
          scheduledAt,
          officerId: auth.userId,
        },
      });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_INTERVIEW_CREATE', 'VisaInterview', created.id, { caseId: visaCase.id, studentId: visaCase.studentId, interviewType: created.interviewType, scheduledAt: created.scheduledAt }) });
      await tx.timelineEvent.create({
        data: { studentId: visaCase.studentId, stage: 'VISA_INTERVIEW_SCHEDULED', title: 'Visa preparation interview scheduled.', description: `Interview type ${created.interviewType}; a preparation session, not an embassy interview or visa decision.`, actor: auth.actorUserId },
      });
      return created;
    });
    return NextResponse.json({ success: true, data: interview }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[visa-interviews] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to schedule visa interview.' }, { status: 500 });
  }
});
