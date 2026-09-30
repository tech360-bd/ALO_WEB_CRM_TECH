import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { canManagePayroll, isFinance, isHR, isSuperAdmin } from '@/lib/hrms/rbac';
import {
  assertMakerChecker,
  assertPayrollTransition,
  assertPayrollPeriod,
  PayrollValidationError,
  validateSalaryRecord,
} from '@/lib/hrms/payroll-controls';

function canApproveOrPay(auth: AuthContext) {
  return isSuperAdmin(auth) || isFinance(auth) || isHR(auth);
}

function failure(error: unknown) {
  if (error instanceof PayrollValidationError) {
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.code === 'DUPLICATE_RUN' ? 409 : error.code === 'MAKER_CHECKER' ? 403 : 422 });
  }
  return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Payroll operation failed' }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { searchParams } = new URL(req.url);
    const requestedEmployeeId = searchParams.get('employeeId');
    const period = searchParams.get('period');
    const status = searchParams.get('status');
    const canViewAll = canApproveOrPay(auth);

    let employeeId = requestedEmployeeId || '';
    if (!canViewAll) {
      const ownEmployee = await (db as any).employee.findFirst({ where: { userId: auth.userId }, select: { id: true } });
      if (!ownEmployee) return NextResponse.json({ success: true, payrolls: [] });
      if (requestedEmployeeId && requestedEmployeeId !== ownEmployee.id) {
        return NextResponse.json({ success: false, error: 'Can only view own payroll unless finance/HR' }, { status: 403 });
      }
      employeeId = ownEmployee.id;
    }

    const where: Record<string, unknown> = { ...(employeeId ? { employeeId } : {}), ...(period ? { period } : {}), ...(status ? { status } : {}) };
    const payrolls = await (db as any).employeePayroll.findMany({ where, orderBy: { period: 'desc' }, include: { items: true } });
    return NextResponse.json({
      success: true,
      payrolls,
      note: 'AI may analyze attendance and prepare a draft. Only a human HR/Finance user can approve or pay payroll.',
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    if (!canManagePayroll(auth)) return NextResponse.json({ success: false, error: 'HR/Finance/Super Admin required' }, { status: 403 });

    const body = await req.json();
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId : '';
    const period = assertPayrollPeriod(body.period || '');
    if (!employeeId) return NextResponse.json({ success: false, error: 'employeeId and period required' }, { status: 400 });

    const payroll = await (db as any).$transaction(async (tx: any) => {
      const existing = await tx.employeePayroll.findFirst({ where: { employeeId, period } });
      if (existing) throw new PayrollValidationError('DUPLICATE_RUN', `Payroll for employee ${employeeId} and ${period} already exists`);
      const salary = await tx.employeeSalary.findFirst({ where: { employeeId }, orderBy: { effectiveFrom: 'desc' } });
      const validSalary = validateSalaryRecord(salary, employeeId);
      const gross = validSalary.grossSalary;
      const totalDeduction = validSalary.taxDeduction + validSalary.pfDeduction;
      const allowances = [validSalary.housingAllow, validSalary.transportAllow, validSalary.medicalAllow, validSalary.otherAllow]
        .filter((value): value is number => Number.isFinite(value))
        .reduce((sum, value) => sum + value, 0);
      const net = gross - totalDeduction;
      const created = await tx.employeePayroll.create({
        data: {
          employeeId,
          period,
          monthYear: period,
          basicSalary: validSalary.basicSalary,
          allowances,
          taxDeduction: validSalary.taxDeduction,
          pfDeduction: validSalary.pfDeduction,
          grossSalary: gross,
          netSalary: net,
          status: body.isAiDraft ? 'draft' : 'review_pending',
          preparedBy: auth.userId,
        },
      });
      await tx.employeePayrollItem.create({
        data: {
          payrollId: created.id,
          itemType: 'earning',
          label: `${employeeId} — ${period} salary`,
          amount: net,
          employeeId,
          basicSalary: validSalary.basicSalary,
          allowances,
          tax: validSalary.taxDeduction,
          netSalary: net,
          status: body.isAiDraft ? 'draft' : 'review_pending',
        },
      });
      await writePortalAudit(tx, auth, body.isAiDraft ? 'PAYROLL_AI_DRAFT_CREATED' : 'PAYROLL_CREATED', 'EmployeePayroll', created.id, { employeeId, period, netSalary: created.netSalary }, req);
      return created;
    }, { isolationLevel: 'Serializable' });

    return NextResponse.json({ success: true, data: payroll, message: 'Payroll created from the persisted salary record; requires human review, approval, and payment.' });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    if (!canApproveOrPay(auth)) return NextResponse.json({ success: false, error: 'HR/Finance approval required' }, { status: 403 });

    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const requestedStatus = String(body.status || '').toLowerCase();
    const action = requestedStatus === 'reviewed' ? 'review' : requestedStatus === 'approved' ? 'approve' : requestedStatus === 'paid' ? 'pay' : '';
    if (!id || !action) return NextResponse.json({ success: false, error: 'id and status (reviewed, approved, paid) required' }, { status: 400 });

    const existing = await (db as any).employeePayroll.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Payroll not found' }, { status: 404 });
    try {
      assertMakerChecker(auth.userId, existing.preparedBy);
      assertPayrollTransition(existing.status, action as 'review' | 'approve' | 'pay');
    } catch (error) {
      return failure(error);
    }

    const updated = await (db as any).$transaction(async (tx: any) => {
      const changed = await tx.employeePayroll.updateMany({
        where: { id, status: existing.status },
        data: {
          status: requestedStatus,
          ...(action === 'review' ? { reviewedBy: auth.userId } : {}),
          ...(action === 'approve' ? { approvedBy: auth.userId } : {}),
          ...(action === 'pay' ? { paidAt: new Date() } : {}),
        },
      });
      if (changed.count !== 1) throw new PayrollValidationError('DUPLICATE_RUN', 'Payroll status changed; reload before retrying');
      await writePortalAudit(tx, auth, `PAYROLL_${requestedStatus.toUpperCase()}`, 'EmployeePayroll', id, { status: requestedStatus, netSalary: existing.netSalary }, req);
      return tx.employeePayroll.findUnique({ where: { id } });
    }, { isolationLevel: 'Serializable' });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return failure(error);
  }
}
