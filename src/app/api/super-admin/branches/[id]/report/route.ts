// GET /api/super-admin/branches/{id}/report
//
// Per-branch report. Metrics the schema cannot derive per branch are returned
// as `null` with an explicit reason, never as a zero that reads like "nothing
// happened here".

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const office = await db.office.findUnique({ where: { id } });
    if (!office) return notFound('Branch not found.');

    const labels = [office.code, office.name].filter(Boolean);
    const employees = await db.employee.findMany({
      where: { branch: { in: labels } },
      select: { userId: true, employeeId: true, name: true, role: true, status: true, isOnline: true },
    });
    const employeeUserIds = employees.map((row) => row.userId);

    const [leadCounts, dueFollowUps, overdueFollowUps, openTasks, completedTasks] = await Promise.all([
      db.lead.groupBy({ by: ['status'], where: { branch: { in: labels } }, _count: { _all: true } }).catch(() => []),
      db.lead.count({ where: { branch: { in: labels }, followUpDate: { gte: new Date() } } }).catch(() => null),
      db.lead.count({ where: { branch: { in: labels }, followUpDate: { lt: new Date() } } }).catch(() => null),
      db.task.count({ where: { assigneeId: { in: employeeUserIds }, status: { in: ['PENDING', 'IN_PROGRESS'] } } }).catch(() => null),
      db.task.count({ where: { assigneeId: { in: employeeUserIds }, status: 'COMPLETED' } }).catch(() => null),
    ]);

    const leadsByStatus: Record<string, number> = {};
    for (const row of leadCounts) leadsByStatus[row.status || 'UNKNOWN'] = row._count._all;
    const totalLeads = Object.values(leadsByStatus).reduce((sum, value) => sum + value, 0);

    const counselorPerformance = employees
      .filter((row) => ['COUNSELOR', 'SENIOR_COUNSELOR'].includes(row.role.toUpperCase()))
      .map((row) => ({ employeeCode: row.employeeId, name: row.name, online: row.isOnline }));

    await logAuditAction(auth, 'BRANCH_REPORT_VIEWED', 'Office', id, { branchCode: office.code });

    return NextResponse.json({
      success: true,
      branch: { id: office.id, code: office.code, name: office.name, city: office.city, country: office.country, status: office.status },
      report: {
        employees: employees.length,
        activeEmployees: employees.filter((row) => row.status.toLowerCase() === 'active').length,
        leadsByStatus,
        totalLeads,
        followUpsDue: dueFollowUps,
        overdueFollowUps,
        openTasks,
        completedTasks,
        counselorPerformance,
      },
      unavailableMetrics: [
        { metric: 'studentsByBranch', reason: 'Student rows carry a free-text currentCity and no office relation.' },
        { metric: 'applicationsByBranch', reason: 'The applications table has no branch column.' },
        { metric: 'visaReadinessByBranch', reason: 'Visa cases are keyed by destination country, not by branch.' },
        { metric: 'financeSummaryByBranch', reason: 'Payments are linked to a student, not to a branch.' },
        { metric: 'marketingPerformanceByBranch', reason: 'Campaigns are not branch-scoped.' },
        { metric: 'documentPendingByBranch', reason: 'Documents are linked to a student, not to a branch.' },
      ],
      requiredFix:
        'Add branchId to Application/Payment/Document (or a Student→Office relation) and backfill, then these metrics become derivable.',
    });
  } catch (error) {
    return unavailable('super-admin/branches/{id}/report', error);
  }
}

export const GET = withAuth(handleGet);
