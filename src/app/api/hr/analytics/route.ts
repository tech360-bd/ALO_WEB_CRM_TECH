import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [employees, leaveRequests, payroll, devices, loginSecurity, notices, exits] = await Promise.all([
    db.employee.findMany(),
    db.leaveRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.payroll.findMany({ orderBy: { monthYear: "desc" }, take: 20 }),
    db.deviceManagement.findMany({ orderBy: { assignedDate: "desc" } }),
    db.loginSecurity.findMany({ orderBy: { loginTime: "desc" }, take: 20 }),
    db.noticeManagement.findMany(),
    db.exitManagement.findMany(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const attendance = await db.employeeAttendance.findMany({ where: { date: today } });
  const profiles = await db.employeeHR.findMany({ where: { employeeId: { in: employees.map((employee) => employee.employeeId) } } });
  const profileMap = Object.fromEntries(profiles.map((profile) => [profile.employeeId, profile]));
  const analytics = {
    headcount: employees.length, activeEmployees: employees.filter((employee) => employee.status.toUpperCase() === "ACTIVE").length,
    attendanceRate: attendance.length ? Math.round(attendance.filter((item) => item.status.toUpperCase() === "PRESENT").length / attendance.length * 100) : 0,
    lateToday: attendance.filter((item) => item.status.toUpperCase() === "LATE").length,
    absentToday: attendance.filter((item) => item.status.toUpperCase() === "ABSENT").length,
    onLeaveToday: attendance.filter((item) => item.status.toUpperCase() === "LEAVE").length,
    pendingLeaves: leaveRequests.filter((item) => item.status.toUpperCase() === "PENDING").length,
    payrollPending: payroll.filter((item) => item.status.toUpperCase() === "DRAFT").length,
    payrollPaid: payroll.filter((item) => item.status.toUpperCase() === "PAID").length,
    totalPayrollCost: payroll.filter((item) => item.status.toUpperCase() === "PAID").reduce((sum, item) => sum + item.netPay, 0),
    devicesAssigned: devices.filter((item) => item.status.toUpperCase() === "ASSIGNED").length,
    devicesReturned: devices.filter((item) => item.status.toUpperCase() === "RETURNED").length,
    activeNotices: notices.filter((item) => item.status.toUpperCase() === "ACTIVE").length,
    pendingExits: exits.filter((item) => item.status.toUpperCase() === "PENDING").length,
    probationEmployees: profiles.filter((profile) => profile.employmentType === "PROBATION").length,
    newJoiners: profiles.filter((profile) => new Date(profile.joiningDate) > new Date(Date.now() - 30 * 86400000)).length,
  };
  return NextResponse.json({ analytics, employees: employees.map((employee) => ({ ...employee, hrProfile: profileMap[employee.employeeId] || null })), leaveRequests, payroll, devices, loginSecurity, notices, exits, attendance, upcomingBirthdays: [] });
}
