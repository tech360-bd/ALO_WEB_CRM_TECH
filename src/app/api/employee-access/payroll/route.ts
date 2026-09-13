import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;
    const period = searchParams.get('period');
    const status = searchParams.get('status');

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('finance') || auth.roles.includes('hr_manager');
    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Can only view own payroll unless finance/HR' }, { status: 403 });
    }

    const where: any = { employeeId };
    if (period) where.period = period;
    if (status) where.status = status;

    const payrolls = await (db as any).employeePayroll.findMany({ where, orderBy: { period: 'desc' }, include: { items: true } }).catch(() => []);

    return NextResponse.json({
      success: true,
      payrolls,
      note: 'AI may analyze attendance, calculate draft, detect anomalies, prepare draft, flag inconsistencies — AI CANNOT finalize high-risk salary/payment decisions. Workflow: AI PREPARES → HUMAN CHECK → HUMAN APPROVAL → FINAL',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isHrFinance = auth.roles.includes('hr_manager') || auth.roles.includes('finance') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isHrFinance) return NextResponse.json({ success: false, error: 'HR/Finance/Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { employeeId, period, basicSalary, allowances, bonus, overtime, loanDeduction, advanceDeduction, taxDeduction, pfDeduction, items, isAiDraft } = body;
    if (!employeeId || !period) return NextResponse.json({ success: false, error: 'employeeId and period required' }, { status: 400 });

    // Separation of duties: maker cannot approve own if high-risk
    const gross = (basicSalary || 0) + (allowances || 0) + (bonus || 0) + (overtime || 0);
    const totalDeduction = (loanDeduction || 0) + (advanceDeduction || 0) + (taxDeduction || 0) + (pfDeduction || 0);
    const net = gross - totalDeduction;

    const payroll = await (db as any).employeePayroll.create({
      data: {
        employeeId,
        period,
        basicSalary: basicSalary || 0,
        allowances: allowances || 0,
        bonus: bonus || 0,
        overtime: overtime || 0,
        loanDeduction: loanDeduction || 0,
        advanceDeduction: advanceDeduction || 0,
        taxDeduction: taxDeduction || 0,
        pfDeduction: pfDeduction || 0,
        grossSalary: gross,
        netSalary: net,
        status: isAiDraft ? 'draft' : 'review_pending',
        preparedBy: auth.userId,
      },
    });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await (db as any).employeePayrollItem.create({
          data: {
            payrollId: payroll.id,
            itemType: item.itemType || 'earning',
            label: item.label || '',
            amount: item.amount || 0,
          },
        }).catch(() => {});
      }
    }

    await logAuditAction(auth, isAiDraft ? 'PAYROLL_AI_DRAFT_CREATED' : 'PAYROLL_CREATED', 'EmployeePayroll', payroll.id, { employeeId, period, netSalary: net, isAiDraft });

    return NextResponse.json({
      success: true,
      data: payroll,
      message: isAiDraft ? 'AI draft payroll created — requires HUMAN HR/FINANCE CHECK → HUMAN APPROVAL → FINAL' : 'Payroll created — pending review',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { id, status, reviewedBy, approvedBy } = body;
    if (!id || !status) return NextResponse.json({ success: false, error: 'id and status required' }, { status: 400 });

    const existing = await (db as any).employeePayroll.findUnique({ where: { id } }).catch(() => null);
    if (!existing) return NextResponse.json({ success: false, error: 'Payroll not found' }, { status: 404 });

    // Separation of duties: maker cannot approve own
    if (existing.preparedBy === auth.userId && status === 'approved') {
      return NextResponse.json({ success: false, error: 'Maker cannot approve own payroll — separation of duties' }, { status: 403 });
    }

    const updated = await (db as any).employeePayroll.update({
      where: { id },
      data: {
        status,
        ...(status === 'reviewed' ? { reviewedBy: auth.userId } : {}),
        ...(status === 'approved' ? { approvedBy: auth.userId } : {}),
        ...(status === 'paid' ? { paidAt: new Date() } : {}),
      },
    });

    await logAuditAction(auth, `PAYROLL_${status.toUpperCase()}`, 'EmployeePayroll', id, { status, netSalary: existing.netSalary });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
