import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { safeVisaCaseStage, safeVisaCaseSummary, visaCaseListScope, visaCaseViewScope } from '@/lib/visa/access';

function auditData(auth: AuthContext, action: string, entityId: string, studentId: string) {
  return { actorUserId: auth.actorUserId, action, entityType: 'VisaCase', entityId, metadata: JSON.stringify({ studentId, viewScope: action === 'VISA_COUNSELOR_SUMMARY_VIEW' ? 'summary' : 'stage' }), ipAddress: '', userAgent: '' };
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    if (!caseId && !studentId) return NextResponse.json({ success: false, error: 'caseId or studentId is required.' }, { status: 400 });

    let visaCase: any;
    if (caseId) {
      visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    } else {
      const scope = visaCaseListScope(auth);
      if (!scope) return NextResponse.json({ success: false, error: 'Assigned visa-summary permission is required.' }, { status: 403 });
      visaCase = await db.visaCase.findFirst({ where: { AND: [scope.where, { studentId: studentId! }] }, orderBy: { createdAt: 'desc' } });
    }
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found in the assigned scope.' }, { status: 404 });

    const viewScope = visaCaseViewScope(auth, visaCase);
    if (!viewScope) return NextResponse.json({ success: false, error: 'Visa case is outside this account’s assigned scope.' }, { status: 403 });

    const [checklist, feedback] = await Promise.all([
      viewScope === 'summary' ? db.visaChecklistItem.findMany({
        where: { caseId: visaCase.id, studentId: visaCase.studentId, counselorVisible: true, archivedAt: null },
        select: { id: true, item: true, documentName: true, category: true, isRequired: true, status: true, priority: true, deadline: true, updatedAt: true },
        orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
      }) : Promise.resolve([]),
      viewScope === 'summary' ? db.visaStudentFeedback.findMany({
        where: { caseId: visaCase.id, studentId: visaCase.studentId, approvedBy: { not: '' } },
        select: { id: true, supportiveText: true, nextSteps: true, missingDocs: true, practiceTips: true, isSentToStudent: true, sentAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }) : Promise.resolve([]),
    ]);

    const safeCase = viewScope === 'stage' ? safeVisaCaseStage(visaCase) : safeVisaCaseSummary(visaCase);
    const blockingItems = checklist.filter((item) => item.isRequired && !['approved', 'verified', 'complete'].includes(item.status.toLowerCase()));
    const readiness = viewScope === 'summary' ? {
      status: checklist.length === 0 ? 'not_assessed' : blockingItems.length > 0 ? 'preparation_in_progress' : 'ready_for_officer_review',
      requiredItemsPending: blockingItems.length,
      checklistItems: checklist.length,
    } : undefined;

    try {
      await db.portalAuditLog.create({ data: auditData(auth, viewScope === 'summary' ? 'VISA_COUNSELOR_SUMMARY_VIEW' : 'VISA_APPLICATION_STAGE_VIEW', visaCase.id, visaCase.studentId) });
    } catch {
      return NextResponse.json({ success: false, error: 'Visa summary access could not be audited.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      case: safeCase,
      ...(viewScope === 'summary' ? {
        readiness,
        checklist,
        approvedStudentFeedback: feedback.map((item) => ({
          ...item,
          missingDocs: (() => { try { const parsed = JSON.parse(item.missingDocs || '[]'); return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : []; } catch { return []; } })(),
        })),
      } : {}),
      viewScope,
      privacy: 'Only assigned-scope case, counselor-visible checklist metadata, and approved student-safe feedback are included. Financial, refusal, medical/criminal, internal notes, interview answers, documents, and private timeline details are excluded.',
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Counselor visa summary is temporarily unavailable.' }, { status: 503 });
  }
});
