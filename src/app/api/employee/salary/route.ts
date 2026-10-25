import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { buildOfficialDocumentHtml, moneyRow } from '@/lib/documents/official-documents';

// Own-salary endpoint. HR/payroll administration uses separate, explicitly gated APIs.
export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    const roles = [auth.userType, ...(auth.roles || [])].map((role: string) => role.trim().toUpperCase());
    if (roles.some((role: string) => ['STUDENT', 'PARTNER'].includes(role))) {
      return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
    }
    const employee = await db.employee.findUnique({
      where: { userId: auth.userId },
      select: { id: true, userId: true, employeeId: true, status: true },
    });
    if (!employee || employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
    }
    // Fail closed when the resolved auth context carries no permission list:
    // an incomplete context must never be treated as an implicit grant.
    if (!(auth.permissions ?? []).includes('h6')) {
      return NextResponse.json({ success: false, error: 'Own-salary permission is required.' }, { status: 403 });
    }

    try {
      const download = new URL(request.url).searchParams.get('download');
      const [payrolls, commissions, bonuses] = await Promise.all([
        db.employeePayroll.findMany({
          where: { employeeId: employee.id, status: { in: ['approved', 'paid'] }, ...(download ? { id: download } : {}) },
          orderBy: { period: 'desc' }, take: 24,
          select: { id: true, period: true, basicSalary: true, allowances: true, bonus: true, overtime: true, loanDeduction: true, advanceDeduction: true, taxDeduction: true, pfDeduction: true, grossSalary: true, netSalary: true, status: true, paidAt: true },
        }),
        db.employeeCommission.findMany({ where: { employeeId: employee.id, status: { in: ['approved', 'paid'] } }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, amount: true, currency: true, status: true, period: true, paidAt: true, createdAt: true } }),
        db.employeeBonus.findMany({ where: { employeeId: employee.id, status: { in: ['approved', 'paid'] } }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, amount: true, currency: true, period: true, status: true, paidAt: true, createdAt: true } }),
      ]);
      if (download && !payrolls.length) return NextResponse.json({ success: false, error: 'Approved payslip not found.' }, { status: 404 });
      const currentSalary = payrolls[0] || null;
      const totalPendingCommission = commissions.filter(record => record.status === 'approved').reduce((sum, record) => sum + record.amount, 0);
      const totalPaidCommission = commissions.filter(record => record.status === 'paid').reduce((sum, record) => sum + record.amount, 0);
      const totalPaidBonus = bonuses.filter(record => record.status === 'paid').reduce((sum, record) => sum + record.amount, 0);
      const payslips = payrolls.map(record => ({ id: record.id, month: record.period, gross: record.grossSalary, deductions: record.grossSalary - record.netSalary, net: record.netSalary, status: record.status, paidOn: record.paidAt?.toISOString().slice(0, 10) || 'Not paid' }));
      // Salary values are sensitive; do not return them if the access record cannot be persisted.
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: download ? 'SALARY_DOWNLOADED' : 'SALARY_VIEWED',
          entityType: 'EmployeePayroll',
          entityId: download || employee.id,
          metadata: JSON.stringify({ effectiveUserId: auth.userId, recordCounts: { payrolls: payrolls.length, commissions: commissions.length, bonuses: bonuses.length }, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
        },
      });

      if (download) {
        const payroll = payrolls[0];
        // Official salary slip: always on the ALO letterhead. The seal is added
        // only when the issuing authority is a Super Admin — an employee
        // downloading their own copy gets the letterhead plus an explicit
        // "seal withheld" note (src/lib/documents/official-documents.ts).
        const html = await buildOfficialDocumentHtml({
          kind: 'salary-slip',
          title: 'Approved salary slip',
          issuedTo: employee.employeeId,
          reference: payroll.id,
          authority: auth,
          meta: [
            { label: 'Employee ID', value: employee.employeeId },
            { label: 'Payroll period', value: payroll.period },
            { label: 'Status', value: payroll.status },
            ...(payroll.paidAt ? [{ label: 'Paid on', value: payroll.paidAt.toISOString().slice(0, 10) }] : []),
          ],
          bodyHtml: `<table class="amounts"><tbody>${[
            moneyRow('Gross salary', payroll.grossSalary),
            moneyRow('Total deductions', payroll.grossSalary - payroll.netSalary),
            moneyRow('Net salary', payroll.netSalary, { total: true }),
          ].join('')}</tbody></table>
          <p class="note">Confidential employee copy. Salary amounts are shown in the payroll currency recorded by HR — confirm the currency with HR before payment. This copy is not a payment instruction.</p>`,
        });
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="alo-payslip-${payroll.period.replace(/[^0-9-]/g, '')}.html"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox" } });
      }
      return NextResponse.json({
        success: true,
        payslips,
        data: {
          salary: { current: currentSalary, history: payrolls },
          commissions: { records: commissions, summary: { totalPending: totalPendingCommission, totalPaid: totalPaidCommission, total: totalPendingCommission + totalPaidCommission, count: commissions.length } },
          bonuses,
          increments: [],
          financialSummary: {
            currentNetSalary: currentSalary?.netSalary || 0,
            totalCommissionsEarned: totalPaidCommission,
            totalBonusesEarned: totalPaidBonus,
            lastIncrement: null,
          },
        },
      }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      // Do not log raw salary rows or provider/database credentials.
      return NextResponse.json({ success: false, error: 'Salary information is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  })(request);
}
