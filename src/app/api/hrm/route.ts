import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// HRM dashboard — employees, attendance, salary, performance
export async function GET() {
  const employees = await db.employeeHR.findMany({ orderBy: { createdAt: "desc" } });

  // Fetch user info for employees
  const userIds = Array.from(new Set(employees.map((e) => e.userId).filter(Boolean)));
  const users = userIds.length > 0 ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } }) : [];
  const umap: Record<string, any> = {};
  for (const u of users) umap[u.id] = u;
  const employeesWithUser = employees.map((e) => ({ ...e, user: umap[e.userId] || null }));

  const attendance = await db.employeeAttendance.findMany({ orderBy: { date: "desc" }, take: 100 });
  const commissions = await db.employeeCommission.findMany({ orderBy: { createdAt: "desc" } });
  const bonuses = await db.employeeBonus.findMany({ orderBy: { createdAt: "desc" } });
  const increments = await db.employeeIncrement.findMany({ orderBy: { createdAt: "desc" } });
  const performance = await db.employeePerformance.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.date === today);

  return NextResponse.json({
    metrics: {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "ACTIVE").length,
      presentToday: todayAttendance.filter((a) => a.status === "PRESENT").length,
      lateToday: todayAttendance.filter((a) => a.status === "LATE").length,
      onLeaveToday: todayAttendance.filter((a) => a.status === "LEAVE").length,
      totalPayroll: employees.reduce((s, e) => s + e.baseSalary, 0),
      avgPerformance: employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length) : 0,
      pendingCommissions: commissions.filter((c) => c.status === "PENDING").length,
      pendingBonuses: bonuses.filter((b) => b.status === "PENDING").length,
    },
    employees: employeesWithUser,
    attendance: attendance.slice(0, 30),
    commissions: commissions.slice(0, 15),
    bonuses: bonuses.slice(0, 10),
    increments: increments.slice(0, 10),
    performance,
  });
}
