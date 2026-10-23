import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canUseVisaReport, isVisaReportInCurrentScope, normalizeVisaReportType } from '@/lib/visa/reports';

function csvCell(value: unknown): string {
  let text = typeof value === 'string' ? value : value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text.trimStart())) text = `'${text}`;
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}
function toCsv(value: any): string {
  const rows = Array.isArray(value?.rows) ? value.rows : [];
  if (!rows.length) return 'reportType,rowCount\r\n' + [csvCell(value?.reportType), csvCell(value?.rowCount)].join(',') + '\r\n';
  const keys = [...new Set(rows.flatMap((row: any) => row && typeof row === 'object' ? Object.keys(row) : ['value']))];
  const header = keys.map(csvCell).join(',');
  const body = rows.map((row: any) => keys.map((key) => csvCell(row && typeof row === 'object' ? row[key] : row)).join(',')).join('\r\n');
  return `${header}\r\n${body}\r\n`;
}

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Report ID required.' }, { status: 400 });
    const report = await db.visaReport.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ success: false, error: 'Visa report not found.' }, { status: 404 });
    const type = normalizeVisaReportType(report.reportType);
    if (!type || !canUseVisaReport(auth, type, 'export')) return NextResponse.json({ success: false, error: 'Report export permission required.' }, { status: 403 });
    if (!await isVisaReportInCurrentScope(auth, report)) return NextResponse.json({ success: false, error: 'The report contains cases outside the current assigned scope.' }, { status: 403 });
    let data: any;
    try { data = JSON.parse(report.data || '{}'); } catch { return NextResponse.json({ success: false, error: 'Stored report data is invalid.' }, { status: 500 }); }
    const requestedFormat = new URL(req.url).searchParams.get('format');
    const format = requestedFormat || report.format || 'json';
    if (!['json', 'csv'].includes(format)) return NextResponse.json({ success: false, error: 'Only JSON and CSV exports are currently supported.' }, { status: 400 });

    try {
      await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_REPORT_EXPORT', entityType: 'VisaReport', entityId: report.id, metadata: JSON.stringify({ reportType: type, format, rowCount: data?.rowCount || 0 }), ipAddress: '', userAgent: '' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Report export could not be audited; no file was served.' }, { status: 503 });
    }

    const fileBase = `visa-${type}-${report.id.slice(-8)}`;
    if (format === 'csv') {
      const csv = toCsv(data);
      return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileBase}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie, Authorization' } });
    }
    return new NextResponse(JSON.stringify(data, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileBase}.json"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Report export could not be audited or completed.' }, { status: 503 });
  }
});
