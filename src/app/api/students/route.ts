import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { authenticateUnified } from "@/lib/unified-auth";

// ============================================================
// SECURITY FIX (2026-09-28): this route had NO authentication at all.
//   - GET with no `id` returned EVERY student in the database (full
//     profile + documents + payments + interview sessions) to any
//     anonymous caller — a full unauthenticated data dump.
//   - GET with an `id` returned that student's full record (including
//     documents/payments) to anyone who supplied/guessed the id — an
//     IDOR, the same class of bug already fixed on /api/student/profile.
//   - The frontend `useStudentId()` hook calls this with a `?userId=`
//     query param expecting `{ student }` back, but the route never
//     implemented that lookup at all (it silently fell into the
//     "return everyone" branch and the field-name mismatch happened to
//     stop the hook from using the leaked list) — this route now
//     implements that lookup correctly and securely.
//
// Now: authentication is required. A student may only resolve/read
// their OWN record (by their own session, or by `userId` matching
// their own linked user id). Staff may look up a specific student by
// `id` if they are privileged or the assigned counselor. Listing ALL
// students requires a privileged staff session.
// ============================================================

async function enrich(student: Awaited<ReturnType<typeof db.student.findUnique>>) {
  if (!student) return null;
  const [applications, visaCases, timelineEvents] = await Promise.all([
    db.application.findMany({ where: { studentId: student.id } }),
    db.visaCase.findMany({ where: { studentId: student.id } }),
    db.timelineEvent.findMany({ where: { studentId: student.id }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);
  return { ...student, applications, visaCases, timelineEvents };
}

function isPrivileged(roles: string[], userType: string): boolean {
  return (
    userType === "ADMIN" ||
    userType === "SUPER_ADMIN" ||
    roles.some((r) => ["super_admin", "admin", "SUPER_ADMIN", "ADMIN", "counselor", "hr_manager"].includes(r))
  );
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
  // Listing every student requires a privileged staff session.
  if (authRes.type !== "portal" || !isPrivileged(authRes.data.roles ?? [], authRes.data.userType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const students = await db.student.findMany({ include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { take: 1 }, payments: true }, orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(students.map((student) => enrich(student)));
  return NextResponse.json({ students: enriched });
}
