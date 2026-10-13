import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN, HR_MANAGER only
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(_req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied. Requires SUPER_ADMIN, ADMIN, or HR_MANAGER role.' },
      { status: 403 },
    );
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalEmployees,
      presentToday,
      onLeave,
      departments,
      recentLeaves,
      attendanceSummary,
    ] = await Promise.all([
      // Total active employees
      db.employeeHR.count({ where: { status: 'ACTIVE' } }),

      // Present today
      db.attendance.count({
        where: {
          date: today,
          status: { in: ['PRESENT', 'LATE', 'OVERTIME'] },
        },
      }),

      // On leave today (approved leave requests covering today)
      db.leaveRequest.count({
        where: {
          status: 'APPROVED',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),

      // Department breakdown
      db.employeeHR.groupBy({
        by: ['department'],
        where: { status: 'ACTIVE', department: { not: null } },
        _count: true,
      }),

      // Recent leave requests (last 10)
      db.leaveRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          employeeId: true,
          type: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          reason: true,
          status: true,
          approvedBy: true,
          createdAt: true,
        },
      }),

      // Attendance summary for last 7 days
      db.attendance.groupBy({
        by: ['date', 'status'],
        where: {
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        onLeave,
        departments: departments.map((d) => ({
          name: d.department,
          count: d._count,
        })),
        recentLeaves,
        attendanceSummary,
      },
    });
  } catch (error) {
    console.error('Error fetching HR dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch HR dashboard data.' },
      { status: 500 },
    );
  }
}
