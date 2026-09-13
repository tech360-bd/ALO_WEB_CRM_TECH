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
    const month = searchParams.get('month'); // YYYY-MM

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager') || auth.roles.includes('branch_manager');
    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Can only view own attendance unless manager' }, { status: 403 });
    }

    const where: any = { employeeId };
    if (month) where.date = { startsWith: month };

    const records = await (db as any).employeeAttendance.findMany({ where, orderBy: { date: 'desc' }, take: 100 }).catch(() => []);

    const totalPresent = records.filter((r: any) => r.status === 'present').length;
    const totalLate = records.filter((r: any) => r.status === 'late').length;
    const totalAbsent = records.filter((r: any) => r.status === 'absent').length;

    return NextResponse.json({
      success: true,
      records,
      summary: { totalPresent, totalLate, totalAbsent, total: records.length },
      note: 'Never automatically capture webcam photos — camera requires explicit permission',
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
    const { date, status, checkIn, checkOut, note } = body;
    if (!date || !status) return NextResponse.json({ success: false, error: 'date and status required' }, { status: 400 });

    // HR self-service own only, but HR can create for others
    const employeeId = body.employeeId || auth.userId;
    const isHr = auth.roles.includes('hr_manager') || auth.roles.includes('super_admin');
    if (employeeId !== auth.userId && !isHr) {
      return NextResponse.json({ success: false, error: 'Only HR can create attendance for others' }, { status: 403 });
    }

    const record = await (db as any).employeeAttendance.create({
      data: {
        employeeId,
        date,
        status,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        note: note || '',
      },
    });

    await logAuditAction(auth, 'ATTENDANCE_RECORDED', 'EmployeeAttendance', record.id, { employeeId, date, status });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
