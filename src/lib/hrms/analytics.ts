// HR analytics derived from canonical employee records. Sensitive payroll and
// private date lists are omitted unless a separately authorized permission exists.
import { db } from '@/lib/db';

export type HrAnalytics = {
  headcount: number;
  activeEmployees: number;
  attendanceRate: number | null;
  latePercent: number | null;
  absentPercent: number | null;
  leavePercent: number | null;
  payrollCost: number | null;
  departmentCost: Record<string, number> | null;
  newJoiners: number;
  resignedEmployees: number;
  probationEmployees: number;
  upcomingConfirmation: number;
  upcomingBirthday: { employeeId: string; fullName: string; dob: string; daysLeft: number }[] | null;
  upcomingWorkAnniversary: { employeeId: string; fullName: string; joiningDate: string; years: number }[] | null;
  branchBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  attendanceNote: string;
  privateDatesNote: string;
};

export async function computeHrAnalytics(options: { includePayroll: boolean }): Promise<HrAnalytics> {
  const now = new Date();
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const month = localDate.slice(0, 7);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [employees, hrProfiles, attendance, payroll, payrollProfiles] = await Promise.all([
    db.employee.findMany({ select: { id: true, userId: true, employeeId: true, branch: true, department: true, designation: true, status: true, joinedAt: true } }),
    db.employeeHR.findMany({
      where: { isDeleted: false },
      select: { userId: true, employeeId: true, employmentType: true, employmentStatus: true, status: true, probationEndDate: true },
    }),
    db.employeeAttendance.findMany({ where: { date: localDate }, select: { employeeId: true, status: true } }),
    options.includePayroll
      ? db.payroll.findMany({ where: { monthYear: month }, select: { netPay: true, status: true, employeeId: true } })
      : Promise.resolve([]),
    options.includePayroll
      ? db.employeeHR.findMany({ where: { isDeleted: false }, select: { department: true, grossSalary: true, baseSalary: true } })
      : Promise.resolve([]),
  ]);

  const active = employees.filter((employee) => employee.status.toLowerCase() === 'active');
  const hrByUser = new Map(hrProfiles.map((profile) => [profile.userId, profile]));
  const activeIdentities = new Set<string>();
  for (const employee of active) {
    for (const value of [employee.userId, employee.employeeId, employee.id, hrByUser.get(employee.userId)?.employeeId]) {
      if (value) activeIdentities.add(value);
    }
  }
  const relevantAttendance = attendance.filter((record) => activeIdentities.has(record.employeeId));
  const late = relevantAttendance.filter((record) => record.status.toLowerCase() === 'late').length;
  const absent = relevantAttendance.filter((record) => record.status.toLowerCase() === 'absent').length;
  const onLeave = relevantAttendance.filter((record) => record.status.toLowerCase() === 'leave').length;

  const statusBreakdown: Record<string, number> = {};
  const branchBreakdown: Record<string, number> = {};
  for (const employee of employees) {
    const status = employee.status || 'UNKNOWN';
    const branch = employee.branch || 'Unassigned';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    branchBreakdown[branch] = (branchBreakdown[branch] || 0) + 1;
  }

  const payrollCost = options.includePayroll
    ? payroll.filter((row) => row.status.toUpperCase() === 'PAID').reduce((total, row) => total + row.netPay, 0)
    : null;
  const departmentCost: Record<string, number> | null = options.includePayroll ? {} : null;
  if (departmentCost) {
    for (const profile of payrollProfiles) {
      const department = profile.department || 'Unassigned';
      departmentCost[department] = (departmentCost[department] || 0) + (profile.grossSalary || profile.baseSalary || 0);
    }
  }

  return {
    headcount: employees.length,
    activeEmployees: active.length,
    attendanceRate: null,
    latePercent: null,
    absentPercent: null,
    leavePercent: null,
    payrollCost,
    departmentCost,
    newJoiners: employees.filter((employee) => employee.joinedAt >= thirtyDaysAgo).length,
    resignedEmployees: employees.filter((employee) => ['RESIGNED', 'TERMINATED'].includes(employee.status.toUpperCase())).length,
    probationEmployees: hrProfiles.filter((profile) => profile.employmentStatus.toUpperCase() === 'PROBATION' || profile.employmentType.toUpperCase() === 'PROBATION').length,
    upcomingConfirmation: hrProfiles.filter((profile) => {
      if (!profile.probationEndDate) return false;
      const date = new Date(profile.probationEndDate);
      const days = Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return !Number.isNaN(date.getTime()) && days >= 0 && days <= 30;
    }).length,
    // Birthday and personal joining-date lists require a dedicated private-profile permission.
    upcomingBirthday: null,
    upcomingWorkAnniversary: null,
    branchBreakdown,
    statusBreakdown,
    attendanceNote: `Not calculated: attendance rows are not a verified expected-workforce denominator. ${relevantAttendance.length} attendance records are available for ${localDate}; recorded late=${late}, absent=${absent}, leave=${onLeave}.`,
    privateDatesNote: 'Employee birthdays and individual work-anniversary dates are omitted from this aggregate endpoint.',
  };
}
