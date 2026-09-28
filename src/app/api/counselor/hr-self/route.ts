import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

// ============================================================
// COUNSELOR SELF-SERVICE HR API
//
// SECURITY FIX (2026-09-28): this endpoint previously had NO
// authentication and accepted an arbitrary `userId` query
// parameter (falling back to "the first counselor in the
// database" if omitted) — meaning any unauthenticated caller
// could read ANY employee's HR record, attendance, commission,
// bonus, increment and performance history simply by supplying
// their user id. It is meant to be a strictly self-service
// endpoint ("hr-self"), so it is now scoped to the authenticated
// caller only. Admin/Super Admin may still pass a `userId` to
// look up another employee's HR record for legitimate oversight.
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const isPrivileged =
      auth.userType === "ADMIN" ||
      auth.userType === "SUPER_ADMIN" ||
      auth.roles.includes("admin") ||
      auth.roles.includes("super_admin") ||
      auth.roles.includes("branch_manager") ||
      auth.userType === "BRANCH_MANAGER";

    const targetUserId = isPrivileged && requestedUserId ? requestedUserId : auth.userId;

    const user = await db.user.findUnique({ where: { id: targetUserId } });
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

    return NextResponse.json({
      user,
      hr,
      attendance,
      commissions,
      bonuses,
      increments,
      performance,
      summary: {
        totalCommission: commissions.reduce((sum, item) => sum + item.amount, 0),
        pendingCommission: commissions.filter((item) => item.status.toUpperCase() === "PENDING").reduce((sum, item) => sum + item.amount, 0),
        paidCommission: commissions.filter((item) => item.status.toUpperCase() === "PAID").reduce((sum, item) => sum + item.amount, 0),
        totalBonus: bonuses.reduce((sum, item) => sum + item.amount, 0),
        presentDays: attendance.filter((item) => item.status.toUpperCase() === "PRESENT").length,
        lateDays: attendance.filter((item) => item.status.toUpperCase() === "LATE").length,
        leaveDays: attendance.filter((item) => item.status.toUpperCase() === "LEAVE").length,
      },
    });
  })(request);
}
