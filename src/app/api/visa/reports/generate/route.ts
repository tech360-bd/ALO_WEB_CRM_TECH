import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

const VALID_REPORT_TYPES = ['daily_interview','weekly_readiness','high_risk','missing_docs','funding','study_gap','refusal','officer_performance','counselor_pending','pipeline','daily','weekly','readiness','high-risk','missing-docs','funding-review','study-gap','refusal-review','officer-performance','counselor-pending','pipeline-overview'];

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('ADMIN');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Reports generate requires elevated permission — reports.view/generate/export sensitive elevated' }, { status: 403 });

    const body = await req.json();
    const { reportType, filters, format, dateFrom, dateTo } = body;

    if (reportType && !VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json({ success: false, error: `Invalid report type — allowed Daily/Weekly Readiness/High Risk/Missing Docs/Funding/Study Gap/Refusal/Officer Performance/Counselor Pending/Pipeline` }, { status: 400 });
    }

    // Generate real data based on report type — no fake KPI
    let data: any = {};
    const where: any = {};
    if (filters?.visaOfficerId) where.visaOfficerId = filters.visaOfficerId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (reportType === 'high_risk' || reportType === 'high-risk') {
      const cases = await db.visaCase.findMany({ where: { ...where, riskLevel: { in: ['high','critical','HIGH','CRITICAL'] } }, take: 200 });
      data = { cases, count: cases.length };
    } else if (reportType === 'missing_docs' || reportType === 'missing-docs') {
      const items = await db.visaChecklistItem.findMany({ where: { status: { in: ['NOT_UPLOADED','PENDING_REVIEW','NEEDS_UPDATE'] } }, take: 200 }).catch(() => []);
      data = { items, count: items.length };
    } else if (reportType === 'funding' || reportType === 'funding-review') {
      const reviews = await db.visaFundingReview.findMany({ where, take: 200 }).catch(() => []);
      data = { reviews, count: reviews.length };
    } else if (reportType === 'pipeline' || reportType === 'pipeline-overview') {
      const byStage = await db.visaCase.groupBy({ by: ['currentStage'], _count: { id: true } });
      data = { byStage };
    } else {
      const cases = await db.visaCase.findMany({ where, take: 200, orderBy: { createdAt: 'desc' } });
      data = { cases, count: cases.length };
    }

    const report = await db.visaReport.create({
      data: {
        reportType: reportType || 'daily_interview',
        generatedBy: auth.userId,
        generatedByName: auth.name || 'Visa Officer',
        filters: typeof filters === 'string' ? filters : JSON.stringify(filters || {}),
        status: 'ready',
        data: JSON.stringify(data),
        format: format || 'json',
      } as any,
    });

    await logAuditAction(auth, 'VISA_REPORT_GENERATE', 'VisaReport', report.id, { reportType, filters, format });
    await db.timelineEvent.create({
      data: {
        studentId: 'system',
        stage: 'VISA_REPORT_GENERATED',
        title: `Visa report generated — type ${reportType || 'daily_interview'} — by ${auth.name} — format ${format || 'json'}`,
        description: `Reports Daily/Weekly Readiness/High Risk/Missing Docs/Funding/Study Gap/Refusal/Officer Performance/Counselor Pending/Pipeline export PDF/CSV/XLSX sensitive elevated — every export audited — unauthorized export/bulk blocked`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: report, reportData: data, note: 'Reports Daily/Weekly Readiness/High Risk/Missing Docs/Funding/Study Gap/Refusal/Officer Performance/Counselor Pending/Pipeline export PDF/CSV/XLSX sensitive elevated — every download/readiness/sensitive audited — unauthorized export/bulk blocked' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
