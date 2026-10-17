import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — HR dashboard with all HR data
export async function GET(req: NextRequest) {
  const [employees, leaveRequests, payroll, devices, loginSecurity, notices, exits] = await Promise.all([
    db.employee.findMany({ include: { department: true, office: true, profile: true, salary: true } }),
    db.leaveRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.payroll.findMany({ orderBy: { monthYear: "desc" }, take: 20 }),
    db.deviceManagement.findMany({ orderBy: { assignedDate: "desc" } }),
    db.loginSecurity.findMany({ orderBy: { loginTime: "desc" }, take: 20 }),
    db.noticeManagement.findMany(),
    db.exitManagement.findMany(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const attendance = await db.employeeAttendance.findMany({ where: { date: today } });

  // HR Analytics
  const analytics = {
    headcount: employees.length,
    activeEmployees: employees.filter((e) => e.status === "ACTIVE").length,
    attendanceRate: attendance.length > 0 ? Math.round((attendance.filter((a) => a.status === "PRESENT").length / attendance.length) * 100) : 0,
    lateToday: attendance.filter((a) => a.status === "LATE").length,
    absentToday: attendance.filter((a) => a.status === "ABSENT").length,
    onLeaveToday: attendance.filter((a) => a.status === "LEAVE").length,
    pendingLeaves: leaveRequests.filter((l) => l.status === "PENDING").length,
    payrollPending: payroll.filter((p) => p.status === "DRAFT").length,
    payrollPaid: payroll.filter((p) => p.status === "PAID").length,
    totalPayrollCost: payroll.filter((p) => p.status === "PAID").reduce((s, p) => s + p.netPay, 0),
    devicesAssigned: devices.filter((d) => d.status === "ASSIGNED").length,
    devicesReturned: devices.filter((d) => d.status === "RETURNED").length,
    activeNotices: notices.filter((n) => n.status === "ACTIVE").length,
    pendingExits: exits.filter((e) => e.status === "PENDING").length,
    probationEmployees: employees.filter((e) => e.employmentType === "PROBATION").length,
    newJoiners: employees.filter((e) => new Date(e.joiningDate) > new Date(Date.now() - 30 * 86400000)).length,
  };

  // Upcoming birthdays & anniversaries
  const upcomingBirthdays = employees.filter((e) => e.profile?.dob).map((e) => {
    const dob = new Date(e.profile!.dob!);
    const nextBirthday = new Date(new Date().getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBirthday < new Date()) nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    const days = Math.ceil((nextBirthday.getTime() - Date.now()) / 86400000);
    return { name: e.fullName, dob: e.profile!.dob, days, employeeId: e.employeeCode };
  }).filter((b) => b.days <= 30).sort((a, b) => a.days - b.days);

  return NextResponse.json({
    analytics,
    employees,
    leaveRequests,
    payroll,
    devices,
    loginSecurity,
    notices,
    exits,
    upcomingBirthdays,
    attendance,
  });
}
