import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

function roleSet(auth: AuthContext): Set<string> {
  return new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
}

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    const roles = roleSet(auth);
    const isSuperAdmin = roles.has('super_admin');
    const isHr = roles.has('hr_manager') || roles.has('hr');
    const canAccessHrAnalytics = auth.permissions.some((permission) => ['employee.dashboard.view_all', 'hp1', 'hp4', 'ad2'].includes(permission));
    if (roles.has('student') || roles.has('partner') || (!isSuperAdmin && (!isHr || !canAccessHrAnalytics))) {
      return NextResponse.json({ success: false, error: 'HR analytics require an authorized HR role and permission.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }

    if (!isSuperAdmin) {
      const currentEmployee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } }).catch(() => null);
      if (!currentEmployee || currentEmployee.status.toLowerCase() !== 'active') {
        return NextResponse.json({ success: false, error: 'An active HR employee account is required.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
      }
    }

    const canViewPayroll = isSuperAdmin || auth.permissions.some((permission) => ['hp1', 'f1', 'employee.salary.view_all'].includes(permission));
    const canViewDevices = isSuperAdmin || roles.has('it') || roles.has('operations') || auth.permissions.includes('ad2');
    const canViewLoginSecurity = isSuperAdmin || roles.has('security_admin') || auth.permissions.includes('ad2');

    try {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [employees, hrProfiles, leaveRequests, pendingLeaves, payroll, payrollPending, payrollPaidCount, totalPayroll, devices, deviceAssigned, deviceReturned, loginSecurity, notices, activeNotices, exits, pendingExits, attendance, attendanceRows] = await Promise.all([
        db.employee.findMany({
          orderBy: { joinedAt: 'desc' },
          select: { id: true, userId: true, employeeId: true, name: true, email: true, phone: true, designation: true, department: true, branch: true, role: true, status: true, joinedAt: true, offices: { select: { id: true, name: true } } },
        }),
        db.employeeHR.findMany({ where: { isDeleted: false }, select: { userId: true, employeeId: true, employmentType: true, employmentStatus: true, joiningDate: true, department: true } }),
        db.leaveRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, employeeId: true, leaveType: true, startDate: true, endDate: true, days: true, reason: true, status: true, approvedBy: true, approvedAt: true, reviewNote: true, createdAt: true } }),
        db.leaveRequest.count({ where: { status: { in: ['PENDING', 'pending'] } } }),
        canViewPayroll ? db.payroll.findMany({ orderBy: { monthYear: 'desc' }, take: 20, select: { id: true, employeeId: true, monthYear: true, basicSalary: true, allowances: true, bonus: true, overtime: true, loanDeduction: true, advanceDeduction: true, taxDeduction: true, providentFund: true, insuranceDeduction: true, totalEarnings: true, totalDeductions: true, netPay: true, status: true, approvedBy: true, paidAt: true, createdAt: true } }) : Promise.resolve([]),
        canViewPayroll ? db.payroll.count({ where: { status: 'DRAFT' } }) : Promise.resolve(null),
        canViewPayroll ? db.payroll.count({ where: { status: 'PAID' } }) : Promise.resolve(null),
        canViewPayroll ? db.payroll.aggregate({ where: { status: 'PAID' }, _sum: { netPay: true } }) : Promise.resolve(null),
        canViewDevices ? db.deviceManagement.findMany({ orderBy: { assignedDate: 'desc' }, take: 200 }) : Promise.resolve([]),
        canViewDevices ? db.deviceManagement.count({ where: { status: 'ASSIGNED' } }) : Promise.resolve(null),
        canViewDevices ? db.deviceManagement.count({ where: { status: 'RETURNED' } }) : Promise.resolve(null),
        canViewLoginSecurity ? db.loginSecurity.findMany({ orderBy: { loginTime: 'desc' }, take: 20, select: { id: true, userId: true, ipAddress: true, browser: true, operatingSystem: true, location: true, loginTime: true, logoutTime: true, sessionStatus: true, failedAttempts: true } }) : Promise.resolve([]),
        db.noticeManagement.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
        db.noticeManagement.count({ where: { status: 'ACTIVE' } }),
        db.exitManagement.findMany({ orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, employeeId: true, exitType: true, exitDate: true, clearanceStatus: true, status: true, createdAt: true, ...(canViewPayroll ? { finalSettlement: true } : {}) } }),
        db.exitManagement.count({ where: { status: 'PENDING' } }),
        db.employeeAttendance.findMany({ where: { date: today }, select: { id: true, employeeId: true, date: true, status: true } }),
        db.employeeAttendance.count({ where: { date: today } }),
      ]);

      const hrByUser = new Map(hrProfiles.map((profile) => [profile.userId, profile]));
      const employeeView = employees.map((employee) => {
        const profile = hrByUser.get(employee.userId);
        const departmentName = employee.department || profile?.department || '';
        return {
          id: employee.id,
          userId: employee.userId,
          employeeCode: profile?.employeeId || employee.employeeId,
          fullName: employee.name,
          companyEmail: employee.email,
          phone: employee.phone,
          designation: employee.designation || '',
          department: departmentName ? { id: departmentName, name: departmentName } : null,
          office: employee.offices[0] || null,
          joiningDate: profile?.joiningDate || employee.joinedAt.toISOString().slice(0, 10),
          employmentType: profile?.employmentType || 'Not recorded',
          profileStatus: employee.status,
          status: employee.status,
          role: employee.role,
        };
      });

      const analytics = {
        headcount: employees.length,
        activeEmployees: employees.filter((employee) => employee.status.toLowerCase() === 'active').length,
        attendanceRate: null,
        attendanceRateNote: 'Not calculated: attendance rows and employee identifiers do not establish a verified expected-workforce denominator.',
        lateToday: attendance.filter((item) => item.status.toUpperCase() === 'LATE').length,
        absentToday: attendance.filter((item) => item.status.toUpperCase() === 'ABSENT').length,
        onLeaveToday: attendance.filter((item) => item.status.toUpperCase() === 'LEAVE').length,
        attendanceRecordsToday: attendanceRows,
        pendingLeaves,
        payrollPending,
        payrollPaid: payrollPaidCount,
        totalPayrollCost: totalPayroll?._sum.netPay ?? null,
        devicesAssigned: deviceAssigned,
        devicesReturned: deviceReturned,
        activeNotices,
        pendingExits,
        probationEmployees: hrProfiles.filter((profile) => profile.employmentStatus.toUpperCase() === 'PROBATION' || profile.employmentType.toUpperCase() === 'PROBATION').length,
        newJoiners: employees.filter((employee) => employee.joinedAt >= thirtyDaysAgo).length,
      };

      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'HR_ANALYTICS_VIEWED',
          entityType: 'EmployeeHRAnalytics',
          entityId: auth.userId,
          metadata: JSON.stringify({ effectiveUserId: auth.userId, canViewPayroll, canViewDevices, canViewLoginSecurity, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 191) || '',
          userAgent: request.headers.get('user-agent')?.slice(0, 191) || '',
        },
      });

      return NextResponse.json({
        success: true,
        analytics,
        employees: employeeView,
        leaveRequests,
        payroll,
        devices,
        loginSecurity,
        notices,
        exits,
        attendance,
        upcomingBirthdays: [],
        permissions: { canViewPayroll, canViewDevices, canViewLoginSecurity, privateDatesVisible: false },
      }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
      return NextResponse.json({ success: false, error: 'HR analytics are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  })(request);
}
