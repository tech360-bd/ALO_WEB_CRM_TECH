import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Counselor HR self-service — returns own HR data (salary, attendance, commission, bonus, increment, performance)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  let user: Awaited<ReturnType<typeof db.user.findUnique>> = null;
  if (userId) user = await db.user.findUnique({ where: { id: userId } });
  if (!user) user = await db.user.findFirst({ where: { role: "COUNSELOR" } });
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });

  const hr = await db.employeeHR.findUnique({ where: { userId: user.id } });
  const attendance = await db.employeeAttendance.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 30 });
  const commissions = await db.employeeCommission.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const bonuses = await db.employeeBonus.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const increments = await db.employeeIncrement.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const performance = await db.employeePerformance.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 });

  return NextResponse.json({
    user,
    hr,
    attendance,
    commissions,
    bonuses,
    increments,
    performance,
    summary: {
      totalCommission: commissions.reduce((s, c) => s + c.amount, 0),
      pendingCommission: commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amount, 0),
      paidCommission: commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0),
      totalBonus: bonuses.reduce((s, b) => s + b.amount, 0),
      presentDays: attendance.filter((a) => a.status === "PRESENT").length,
      lateDays: attendance.filter((a) => a.status === "LATE").length,
      leaveDays: attendance.filter((a) => a.status === "LEAVE").length,
    },
  });
}
