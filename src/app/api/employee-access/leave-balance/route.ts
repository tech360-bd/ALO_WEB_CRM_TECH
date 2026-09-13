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
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager');
    if (employeeId !== auth.userId && !isSuper) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });

    let balance = await (db as any).employeeLeaveBalance.findUnique({ where: { employeeId } }).catch(() => null);
    if (!balance) {
      balance = {
        employeeId,
        year,
        casualTotal: 12, casualUsed: 0, casualRemaining: 12,
        annualTotal: 15, annualUsed: 0, annualRemaining: 15,
        medicalTotal: 10, medicalUsed: 0, medicalRemaining: 10,
      };
    }

    return NextResponse.json({ success: true, balance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isHr = auth.roles.includes('hr_manager') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isHr) return NextResponse.json({ success: false, error: 'HR required' }, { status: 403 });

    const body = await req.json();
    const { employeeId, year, casualTotal, annualTotal, medicalTotal } = body;
    if (!employeeId) return NextResponse.json({ success: false, error: 'employeeId required' }, { status: 400 });

    const existing = await (db as any).employeeLeaveBalance.findUnique({ where: { employeeId } }).catch(() => null);
    let balance;
    if (existing) {
      balance = await (db as any).employeeLeaveBalance.update({
        where: { employeeId },
        data: { year: year || new Date().getFullYear().toString(), casualTotal, annualTotal, medicalTotal, casualRemaining: (casualTotal || 12) - (existing.casualUsed || 0) },
      });
    } else {
      balance = await (db as any).employeeLeaveBalance.create({
        data: {
          employeeId,
          year: year || new Date().getFullYear().toString(),
          casualTotal: casualTotal || 12, casualUsed: 0, casualRemaining: casualTotal || 12,
          annualTotal: annualTotal || 15, annualUsed: 0, annualRemaining: annualTotal || 15,
          medicalTotal: medicalTotal || 10, medicalUsed: 0, medicalRemaining: medicalTotal || 10,
        },
      });
    }

    await logAuditAction(auth, 'LEAVE_BALANCE_UPDATED', 'EmployeeLeaveBalance', balance.id, { employeeId, year });

    return NextResponse.json({ success: true, data: balance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
