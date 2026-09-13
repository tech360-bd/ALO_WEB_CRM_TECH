import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    const where: any = { employeeId: auth.userId };
    if (month) {
      where.date = { startsWith: month };
    }
    const records = await (db as any).employeeAttendance.findMany({ where, orderBy: { date: 'desc' }, take: 100 });
    const totalPresent = records.filter((r: any) => r.status === 'present').length;
    const totalLate = records.filter((r: any) => r.status === 'late').length;
    const totalAbsent = records.filter((r: any) => r.status === 'absent').length;
    return NextResponse.json({ success: true, records, summary: { totalPresent, totalLate, totalAbsent, total: records.length } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { date, status, checkIn, checkOut, note } = body;
    if (!date || !status) return NextResponse.json({ success: false, error: 'date and status required' }, { status: 400 });

    // HR self-service: own only
    const record = await (db as any).employeeAttendance.create({
      data: {
        employeeId: auth.userId,
        date,
        status,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
