import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canApproveAction, logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import {
  assertMakerChecker,
  assertPayrollPeriod,
  assertPayrollTransition,
  buildPayrollItems,
  PayrollValidationError,
  validateSalaryRecord,
} from '@/lib/hrms/payroll-controls';

function errorResponse(error: unknown) {
  if (error instanceof PayrollValidationError) {
    const status = error.code === 'DUPLICATE_RUN' ? 409 : error.code === 'MAKER_CHECKER' ? 403 : 422;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  // Prisma's unique error is intentionally not converted into a successful
  // response: a concurrent request must be reported as a duplicate.
  if ((error as { code?: string })?.code === 'P2002') {
    return NextResponse.json({ error: 'Payroll for this period already exists', code: 'DUPLICATE_RUN' }, { status: 409 });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error processing payroll' }, { status: 500 });
}

async function processPayroll(req: Request, auth: AuthContext) {
  try {
    const { monthYear, action, payrollId } = await req.json();
    const adminId = auth.userId;

    if (!action || (action === 'prepare_draft' && !monthYear) || (['approve_payroll', 'pay_payroll'].includes(action) && !payrollId)) {
      return NextResponse.json({ error: 'Missing payroll parameters' }, { status: 400 });
    }

    if (action === 'prepare_draft') {
      const access = await validateRequestAccess({ userId: adminId }, 'payroll', 'create');
      if (!access.allowed) return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
      const period = assertPayrollPeriod(monthYear);

      const payroll = await (db as any).$transaction(async (tx: any) => {
        // This row is the canonical payroll-run record for the admin endpoint.
        // The lookup is inside the transaction; the database uniqueness guard
        // (when deployed) handles concurrent requests as well.
        const existing = await tx.employeePayroll.findFirst({ where: { employeeId: '', period } });
        if (existing) throw new PayrollValidationError('DUPLICATE_RUN', `Payroll for ${period} already exists`);

        const activeEmployees = await tx.employee.findMany({
          where: { status: 'active' },
          select: { id: true, employeeId: true, name: true },
        });
        const salaries = new Map<string, any>();
        for (const employee of activeEmployees) {
          const salary = await tx.employeeSalary.findFirst({ where: { employeeId: employee.id }, orderBy: { effectiveFrom: 'desc' } });
          salaries.set(employee.id, validateSalaryRecord(salary, employee.id));
        }
        // Build and validate every item before creating the run. If one salary
        // is missing or malformed, no payroll row or item is written.
        const built = buildPayrollItems(activeEmployees, salaries);
        const run = await tx.employeePayroll.create({
          data: {
            employeeId: '',
            period,
            monthYear: period,
            status: 'draft',
            employeeCount: built.items.length,
            preparedBy: adminId,
            totalGross: built.totalGross,
            totalDeduction: built.totalDeduction,
            totalNet: built.totalNet,
          },
        });

        for (const item of built.items) {
          await tx.employeePayrollItem.create({
            data: {
              payrollId: run.id,
              itemType: 'earning',
              label: `${item.employeeName} — ${period} salary`,
              amount: item.netSalary,
              employeeId: item.employeeId,
              employeeName: item.employeeName,
              basicSalary: item.basicSalary,
              allowances: item.allowances,
              tax: item.tax,
              netSalary: item.netSalary,
              status: 'draft',
            },
          });
        }
        await logSecurityAudit({ actorId: adminId, actorRole: 'HR/Admin', action: 'PAYROLL_DRAFT_PREPARED', targetType: 'EmployeePayroll', targetId: run.id }, tx);
        return run;
      }, { isolationLevel: 'Serializable' });

      return NextResponse.json({ success: true, payroll });
    }

    if (action === 'approve_payroll' || action === 'pay_payroll') {
      const payrollToChange = await (db as any).employeePayroll.findUnique({ where: { id: payrollId } });
      if (!payrollToChange) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });

      const makerId = payrollToChange.preparedBy;
      try { assertMakerChecker(adminId, makerId); } catch (error) { return errorResponse(error); }
      const check = canApproveAction(adminId, makerId, [auth.userType, ...auth.roles]);
      if (!check.allowed) return NextResponse.json({ error: check.reason || 'Maker-Checker Separation of Duties Violation' }, { status: 403 });
      const transition = assertPayrollTransition(payrollToChange.status, action === 'approve_payroll' ? 'approve' : 'pay');

      const updated = await (db as any).$transaction(async (tx: any) => {
        // Conditional update makes repeated approval/payment idempotently fail
        // instead of silently changing a state or paying twice.
        const changed = await tx.employeePayroll.updateMany({
          where: { id: payrollId, status: payrollToChange.status },
          data: {
            status: transition,
            ...(transition === 'approved' ? { approvedBy: adminId } : {}),
            ...(transition === 'paid' ? { paidAt: new Date() } : {}),
          },
        });
        if (changed.count !== 1) throw new PayrollValidationError('DUPLICATE_RUN', 'Payroll status changed; reload before retrying');
        await logSecurityAudit({
          actorId: adminId,
          actorRole: transition === 'paid' ? 'Finance Payer' : 'Finance Approver',
          action: transition === 'paid' ? 'PAYROLL_PAID' : 'PAYROLL_APPROVED',
          targetType: 'EmployeePayroll',
          targetId: payrollId,
          approvalId: adminId,
        }, tx);
        return tx.employeePayroll.findUnique({ where: { id: payrollId } });
      }, { isolationLevel: 'Serializable' });

      return NextResponse.json({ success: true, payroll: updated });
    }

    return NextResponse.json({ error: 'Invalid payroll action' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = withAuth(processPayroll, {
  requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'FINANCE'],
});
