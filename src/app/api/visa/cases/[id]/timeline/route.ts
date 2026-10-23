import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canViewVisaSensitive, hasVisaPermission, isVisaSuperAdmin, visaCaseViewScope } from '@/lib/visa/access';

function auditData(auth: AuthContext, caseId: string, studentId: string, count: number) {
  return { actorUserId: auth.actorUserId, action: 'VISA_TIMELINE_VIEW', entityType: 'VisaCase', entityId: caseId, metadata: JSON.stringify({ studentId, count }), ipAddress: '', userAgent: '' };
}
function safeTitle(stage: string) {
  const titles: Record<string, string> = {
    VISA_CASE_CREATED: 'Visa preparation case created.',
    VISA_CASE_ASSIGNED: 'Visa officer assignment updated.',
    VISA_STAGE_UPDATED: 'Visa preparation stage updated.',
    VISA_READINESS_UPDATED: 'Visa preparation checklist updated.',
    VISA_INTERVIEW_SCHEDULED: 'Visa preparation interview scheduled.',
    VISA_INTERVIEW_COMPLETED: 'Visa preparation interview completed.',
    VISA_INTERVIEW_ANSWER_RECORDED: 'Visa preparation interview response recorded.',
    VISA_DOCUMENT_REQUESTED: 'Visa checklist updated with a document request.',
    VISA_DOCUMENT_APPROVED: 'A visa document was approved after officer review.',
    VISA_DOCUMENT_REJECTED: 'A visa document review requires a replacement.',
    VISA_DOCUMENT_NEEDS_UPDATE: 'A visa document replacement was requested.',
    VISA_STUDENT_FEEDBACK_SENT: 'Approved preparation feedback shared in the student portal.',
    VISA_FUNDING_REVIEW_UPDATED: 'Restricted funding review updated.',
    VISA_STUDY_GAP_REVIEW_UPDATED: 'Restricted study-history review updated.',
    VISA_REFUSAL_REVIEW_UPDATED: 'Restricted visa-history review updated.',
    VISA_SENSITIVE_REVIEW_UPDATED: 'Restricted visa review updated.',
    VISA_RISK_UPDATED: 'Internal visa risk assessment updated.',
  };
  return titles[stage] || 'Visa case event recorded.';
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.id;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId }, select: { id: true, studentId: true, visaOfficerId: true, counselorId: true, applicationOfficerId: true } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (visaCaseViewScope(auth, visaCase) !== 'full' || (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, 'visa.timeline.view'))) return NextResponse.json({ success: false, error: 'Assigned case and visa.timeline.view permission required.' }, { status: 403 });

    const [events, sensitivePermission, riskPermission, interviewPermission] = await Promise.all([
      db.timelineEvent.findMany({ where: { studentId: visaCase.studentId, stage: { contains: 'VISA_' } }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, stage: true, createdAt: true } }),
      Promise.resolve(canViewVisaSensitive(auth, visaCase)),
      Promise.resolve(isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.risk.view')),
      Promise.resolve(isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.interviews.view')),
    ]);
    const visible = events.filter((event) => {
      const stage = event.stage.toUpperCase();
      if (stage.includes('SENSITIVE')) return sensitivePermission;
      if (stage.includes('RISK') || stage.includes('FUNDING') || stage.includes('STUDY_GAP') || stage.includes('REFUSAL')) return riskPermission;
      if (stage.includes('INTERVIEW')) return interviewPermission;
      if (stage.includes('INTERNAL_NOTE')) return false;
      return true;
    }).map((event) => ({ id: event.id, stage: event.stage, title: safeTitle(event.stage), description: 'Event recorded in the authorized visa workflow. Internal notes and source content are not included in this timeline view.', createdAt: event.createdAt }));
    await db.portalAuditLog.create({ data: auditData(auth, caseId, visaCase.studentId, visible.length) });
    return NextResponse.json({ success: true, events: visible }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa timeline could not be audited or loaded.' }, { status: 503 });
  }
});
