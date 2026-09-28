import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "super_admin", "admin"]);
const COUNSELOR_ROLES = new Set(["COUNSELOR", "counselor", "BRANCH_MANAGER", "branch_manager"]);

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const isAdmin = ADMIN_ROLES.has(auth.userType) || auth.roles.some((role) => ADMIN_ROLES.has(role));
  const canView = COUNSELOR_ROLES.has(auth.userType) || auth.roles.some((role) => COUNSELOR_ROLES.has(role));
  if (!isAdmin && !canView) return NextResponse.json({ error: "Counselor access required" }, { status: 403 });

  const requestedCounselorId = req.nextUrl.searchParams.get("counselorId");
  const counselorId = isAdmin ? requestedCounselorId : auth.userId;
  const students = await db.student.findMany({
    where: counselorId ? { counselorId } : {},
    include: { documents: { take: 10 }, interviewSessions: { take: 1 }, payments: true },
    orderBy: { updatedAt: "desc" },
  });
  const enriched = await Promise.all(students.map(async (student) => ({
    ...student,
    applications: await db.application.findMany({ where: { studentId: student.id }, take: 1, orderBy: { updatedAt: "desc" } }),
  })));
  return NextResponse.json({ students: enriched });
}
