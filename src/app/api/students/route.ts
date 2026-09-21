import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

async function enrich(student: Awaited<ReturnType<typeof db.student.findUnique>>) {
  if (!student) return null;
  const [applications, visaCases, timelineEvents] = await Promise.all([
    db.application.findMany({ where: { studentId: student.id } }),
    db.visaCase.findMany({ where: { studentId: student.id } }),
    db.timelineEvent.findMany({ where: { studentId: student.id }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);
  return { ...student, applications, visaCases, timelineEvents };
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  const id = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");
  const role = (auth.userType || auth.roles[0] || "").toUpperCase();
  const isStaff = ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "BRANCH_MANAGER", "FRONT_DESK", "SUPPORT_STAFF"].includes(role);

  if (id || userId) {
    const student = id
      ? await db.student.findUnique({ where: { id }, include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { orderBy: { startedAt: "desc" } }, payments: true, studentNotifications: { take: 5, orderBy: { createdAt: "desc" } } } })
      : await db.student.findFirst({ where: { userId }, include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { orderBy: { startedAt: "desc" } }, payments: true, studentNotifications: { take: 5, orderBy: { createdAt: "desc" } } } });

    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isStaff && student.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const enriched = await enrich(student);
    return NextResponse.json({ student: enriched });
  }

  if (!isStaff) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  const students = await db.student.findMany({ include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { take: 1 }, payments: true }, orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(students.map((student) => enrich(student)));
  return NextResponse.json({ students: enriched });
}
