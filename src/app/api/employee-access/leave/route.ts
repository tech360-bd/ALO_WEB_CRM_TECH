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
    const status = searchParams.get('status');

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager') || auth.roles.includes('branch_manager');
    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Can only view own leave unless manager' }, { status: 403 });
    }

    const where: any = { employeeId };
    if (status) where.status = status;

    const leaves = await (db as any).employeeLeave.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);
    const balance = await (db as any).employeeLeaveBalance.findUnique({ where: { employeeId } }).catch(() => null);

    return NextResponse.json({
      success: true,
      leaves,
      balance,
      types: ['casual','annual','medical','maternity','paternity','lwp','compensatory'],
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

    const body = await req.json();
    const { leaveType, startDate, endDate, reason, documentUrl } = body;
    if (!leaveType || !startDate || !endDate) return NextResponse.json({ success: false, error: 'leaveType, startDate, endDate required' }, { status: 400 });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1;

    const leave = await (db as any).employeeLeave.create({
      data: {
        employeeId: auth.userId,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason || '',
        status: 'pending',
        documentUrl: documentUrl || '',
      },
    });

    await logAuditAction(auth, 'LEAVE_REQUESTED', 'EmployeeLeave', leave.id, { leaveType, startDate, endDate, totalDays });

    // Notify manager/HR
    try {
      await db.portalNotification.create({
        data: {
          userId: 'hr_manager',
          title: 'New Leave Request',
          message: `${auth.name} requested ${leaveType} leave ${startDate} to ${endDate} — ${totalDays} days`,
          type: 'leave_request',
        },
      });
    } catch {}

    return NextResponse.json({ success: true, data: leave });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isManager = auth.roles.includes('hr_manager') || auth.roles.includes('branch_manager') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isManager) return NextResponse.json({ success: false, error: 'Manager/HR required to approve leave' }, { status: 403 });

    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ success: false, error: 'id and status required' }, { status: 400 });

    const existing = await (db as any).employeeLeave.findUnique({ where: { id } }).catch(() => null);
    if (!existing) return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });

    // Cannot approve own leave if separation of duties enforced
    if (existing.employeeId === auth.userId && status === 'approved' && !auth.roles.includes('super_admin')) {
      return NextResponse.json({ success: false, error: 'Cannot approve own leave — separation of duties' }, { status: 403 });
    }

    const updated = await (db as any).employeeLeave.update({
      where: { id },
      data: { status, approvedBy: auth.userId, approvedAt: new Date() },
    });

    await logAuditAction(auth, `LEAVE_${status.toUpperCase()}`, 'EmployeeLeave', id, { status });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
