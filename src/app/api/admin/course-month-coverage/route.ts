import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';

export const dynamic = 'force-dynamic';

/** Super Admin review queue. Pending source evidence is never exposed publicly. */
export async function GET(request: Request) {
  const guard = await requireMonitoringAdmin(request);
  if (!guard.ok) return guard.response;

  const params = new URL(request.url).searchParams;
  const approvalStatus = params.get('approvalStatus') || 'PENDING';
  const calendarMonth = params.get('calendarMonth');
  const limit = Math.min(Math.max(Number(params.get('limit') || 50), 1), 200);
  if (calendarMonth && !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(calendarMonth)) {
    return NextResponse.json({ success: false, error: 'calendarMonth must use YYYY-MM.' }, { status: 400 });
  }
  if (approvalStatus !== 'ALL' && !['PENDING', 'APPROVED', 'REJECTED'].includes(approvalStatus)) {
    return NextResponse.json({ success: false, error: 'approvalStatus must be PENDING, APPROVED, REJECTED or ALL.' }, { status: 400 });
  }
  const where: { approvalStatus?: string; calendarMonth?: string } = {};
  if (approvalStatus !== 'ALL') where.approvalStatus = approvalStatus;
  if (calendarMonth) where.calendarMonth = calendarMonth;

  const [records, total] = await Promise.all([
    db.courseMonthCoverage.findMany({
      where,
      orderBy: [{ calendarMonth: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      include: { course: { select: { courseId: true, courseTitle: true, slug: true, officialUrl: true, university: { select: { name: true, slug: true, country: true, website: true } } } } },
    }),
    db.courseMonthCoverage.count({ where }),
  ]);
  return NextResponse.json({ success: true, records, total, limit, approvalStatus });
}
