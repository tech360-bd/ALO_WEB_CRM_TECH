import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, isVisaSuperAdmin, visaCaseViewScope } from '@/lib/visa/access';
import { publishApprovedStudentFeedback, VisaFeedbackError } from '@/lib/visa/student-feedback';

type InterviewAccessResult =
  | { ok: false; response: NextResponse }
  | { ok: true; interview: { id: string; caseId: string; studentId: string }; visaCase: { id: string; studentId: string; visaOfficerId: string | null } };

async function getAssignedInterview(id: unknown, auth: AuthContext): Promise<InterviewAccessResult> {
  if (typeof id !== 'string' || !id) return { ok: false, response: NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 }) };
  const interview = await db.visaInterview.findUnique({ where: { id }, select: { id: true, caseId: true, studentId: true } });
  if (!interview) return { ok: false, response: NextResponse.json({ success: false, error: 'Interview not found.' }, { status: 404 }) };
  const visaCase = await db.visaCase.findUnique({ where: { id: interview.caseId }, select: { id: true, studentId: true, visaOfficerId: true } });
  if (!visaCase || visaCase.studentId !== interview.studentId || visaCaseViewScope(auth, visaCase) !== 'full') {
    return { ok: false, response: NextResponse.json({ success: false, error: 'Assigned case access required.' }, { status: 403 }) };
  }
  return { ok: true, interview, visaCase };
}

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const access = await getAssignedInterview(context?.params?.id, auth);
    if (!access.ok) return access.response;
    const result = await publishApprovedStudentFeedback(auth, access.visaCase, await req.json().catch(() => null));
    return NextResponse.json({ success: true, data: result, externalDelivery: false }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof VisaFeedbackError) return NextResponse.json({ success: false, error: error.message, details: error.details }, { status: error.status });
    return NextResponse.json({ success: false, error: 'Feedback was not sent because the transaction or audit could not be completed.' }, { status: 503 });
  }
});

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const access = await getAssignedInterview(context?.params?.id, auth);
    if (!access.ok) return access.response;
    if (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, 'visa.interviews.view')) return NextResponse.json({ success: false, error: 'visa.interviews.view permission required.' }, { status: 403 });
    const feedback = await db.visaStudentFeedback.findMany({
      where: { caseId: access.visaCase.id, studentId: access.visaCase.studentId, approvedBy: { not: '' } },
      select: { id: true, supportiveText: true, nextSteps: true, missingDocs: true, practiceTips: true, isSentToStudent: true, sentAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_STUDENT_FEEDBACK_VIEW', entityType: 'VisaStudentFeedback', entityId: access.visaCase.id, metadata: JSON.stringify({ studentId: access.visaCase.studentId, count: feedback.length }), ipAddress: '', userAgent: '' } });
    return NextResponse.json({ success: true, data: feedback }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Feedback could not be audited or loaded.' }, { status: 503 });
  }
});
