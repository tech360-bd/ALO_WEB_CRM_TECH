import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin"]);
const COUNSELOR_ROLES = new Set(["COUNSELOR", "counselor"]);

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const isAdmin = ADMIN_ROLES.has(auth.userType) || auth.roles.some((role) => ADMIN_ROLES.has(role));
  const isCounselor = COUNSELOR_ROLES.has(auth.userType) || auth.roles.some((role) => COUNSELOR_ROLES.has(role));
  if (!isAdmin && !isCounselor) return NextResponse.json({ error: "Counselor HR access required" }, { status: 403 });

  const requestedUserId = req.nextUrl.searchParams.get("userId");
  if (!isAdmin && requestedUserId && requestedUserId !== auth.userId) {
    return NextResponse.json({ error: "You can only access your own HR data" }, { status: 403 });
  }
  const effectiveUserId = isAdmin ? (requestedUserId || auth.userId) : auth.userId;
  const user = await db.user.findUnique({ where: { id: effectiveUserId } });
  if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
  const employee = await db.employee.findFirst({ where: { userId: user.id }, select: { id: true } });
  if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
  const [hr, attendance, commissions, bonuses, increments, performance] = await Promise.all([
    db.employeeHR.findUnique({ where: { userId: user.id } }),
    db.employeeAttendance.findMany({ where: { employeeId: employee.id }, orderBy: { date: "desc" }, take: 30 }),
    db.employeeCommission.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" } }),
    db.employeeBonus.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" } }),
    db.employeeIncrement.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" } }),
    db.employeePerformance.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  return NextResponse.json({ user, hr, attendance, commissions, bonuses, increments, performance, summary: {
    totalCommission: commissions.reduce((sum, item) => sum + item.amount, 0),
    pendingCommission: commissions.filter((item) => item.status.toUpperCase() === "PENDING").reduce((sum, item) => sum + item.amount, 0),
    paidCommission: commissions.filter((item) => item.status.toUpperCase() === "PAID").reduce((sum, item) => sum + item.amount, 0),
    totalBonus: bonuses.reduce((sum, item) => sum + item.amount, 0),
    presentDays: attendance.filter((item) => item.status.toUpperCase() === "PRESENT").length,
    lateDays: attendance.filter((item) => item.status.toUpperCase() === "LATE").length,
    leaveDays: attendance.filter((item) => item.status.toUpperCase() === "LEAVE").length,
  } });
}
