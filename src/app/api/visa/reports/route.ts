import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { getAuthorizedVisaCaseIds, isVisaReportInCurrentScope, normalizeVisaReportType, VISA_REPORT_TYPES } from '@/lib/visa/reports';
import { hasVisaPermission, isVisaSuperAdmin } from '@/lib/visa/access';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    if (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, 'visa.reports.view')) return NextResponse.json({ success: false, error: 'visa.reports.view permission required.' }, { status: 403 });
    const currentCaseIds = await getAuthorizedVisaCaseIds(auth);
    if (!currentCaseIds) return NextResponse.json({ success: false, error: 'Reports are limited to full Visa-team case scope.' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20));
    const rawType = searchParams.get('reportType');
    const reportType = rawType ? normalizeVisaReportType(rawType) : null;
    if (rawType && !reportType) return NextResponse.json({ success: false, error: `Unsupported report type. Allowed: ${VISA_REPORT_TYPES.join(', ')}.` }, { status: 400 });

    const canViewAll = isVisaSuperAdmin(auth) || (hasVisaPermission(auth, 'visa.reports.view_all') && hasVisaPermission(auth, 'visa.cases.view_all'));
    const where: any = canViewAll ? {} : { generatedBy: auth.actorUserId };
    if (reportType) where.reportType = reportType;
    const candidates = await db.visaReport.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(500, page * limit + 100), select: { id: true, reportType: true, generatedBy: true, generatedByName: true, format: true, status: true, createdAt: true, filters: true } });
    const allowed: typeof candidates = [];
    for (const report of candidates) if (await isVisaReportInCurrentScope(auth, report)) allowed.push(report);
    const total = allowed.length;
    const reports = allowed.slice((page - 1) * limit, page * limit).map(({ filters: _filters, ...report }) => ({ ...report, downloadUrl: `/api/visa/reports/${encodeURIComponent(report.id)}/download` }));

    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_REPORTS_VIEW', entityType: 'VisaReport', entityId: 'list', metadata: JSON.stringify({ count: reports.length, reportType, scopeCaseCount: currentCaseIds.length }), ipAddress: '', userAgent: '' } });
    return NextResponse.json({ success: true, data: reports, reports, total, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, emptyState: reports.length ? null : 'No authorized reports are available in the current case scope.', supportedTypes: VISA_REPORT_TYPES }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Reports could not be audited or loaded.' }, { status: 503 });
  }
});
