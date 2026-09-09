import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE REPORTS API
// GET — Aggregated performance data, task completion stats,
//       student counts by stage, application pipeline stats
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.id || auth.userId;

      // ---- TASK COMPLETION STATS ----
      const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
        db.counselorTask.count({ where: { employeeId } }),
        db.counselorTask.count({ where: { employeeId, status: 'completed' } }),
        db.counselorTask.count({ where: { employeeId, status: 'pending' } }),
        db.counselorTask.count({
          where: {
            employeeId,
            status: 'pending',
            dueDate: { lt: new Date().toISOString().split('T')[0], not: '' },
          },
        }),
      ]);

      const inProgressTasks = await db.counselorTask.count({
        where: { employeeId, status: 'in_progress' },
      });

      // Task type breakdown
      const tasksByType = await db.counselorTask.groupBy({
        by: ['type'],
        where: { employeeId },
        _count: { id: true },
      });

      const tasksByPriority = await db.counselorTask.groupBy({
        by: ['priority'],
        where: { employeeId },
        _count: { id: true },
      });

      // ---- STUDENT STATS ----
      const totalStudents = await db.portalStudentProfile.count({
        where: { counselorId: auth.userId },
      });

      const studentsByStage = await db.portalStudentProfile.groupBy({
        by: ['journeyStage'],
        where: { counselorId: auth.userId },
        _count: { id: true },
      });

      // ---- APPLICATION PIPELINE ----
      // Get counselor's student profile IDs
      const counselorStudents = await db.portalStudentProfile.findMany({
        where: { counselorId: auth.userId },
        select: { id: true },
      });
      const studentIds = counselorStudents.map(s => s.id);

      let applicationsByStage: Array<{ stage: string; _count: { id: number } }> = [];
      let totalApplications = 0;
      let applicationsByCountry: Array<{ country: string; _count: { id: number } }> = [];

      if (studentIds.length > 0) {
        [applicationsByStage, totalApplications, applicationsByCountry] = await Promise.all([
          db.portalStudentApplication.groupBy({
            by: ['stage'],
            where: { studentProfileId: { in: studentIds } },
            _count: { id: true },
          }),
          db.portalStudentApplication.count({
            where: { studentProfileId: { in: studentIds } },
          }),
          db.portalStudentApplication.groupBy({
            by: ['country'],
            where: { studentProfileId: { in: studentIds } },
            _count: { id: true },
          }),
        ]);
      }

      // ---- DOCUMENT STATS ----
      let documentsByStatus: Array<{ status: string; _count: { id: number } }> = [];
      if (studentIds.length > 0) {
        const grouped = await db.portalStudentDocument.groupBy({
          by: ['status'] as const,
          where: { studentProfileId: { in: studentIds } },
          _count: { id: true },
        });
        documentsByStatus = grouped.map(g => ({ status: g.status, _count: { id: g._count.id } }));
      }

      // ---- ATTENDANCE STATS (this month) ----
      const currentMonth = new Date().toISOString().substring(0, 7);
      let attendanceStats = { present: 0, absent: 0, late: 0, leave: 0, avgHours: 0 };

      try {
        const attendanceRecords = await db.employeeAttendance.findMany({
          where: {
            employeeId: profile?.employeeId || auth.userId,
            date: { startsWith: currentMonth },
          },
        });

        attendanceStats = {
          present: attendanceRecords.filter(r => r.status === 'present').length,
          absent: attendanceRecords.filter(r => r.status === 'absent').length,
          late: attendanceRecords.filter(r => r.status === 'late').length,
          leave: attendanceRecords.filter(r => r.status === 'leave').length,
          avgHours: attendanceRecords.length > 0
            ? Math.round(
                (attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0) / attendanceRecords.length) * 100
              ) / 100
            : 0,
        };
      } catch {
        // Attendance table may not exist
      }

      // ---- PERFORMANCE STATS (latest) ----
      type PerformanceRecord = Awaited<ReturnType<typeof db.employeePerformance.findFirst>>;
      let performanceRecord: PerformanceRecord = null;
      try {
        performanceRecord = await db.employeePerformance.findFirst({
          where: { employeeId: profile?.employeeId || auth.userId },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        // Performance table may not exist
      }

      return NextResponse.json({
        success: true,
        data: {
          taskStats: {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            inProgress: inProgressTasks,
            overdue: overdueTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            byType: tasksByType.map(t => ({ type: t.type, count: t._count.id })),
            byPriority: tasksByPriority.map(p => ({ priority: p.priority, count: p._count.id })),
          },
          studentStats: {
            total: totalStudents,
            byStage: studentsByStage.map(s => ({ stage: s.journeyStage, count: s._count.id })),
          },
          applicationStats: {
            total: totalApplications,
            byStage: applicationsByStage.map(a => ({ stage: a.stage, count: a._count.id })),
            byCountry: applicationsByCountry.map(a => ({ country: a.country, count: a._count.id })),
          },
          documentStats: {
            byStatus: documentsByStatus.map(d => ({ status: d.status, count: d._count.id })),
          },
          attendanceStats,
          performance: performanceRecord
            ? {
                score: performanceRecord.score,
                managerRating: performanceRecord.managerRating,
                period: performanceRecord.period,
                achievedLeads: performanceRecord.achievedLeads,
                targetLeads: performanceRecord.targetLeads,
                achievedRevenue: performanceRecord.achievedRevenue,
                targetRevenue: performanceRecord.targetRevenue,
              }
            : null,
        },
      });
    } catch (error) {
      console.error('Employee reports GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: {
            taskStats: { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0, completionRate: 0, byType: [], byPriority: [] },
            studentStats: { total: 0, byStage: [] },
            applicationStats: { total: 0, byStage: [], byCountry: [] },
            documentStats: { byStatus: [] },
            attendanceStats: { present: 0, absent: 0, late: 0, leave: 0, avgHours: 0 },
            performance: null,
          },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load reports' },
        { status: 500 }
      );
    }
  })(request);
}
