import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canApproveAction, logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';

export async function POST(req: Request) {
  try {
    const { adminId, monthYear, action } = await req.json(); // action: 'prepare_draft' | 'approve_payroll'

    if (!adminId || !monthYear) {
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
      const { payrollId, makerId } = await req.json();
      
      const check = canApproveAction(adminId, makerId || 'AI_ASSISTANT', ['super_admin', 'finance_officer']);
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
