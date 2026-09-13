import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'counselor';
    const employeeId = searchParams.get('employeeId');

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    const where: any = { reportType: type };
    if (employeeId) {
      if (!isSuper && employeeId !== auth.userId) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
      where.employeeId = employeeId;
    } else if (!isSuper) {
      where.employeeId = auth.userId;
    }

    const reports = await db.weeklyReport.findMany({ where, orderBy: { generatedAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, reports, count: reports.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('branch_manager');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

    const body = await req.json();
    const { employeeId, reportType, periodStart, periodEnd, data } = body;
    if (!employeeId || !reportType) return NextResponse.json({ success: false, error: 'employeeId and reportType required' }, { status: 400 });

    const report = await db.weeklyReport.create({
      data: {
        employeeId,
        reportType,
        periodStart: periodStart || new Date().toISOString().split('T')[0],
        periodEnd: periodEnd || new Date().toISOString().split('T')[0],
        data: JSON.stringify(data || {}),
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
