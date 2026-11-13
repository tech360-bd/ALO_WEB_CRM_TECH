import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';

function canViewHrDashboard(auth: AuthContext): boolean {
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  return roles.has('super_admin') || roles.has('hr_manager') || roles.has('hr') || auth.permissions.includes('employee.hr.dashboard.view');
}

function canViewPayroll(auth: AuthContext): boolean {
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  return roles.has('super_admin') || auth.permissions.some((permission) => ['hp1', 'f1', 'employee.salary.view_all'].includes(permission));
}

function dhakaDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;
  if (!canViewHrDashboard(auth)) return NextResponse.json({ success: false, error: 'HR dashboard permission required.' }, { status: 403 });
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  const isSuperAdmin = roles.has('super_admin');
  const canSeePayroll = canViewPayroll(auth);
  const canSeeSecurity = isSuperAdmin || auth.permissions.includes('ad2');
  if (!isSuperAdmin) {
    const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } }).catch(() => null);
    if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active HR employee account is required.' }, { status: 403 });
  }

  try {
    const today = dhakaDate();
    const month = today.slice(0, 7);
    const [totalEmployees, activeEmployees, pendingActivation, pendingLeave, pendingDocs, payrollDraft, agreementsPending, attendanceToday, deviceTotal, unresolvedSecurity, auditLogs, payrollCost] = await Promise.all([
      db.employee.count(),
      db.employee.count({ where: { status: { in: ['active', 'ACTIVE'] } } }),
      db.portalUser.count({ where: { userType: 'EMPLOYEE', status: 'pending_activation' } }),
      db.employeeLeave.count({ where: { status: { in: ['PENDING', 'pending'] } } }),
      db.employeeDocument.count({ where: { status: { in: ['pending', 'PENDING'] }, isDeleted: false } }),
      canSeePayroll ? db.employeePayroll.count({ where: { status: { in: ['draft', 'review_pending', 'DRAFT', 'REVIEW_PENDING'] }, period: month } }) : Promise.resolve(null),
      db.employeeAgreement.count({ where: { status: { in: ['pending', 'PENDING', 'review_pending', 'REVIEW_PENDING'] } } }),
      db.employeeAttendance.findMany({ where: { date: today }, select: { status: true } }),
      db.employeeDevice.count(),
      canSeeSecurity ? db.employeeSecurityEvent.count({ where: { isResolved: false } }) : Promise.resolve(null),
      canSeeSecurity ? db.employeeAuditLog.count() : Promise.resolve(null),
      canSeePayroll ? db.employeePayroll.aggregate({ where: { period: month, status: { in: ['paid', 'PAID'] } }, _sum: { netSalary: true } }) : Promise.resolve(null),
    ]);

    const attendance = {
      recorded: attendanceToday.length,
      present: attendanceToday.filter((record) => ['present', 'late'].includes(record.status.toLowerCase())).length,
      late: attendanceToday.filter((record) => record.status.toLowerCase() === 'late').length,
      absent: attendanceToday.filter((record) => record.status.toLowerCase() === 'absent').length,
      onLeave: attendanceToday.filter((record) => record.status.toLowerCase() === 'leave').length,
      attendanceRate: null,
      rateNote: 'Not calculated: attendance rows do not establish a complete expected-workforce denominator.',
    };
    const auditNow = new Date();
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        action: 'EMPLOYEE_HR_DASHBOARD_VIEWED',
        entityType: 'EmployeeHRDashboard',
        entityId: auth.userId,
        metadata: JSON.stringify({ effectiveUserId: auth.userId, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 191) || '',
        userAgent: req.headers.get('user-agent')?.slice(0, 191) || '',
      },
    });

    return NextResponse.json({
      success: true,
      hrDashboard: {
        employeeDirectory: { totalEmployees, activeEmployees, pendingActivation },
        employeeRequests: { pendingLeave, pendingDocs, payrollDraft, agreementsPending },
        profileReview: { pendingActivation },
        documents: { pendingReview: pendingDocs },
        attendance,
        leave: { pending: pendingLeave },
        payroll: { draft: payrollDraft, paidNetCost: payrollCost?._sum.netSalary ?? null, permitted: canSeePayroll },
        agreements: { pending: agreementsPending },
        devices: { total: deviceTotal },
        security: { unresolvedEvents: unresolvedSecurity, permitted: canSeeSecurity },
        reports: { auditLogs, permitted: canSeeSecurity },
        analytics: {
          headcount: totalEmployees,
          activeEmployees,
          attendance,
          newJoiners: null,
          resignedEmployees: null,
          probationEmployees: null,
          upcomingConfirmation: null,
          birthdays: null,
          workAnniversaries: null,
          expiringContracts: null,
          missingMandatoryDocuments: null,
          note: 'Unavailable fields are not fabricated; configure authoritative HR requirement and workforce calendars before reporting them.',
        },
      },
      audit: { recorded: auditNow.toISOString() },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'HR dashboard data is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
