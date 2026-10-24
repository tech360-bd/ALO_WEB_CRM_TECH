import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    if (['STUDENT', 'PARTNER'].includes(auth.userType.toUpperCase())) return NextResponse.json({ success: false, error: 'Employee access required.' }, { status: 403 });
    try {
      const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, name: true, employeeId: true, status: true } });
      if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Active employee not found.' }, { status: 403 });
      const download = new URL(request.url).searchParams.get('download');
      const payrolls = await db.employeePayroll.findMany({
        where: { employeeId: employee.id, status: { in: ['approved', 'paid'] }, ...(download ? { id: download } : {}) },
        select: { id: true, period: true, grossSalary: true, netSalary: true, status: true, paidAt: true },
        orderBy: { period: 'desc' }, take: 24,
      });
      if (download && !payrolls.length) return NextResponse.json({ success: false, error: 'Approved payslip not found.' }, { status: 404 });
      await db.portalAuditLog.create({ data: {
        actorUserId: auth.actorUserId, action: download ? 'SALARY_DOWNLOADED' : 'SALARY_VIEWED', entityType: 'EmployeePayroll', entityId: download || employee.id,
        metadata: JSON.stringify({ effectiveUserId: auth.userId, employeeId: employee.id, count: payrolls.length,
          actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole }),
      } });
      if (download) {
        const payroll = payrolls[0];
        const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>ALO Education Payslip</title><style>body{font:16px sans-serif;max-width:720px;margin:48px auto;padding:24px;color:#17365d}h1{color:#0066cc}table{width:100%;border-collapse:collapse}td{padding:12px;border-bottom:1px solid #ddd}</style><h1>ALO Education</h1><h2>Approved salary slip</h2><p>${escapeHtml(employee.name)} · ${escapeHtml(employee.employeeId)}</p><p>Period: ${escapeHtml(payroll.period)} · ${escapeHtml(payroll.status)}</p><table><tr><td>Gross salary</td><td>${escapeHtml(payroll.grossSalary)}</td></tr><tr><td>Total deductions</td><td>${escapeHtml(payroll.grossSalary - payroll.netSalary)}</td></tr><tr><td>Net salary</td><td>${escapeHtml(payroll.netSalary)}</td></tr></table><p>Confidential employee copy. Reference: ${escapeHtml(payroll.id)}. Generated ${escapeHtml(new Date().toISOString())}. Amounts are recorded values. Confirm the payroll currency with HR.</p></html>`;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="alo-payslip-${payroll.period.replace(/[^0-9-]/g, '')}.html"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" } });
      }
      const payslips = payrolls.map(p => ({ id: p.id, month: p.period, gross: p.grossSalary, deductions: p.grossSalary - p.netSalary, net: p.netSalary, status: p.status, paidOn: p.paidAt?.toISOString().slice(0, 10) || 'Not paid' }));
      return NextResponse.json({ success: true, payslips, breakdown: payrolls[0] ? [
        { label: 'Approved gross salary', amount: payrolls[0].grossSalary, type: 'earning' },
        { label: 'Approved total deductions', amount: -(payrolls[0].grossSalary - payrolls[0].netSalary), type: 'deduction' },
      ] : [] }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Approved salary records are temporarily unavailable.' }, { status: 503 });
    }
  })(request);
}
