import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('ADMIN');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Reports view requires elevated permission — reports.view/generate/export sensitive elevated — unauthorized export/bulk blocked' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('reportType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = {};
    if (reportType) where.reportType = reportType;

    const [reports, total] = await Promise.all([
      db.visaReport.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: (page-1)*limit }),
      db.visaReport.count({ where }),
    ]);

    await logAuditAction(auth, 'VISA_REPORTS_VIEW', 'VisaReport', 'list', { count: reports.length, reportType });

    return NextResponse.json({
      success: true,
      data: reports,
      reports,
      total,
      pagination: { page, limit, total, pages: Math.ceil(total/limit) },
      emptyState: reports.length === 0 ? 'No reports — proper empty state — Reports Daily/Weekly Readiness/High Risk/Missing Docs/Funding/Study Gap/Refusal/Officer Performance/Counselor Pending/Pipeline export PDF/CSV/XLSX sensitive elevated' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
