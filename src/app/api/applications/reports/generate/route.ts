import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B } from '@/lib/application-manager/service';

export const POST = withAuth(async (req, auth) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canExport = roles.includes('super_admin') || roles.includes('application_manager') || auth.permissions.includes('application.export') || auth.permissions.includes('application.view_reports');
  if (!canExport) return NextResponse.json({ success: false, error: 'Forbidden: export permission required' }, { status: 403 });

  const body = await req.json();
  const { format = 'json', filters = {}, includeB2B = false } = body;

  if (includeB2B && !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B export requires application.view_b2b permission' }, { status: 403 });
  }

  const where: any = {};
  if (filters.source) where.applicationSource = filters.source;
  if (filters.country) where.country = filters.country;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  const applications = await db.application.findMany({ where, take: 5000, orderBy: { createdAt: 'desc' } });

  // Strip B2B fields if not authorized
  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions) && includeB2B;
  let data = applications;
  if (!canViewB2BFlag) {
    data = applications.map((app: any) => {
      const { b2bProviderId, b2bType, isB2b, isB2bConfidential, ...rest } = app;
      return rest;
    });
  }

  const reportData = {
    format,
    generatedAt: new Date().toISOString(),
    generatedBy: auth.userId,
    filters,
    total: data.length,
    data,
    canViewB2B: canViewB2BFlag,
  };

  // In production, generate CSV/XLSX/PDF file and return URL — here return JSON with download token
  const report = await db.visaReport.create({
    data: {
      reportType: 'application_manager',
      generatedBy: auth.userId,
      generatedByName: auth.name,
      filters: JSON.stringify(filters),
      data: JSON.stringify(reportData).substring(0, 10000), // Truncate for DB
      format,
      status: 'ready',
    },
  }).catch(() => null);

  await logAuditAction(auth, 'GENERATE_REPORT', 'Application', 'report', { format, filters, includeB2B });

  return NextResponse.json({
    success: true,
    data: reportData,
    reportId: report?.id || `RPT-${Date.now()}`,
    downloadUrl: `/api/applications/reports/generate?reportId=${report?.id || 'temp'}&format=${format}`,
    message: `Report generated in ${format} format. ${canViewB2BFlag ? 'Includes B2B confidential data.' : 'B2B confidential fields excluded.'}`,
  });
});

export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('reportId');
  const format = searchParams.get('format') || 'json';

  if (!reportId) return NextResponse.json({ success: false, error: 'reportId required' }, { status: 400 });

  const report = await db.visaReport.findUnique({ where: { id: reportId } }).catch(() => null);
  if (!report) return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: report, format });
});
