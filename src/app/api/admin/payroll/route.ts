import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canApproveAction, logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

async function processPayroll(req: Request, auth: AuthContext) {
  try {
    const { monthYear, action, payrollId } = await req.json(); // action: 'prepare_draft' | 'approve_payroll'
    const adminId = auth.userId;

    if (!action || (action === 'prepare_draft' && !monthYear) || (action === 'approve_payroll' && !payrollId)) {
      return NextResponse.json({ error: 'Missing payroll parameters' }, { status: 400 });
    }

    if (action === 'prepare_draft') {
      const access = await validateRequestAccess({ userId: adminId }, 'payroll', 'create');
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
      }

      const activeEmployees = await db.employee.findMany({ where: { status: 'active' } });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const payroll = await db.employeePayroll.create({
        data: {
          // Payroll-run row: employeeId/period are the per-employee legacy fields —
          // keep them populated with run-level values to satisfy the schema.
          employeeId: '',
          period: monthYear,
          monthYear,
          status: 'draft',
          employeeCount: activeEmployees.length,
          preparedBy: adminId,
        },
      });

      for (const emp of activeEmployees) {
        const salary = await db.employeeSalary.findFirst({ where: { employeeId: emp.id } });
        const gross = salary ? salary.grossSalary : 50000;
        const tax = salary ? salary.taxDeduction : 2500;
        const net = gross - tax;

        totalGross += gross;
        totalDeductions += tax;
        totalNet += net;

        await db.employeePayrollItem.create({
          data: {
            payrollId: payroll.id,
            itemType: 'earning',
            label: `${emp.name} — ${monthYear} salary`,
            amount: net,
            employeeId: emp.id,
            employeeName: emp.name,
            basicSalary: gross * 0.6,
            allowances: gross * 0.4,
            tax,
            netSalary: net,
            status: 'draft',
          },
        });
      }

      await db.employeePayroll.update({
        where: { id: payroll.id },
        data: {
          totalGross,
          totalDeduction: totalDeductions,
          totalNet,
        },
      });

      await logSecurityAudit({
        actorId: adminId,
        actorRole: 'HR/Admin',
        action: 'PAYROLL_DRAFT_PREPARED',
        targetType: 'EmployeePayroll',
        targetId: payroll.id,
      });

      return NextResponse.json({ success: true, payroll });
    }

    if (action === 'approve_payroll') {
      const payrollToApprove = await db.employeePayroll.findUnique({ where: { id: payrollId } });
      if (!payrollToApprove) {
        return NextResponse.json({ error: 'Payroll draft not found' }, { status: 404 });
      }
      if (['approved', 'paid'].includes(payrollToApprove.status.toLowerCase())) {
        return NextResponse.json({ error: 'Payroll has already been approved or paid' }, { status: 409 });
      }

      // The maker is record-derived. Never trust a maker ID supplied by the
      // caller and never fall back to a synthetic AI actor for payroll.
      const makerId = payrollToApprove.preparedBy || payrollToApprove.reviewedBy;
      if (!makerId) {
        return NextResponse.json({ error: 'Payroll has no recorded maker; approval is blocked' }, { status: 409 });
      }
      const check = canApproveAction(adminId, makerId, [auth.userType, ...auth.roles]);
      if (!check.allowed) {
        return NextResponse.json({ error: check.reason || 'Maker-Checker Separation of Duties Violation' }, { status: 403 });
      }

      const updated = await db.employeePayroll.update({
        where: { id: payrollId },
        data: {
          status: 'approved',
          approvedBy: adminId,
          paidAt: new Date(),
        },
      });

      await logSecurityAudit({
        actorId: adminId,
        actorRole: 'Finance Approver',
        action: 'PAYROLL_FINAL_APPROVED',
        targetType: 'EmployeePayroll',
        targetId: payrollId,
        approvalId: adminId,
      });

      return NextResponse.json({ success: true, payroll: updated });
    }

    return NextResponse.json({ error: 'Invalid payroll action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error processing payroll' }, { status: 500 });
  }
}

export const POST = withAuth(processPayroll, {
  requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'FINANCE'],
});
