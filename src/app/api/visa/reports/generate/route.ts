import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { getAuthorizedVisaCaseIds, normalizeVisaReportType, canUseVisaReport, VISA_REPORT_TYPES, type VisaReportType } from '@/lib/visa/reports';

const filterSchema = z.object({
  dateFrom: z.string().trim().max(40).optional(),
  dateTo: z.string().trim().max(40).optional(),
  stage: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
}).strict();
const schema = z.object({
  reportType: z.string().trim().min(1).max(80),
  filters: filterSchema.optional(),
  dateFrom: z.string().trim().max(40).optional(),
  dateTo: z.string().trim().max(40).optional(),
  format: z.enum(['json', 'csv']).default('json'),
}).strict();

function parsedDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function auditData(auth: AuthContext, reportId: string, type: VisaReportType, scopeCaseCount: number, rowCount: number, format: 'json' | 'csv') {
  return { actorUserId: auth.actorUserId, action: 'VISA_REPORT_GENERATE', entityType: 'VisaReport', entityId: reportId, metadata: JSON.stringify({ reportType: type, scopeCaseCount, rowCount, format }), ipAddress: '', userAgent: '' };
}

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid report request. Only bounded filters and JSON output are supported.', details: parsed.error.flatten() }, { status: 400 });
    const reportType = normalizeVisaReportType(parsed.data.reportType);
    if (!reportType) return NextResponse.json({ success: false, error: `Unsupported report type. Allowed: ${VISA_REPORT_TYPES.join(', ')}.` }, { status: 400 });
    if (!canUseVisaReport(auth, reportType, 'export')) return NextResponse.json({ success: false, error: 'Report export permission for this report type is required.' }, { status: 403 });

    const caseIds = await getAuthorizedVisaCaseIds(auth);
    if (!caseIds) return NextResponse.json({ success: false, error: 'Full Visa-team assigned-case scope is required for reports.' }, { status: 403 });
    const filters = { ...(parsed.data.filters || {}), ...(parsed.data.dateFrom ? { dateFrom: parsed.data.dateFrom } : {}), ...(parsed.data.dateTo ? { dateTo: parsed.data.dateTo } : {}) };
    const from = parsedDate(filters.dateFrom);
    const to = parsedDate(filters.dateTo);
    if ((filters.dateFrom && !from) || (filters.dateTo && !to) || (from && to && from > to)) return NextResponse.json({ success: false, error: 'Invalid report date range.' }, { status: 400 });
    const createdAt: any = {};
    if (from) createdAt.gte = from;
    if (to) createdAt.lte = to;
    const hasDate = Object.keys(createdAt).length > 0;
    const caseWhere: any = { id: { in: caseIds } };
    if (filters.stage) caseWhere.currentStage = filters.stage;
    if (filters.country) caseWhere.destinationCountry = filters.country;
    const filteredCases = caseIds.length ? await db.visaCase.findMany({ where: caseWhere, select: { id: true, caseCode: true, studentName: true, destinationCountry: true, currentStage: true, createdAt: true } }) : [];
    const scopedCaseIds = filteredCases.map((visaCase) => visaCase.id);
    let rows: any[] = [];
    let reportTruncated = false;

    if (reportType === 'daily_interview') {
      rows = scopedCaseIds.length ? await db.visaInterview.findMany({ where: { caseId: { in: scopedCaseIds }, ...(hasDate ? { scheduledAt: createdAt } : {}) }, select: { id: true, caseId: true, interviewType: true, status: true, scheduledAt: true, officerId: true }, orderBy: { scheduledAt: 'desc' }, take: 500 }) : [];
    } else if (reportType === 'weekly_readiness') {
      rows = scopedCaseIds.length ? await db.visaReadinessReport.findMany({ where: { visaCaseId: { in: scopedCaseIds }, ...(hasDate ? { createdAt } : {}) }, select: { id: true, visaCaseId: true, overallScore: true, documentsReady: true, documentsTotal: true, interviewReady: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }) : [];
    } else if (reportType === 'high_risk') {
      rows = scopedCaseIds.length ? await db.visaRiskAssessment.findMany({ where: { caseId: { in: scopedCaseIds }, overallRiskLevel: { in: ['high', 'critical', 'HIGH', 'CRITICAL'] } }, select: { caseId: true, overallRiskLevel: true, officerVerdict: true, humanReviewRequired: true, updatedAt: true }, take: 500 }) : [];
    } else if (reportType === 'missing_docs') {
      rows = scopedCaseIds.length ? await db.visaChecklistItem.findMany({ where: { caseId: { in: scopedCaseIds }, isRequired: true, status: { in: ['NOT_UPLOADED', 'PENDING_REVIEW', 'NEEDS_UPDATE', 'not_uploaded', 'pending_review', 'needs_update'] }, ...(hasDate ? { updatedAt: createdAt } : {}) }, select: { id: true, caseId: true, item: true, category: true, status: true, priority: true, deadline: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 500 }) : [];
    } else if (reportType === 'funding') {
      rows = scopedCaseIds.length ? await db.visaFundingReview.findMany({ where: { caseId: { in: scopedCaseIds }, ...(hasDate ? { updatedAt: createdAt } : {}) }, select: { caseId: true, fundingStatus: true, hasBankStatement: true, hasSolvencyCert: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 500 }) : [];
    } else if (reportType === 'study_gap') {
      rows = scopedCaseIds.length ? await db.visaStudyGapReview.findMany({ where: { caseId: { in: scopedCaseIds }, ...(hasDate ? { updatedAt: createdAt } : {}) }, select: { caseId: true, hasStudyGap: true, gapDurationMonths: true, explanationClarity: true, riskFlag: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 500 }) : [];
    } else if (reportType === 'refusal') {
      rows = scopedCaseIds.length ? await db.visaRefusalReview.findMany({ where: { caseId: { in: scopedCaseIds }, hasVisaRefusal: true, ...(hasDate ? { updatedAt: createdAt } : {}) }, select: { caseId: true, previousRefusalCount: true, humanReviewStatus: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 500 }) : [];
    } else if (reportType === 'officer_performance') {
      const completedInterviews = scopedCaseIds.length ? await db.visaInterview.findMany({
        where: { caseId: { in: scopedCaseIds }, status: 'completed', ...(hasDate ? { completedAt: createdAt } : {}) },
        select: { officerId: true },
        orderBy: { completedAt: 'desc' },
        take: 5000,
      }) : [];
      reportTruncated = completedInterviews.length === 5000;
      const countByOfficer = new Map<string | null, number>();
      for (const interview of completedInterviews) countByOfficer.set(interview.officerId, (countByOfficer.get(interview.officerId) || 0) + 1);
      rows = [...countByOfficer].sort(([left], [right]) => String(left || '').localeCompare(String(right || ''))).map(([officerId, count]) => ({ officerId, _count: { _all: count } }));
    } else if (reportType === 'counselor_pending') {
      rows = scopedCaseIds.length ? await db.visaTask.findMany({ where: { caseId: { in: scopedCaseIds }, archivedAt: null, status: { notIn: ['completed', 'cancelled', 'archived'] }, assignedTo: { contains: 'counselor' }, ...(hasDate ? { createdAt } : {}) }, select: { id: true, caseId: true, status: true, priority: true, dueDate: true, updatedAt: true }, orderBy: { dueDate: 'asc' }, take: 500 }) : [];
    } else {
      const summaryCases = hasDate
        ? filteredCases.filter((visaCase) => (!from || visaCase.createdAt >= from) && (!to || visaCase.createdAt <= to))
        : filteredCases;
      const countByStage = new Map<string, number>();
      for (const visaCase of summaryCases) countByStage.set(visaCase.currentStage, (countByStage.get(visaCase.currentStage) || 0) + 1);
      rows = [...countByStage].sort(([left], [right]) => left.localeCompare(right)).map(([currentStage, count]) => ({ currentStage, _count: { id: count } }));
    }

    const reportData = {
      scope: 'assigned_visa_cases',
      reportType,
      rowCount: rows.length,
      rows,
      truncated: reportTruncated,
      note: reportTruncated
        ? 'Recorded operational data only. The officer-performance source rows are capped at 5,000; results may be truncated. This does not predict visa eligibility, approval, or outcomes.'
        : 'Recorded operational data only. It does not predict visa eligibility, approval, or outcomes.',
    };
    const storedFilters = JSON.stringify({ ...filters, scopeCaseIds: scopedCaseIds, scopeCaseCount: scopedCaseIds.length });
    const report = await db.$transaction(async (tx) => {
      const created = await tx.visaReport.create({ data: { reportType, generatedBy: auth.actorUserId, generatedByName: auth.actorName || auth.name || 'Visa Team', filters: storedFilters, data: JSON.stringify(reportData), format: parsed.data.format, status: 'ready' } });
      await tx.portalAuditLog.create({ data: auditData(auth, created.id, reportType, scopedCaseIds.length, rows.length, parsed.data.format) });
      return created;
    });
    return NextResponse.json({ success: true, data: { id: report.id, reportType, format: report.format, status: report.status, createdAt: report.createdAt, rowCount: rows.length, downloadUrl: `/api/visa/reports/${encodeURIComponent(report.id)}/download` }, externalDelivery: false }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Report generation failed; any audit failure rolled back.' }, { status: 503 });
  }
});
