import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { widgetsForRole } from '@/lib/hrms/rbac';

function normalizedRole(value: string): string {
  return value.trim().replace(/[\s-]+/g, '_').toLowerCase();
}

function dhakaDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;

  if (['STUDENT', 'PARTNER'].includes(auth.userType.toUpperCase())) {
    return NextResponse.json({ success: false, error: 'HR widgets require an employee account.' }, { status: 403 });
  }

  const isSuperAdmin = auth.roles.some((role) => role.toLowerCase() === 'super_admin');
  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, userId: true, employeeId: true, role: true, status: true, branch: true },
  });
  if (!isSuperAdmin && (!employee || employee.status.toLowerCase() !== 'active')) {
    return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  }

  // A query-string role is intentionally ignored; the server-assigned employee
  // role and current permission set determine which data is loaded.
  const role = normalizedRole(employee?.role || auth.roles.find((item) => !['employee'].includes(normalizedRole(item))) || auth.userType);
  const roles = new Set([auth.userType, ...auth.roles, role].map(normalizedRole));
  const isHr = isSuperAdmin || roles.has('hr_manager') || roles.has('hr');
  const isFinance = isSuperAdmin || roles.has('finance') || roles.has('finance_officer') || roles.has('accounts');
  const isManager = ['manager', 'team_leader', 'branch_manager', 'office_manager'].some((item) => roles.has(item));
  const canViewOwnSalary = auth.userId === employee?.userId && (auth.permissions.includes('h6') || auth.permissions.includes('employee.salary.view'));
  const canViewPayrollTotal = isSuperAdmin || isFinance || auth.permissions.includes('employee.salary.view_all');

  try {
    const today = dhakaDate();
    const month = today.slice(0, 7);
    const hrProfile = employee
      ? await db.employeeHR.findUnique({ where: { userId: auth.userId }, select: { employeeId: true, reportingManagerId: true } }).catch(() => null)
      : null;
    const employeeKeys = [...new Set([employee?.id, employee?.employeeId, employee?.userId, hrProfile?.employeeId].filter((value): value is string => Boolean(value)))];
    const ownEmployeeKey = hrProfile?.employeeId || employee?.employeeId || employee?.id || '';

    const [attendance, pendingLeaves, ownDocuments, ownPayroll] = employeeKeys.length ? await Promise.all([
      db.employeeAttendance.findFirst({ where: { employeeId: { in: employeeKeys }, date: today }, select: { status: true, clockIn: true, clockOut: true, hoursWorked: true } }),
      db.leaveRequest.count({ where: { employeeId: { in: employeeKeys }, status: { in: ['PENDING', 'pending'] } } }),
      db.employeeDocument.count({ where: { employeeId: { in: employeeKeys }, isDeleted: false } }),
      db.employeePayroll.findFirst({ where: { employeeId: { in: employeeKeys }, period: month }, select: { status: true, netSalary: true } }),
    ]) : [null, 0, 0, null];

    const own = {
      attendance: attendance || null,
      pendingLeaves,
      documentsCount: ownDocuments,
      missingMandatory: null,
      salaryStatus: ownPayroll?.status || null,
      ...(canViewOwnSalary && ownPayroll ? { netPay: ownPayroll.netSalary } : {}),
    };

    const data: Record<string, unknown> = {
      role,
      allowed: widgetsForRole(role),
      own,
      quick: {},
    };

    if (isManager && employee) {
      let teamEmployees: Array<{ employeeId: string; userId: string }> = [];
      if (roles.has('branch_manager') && employee.branch) {
        const branchUsers = await db.employee.findMany({
          where: { branch: employee.branch, status: { in: ['active', 'ACTIVE'] }, userId: { not: auth.userId } },
          select: { id: true, employeeId: true, userId: true },
          take: 500,
        });
        const profileRows = branchUsers.length
          ? await db.employeeHR.findMany({ where: { userId: { in: branchUsers.map((item) => item.userId) } }, select: { employeeId: true, userId: true } })
          : [];
        teamEmployees = branchUsers.map((item) => ({ employeeId: profileRows.find((profile) => profile.userId === item.userId)?.employeeId || item.employeeId || item.id, userId: item.userId }));
      } else if (hrProfile?.reportingManagerId) {
        teamEmployees = await db.employeeHR.findMany({
          where: { reportingManagerId: auth.userId },
          select: { employeeId: true, userId: true },
          take: 500,
        });
      }
      const teamKeys = [...new Set(teamEmployees.flatMap((item) => [item.employeeId, item.userId]).filter(Boolean))];
      const teamAttendance = teamKeys.length
        ? await db.employeeAttendance.findMany({ where: { employeeId: { in: teamKeys }, date: today }, select: { status: true } })
        : [];
      const teamPendingLeave = teamKeys.length
        ? await db.leaveRequest.count({ where: { employeeId: { in: teamKeys }, status: { in: ['PENDING', 'pending'] } } })
        : 0;
      data.team = {
        count: teamEmployees.length,
        present: teamAttendance.filter((item) => ['present', 'late'].includes(item.status.toLowerCase())).length,
        late: teamAttendance.filter((item) => item.status.toLowerCase() === 'late').length,
        attendanceRecords: teamAttendance.length,
        pendingLeave: teamPendingLeave,
      };
    }

    if (isHr || isFinance) {
      const [headcount, activeEmployees, pendingLeave, pendingDocuments, payrollPending, newJoiners, todayAttendance, payrollCost] = await Promise.all([
        isHr ? db.employee.count() : Promise.resolve(null),
        isHr ? db.employee.count({ where: { status: { in: ['active', 'ACTIVE'] } } }) : Promise.resolve(null),
        isHr ? db.leaveRequest.count({ where: { status: { in: ['PENDING', 'pending'] } } }) : Promise.resolve(null),
        isHr ? db.employeeDocument.count({ where: { status: { in: ['pending', 'PENDING'] }, isDeleted: false } }) : Promise.resolve(null),
        isHr || isFinance ? db.employeePayroll.count({ where: { status: { in: ['draft', 'review_pending', 'reviewed', 'DRAFT', 'REVIEW_PENDING', 'REVIEWED'] } } }) : Promise.resolve(null),
        isHr ? db.employee.count({ where: { joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }) : Promise.resolve(null),
        isHr ? db.employeeAttendance.findMany({ where: { date: today }, select: { status: true } }) : Promise.resolve([]),
        canViewPayrollTotal ? db.employeePayroll.aggregate({ where: { period: month, status: { in: ['paid', 'PAID'] } }, _sum: { netSalary: true } }) : Promise.resolve(null),
      ]);
      const attendanceRecords = todayAttendance as Array<{ status: string }>;
      const presentToday = attendanceRecords.filter((item) => ['present', 'late'].includes(item.status.toLowerCase())).length;
      data.analytics = {
        ...(isHr ? { headcount, activeEmployees, pendingLeave, pendingDocuments, newJoiners } : {}),
        ...(isHr ? { attendance: { present: presentToday, late: attendanceRecords.filter((item) => item.status.toLowerCase() === 'late').length, recorded: attendanceRecords.length } } : {}),
        ...(isFinance ? { payrollPending } : {}),
        ...(canViewPayrollTotal ? { payrollCost: payrollCost?._sum?.netSalary ?? null } : {}),
      };
      data.widgets = data.analytics;
      data.quick = {
        ...(isHr ? { pendingLeave, joiningToday: newJoiners, documentsPending: pendingDocuments } : {}),
        ...(isFinance ? { payrollPending } : {}),
      };
    }

    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        action: 'EMPLOYEE_HR_WIDGETS_VIEWED',
        entityType: 'EmployeeDashboard',
        entityId: auth.userId,
        metadata: JSON.stringify({ effectiveUserId: auth.userId, role, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
      },
    });

    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'HR widget data is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
