import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, safeVisaCaseStage, safeVisaCaseSummary, visaCaseViewScope } from '@/lib/visa/access';

function auditData(auth: AuthContext, caseId: string, studentId: string, hasReport: boolean) {
  return { actorUserId: auth.actorUserId, action: 'VISA_READINESS_VIEW', entityType: 'VisaReadinessReport', entityId: caseId, metadata: JSON.stringify({ studentId, hasReport }), ipAddress: '', userAgent: '' };
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    if (typeof caseId !== 'string' || !caseId) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    const scope = visaCaseViewScope(auth, visaCase);
    if (!scope) return NextResponse.json({ success: false, error: 'Visa case is outside this account’s assigned scope.' }, { status: 403 });

    if (scope === 'stage') {
      try { await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_READINESS_STAGE_VIEW', entityType: 'VisaCase', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId }), ipAddress: '', userAgent: '' } }); }
      catch { return NextResponse.json({ success: false, error: 'Visa stage view could not be audited.' }, { status: 503 }); }
      return NextResponse.json({ success: true, data: safeVisaCaseStage(visaCase), viewScope: scope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
    }

    if (scope === 'summary') {
      const checklist = await db.visaChecklistItem.findMany({
        where: { caseId, studentId: visaCase.studentId, counselorVisible: true, archivedAt: null },
        select: { id: true, item: true, documentName: true, category: true, isRequired: true, status: true, deadline: true, updatedAt: true },
        orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
      });
      const pending = checklist.filter((item) => item.isRequired && !['approved', 'verified', 'complete'].includes(item.status.toLowerCase())).length;
      try { await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_READINESS_SUMMARY_VIEW', entityType: 'VisaCase', entityId: caseId, metadata: JSON.stringify({ studentId: visaCase.studentId, checklistCount: checklist.length }) , ipAddress: '', userAgent: '' } }); }
      catch { return NextResponse.json({ success: false, error: 'Readiness summary could not be audited.' }, { status: 503 }); }
      return NextResponse.json({ success: true, data: { case: safeVisaCaseSummary(visaCase), checklist, readinessStatus: checklist.length === 0 ? 'not_assessed' : pending ? 'preparation_in_progress' : 'ready_for_officer_review', pendingRequiredItems: pending }, viewScope: scope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
    }

    if (!hasVisaPermission(auth, 'visa.readiness.view')) return NextResponse.json({ success: false, error: 'visa.readiness.view permission required.' }, { status: 403 });
    const report = await db.visaReadinessReport.findFirst({ where: { visaCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    try { await db.portalAuditLog.create({ data: auditData(auth, caseId, visaCase.studentId, Boolean(report)) }); }
    catch { return NextResponse.json({ success: false, error: 'Readiness view could not be audited.' }, { status: 503 }); }

    let currentMethodology = false;
    let breakdown: unknown = null;
    if (report) {
      try {
        const stored = JSON.parse(report.breakdown || '{}');
        currentMethodology = stored?.methodology === 'case-record-completion-v1';
        breakdown = currentMethodology ? stored.components : null;
      } catch { /* legacy report: require recalculation */ }
    }
    const data = report ? {
      id: report.id,
      overallScore: currentMethodology ? report.overallScore : null,
      documentsReady: currentMethodology ? report.documentsReady : null,
      documentsTotal: currentMethodology ? report.documentsTotal : null,
      interviewAssessmentRecorded: currentMethodology ? report.interviewReady : null,
      breakdown,
      recalculationRequired: !currentMethodology,
      generatedAt: report.generatedAt,
      updatedAt: report.updatedAt,
      interpretation: 'Checklist completion indicator only; not an eligibility assessment, approval prediction, or guarantee.',
    } : null;
    return NextResponse.json({ success: true, data, emptyState: report ? null : 'No readiness assessment has been calculated from the current case records.' }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Readiness report could not be loaded or audited.' }, { status: 503 });
  }
});
