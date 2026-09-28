import { NextRequest, NextResponse } from "next/server";
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
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const id = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");

  // A logged-in student resolving their own record via `userId` (used by
  // useStudentId()) — only ever allowed to resolve THEMSELVES.
  if (userId) {
    if (authRes.type === "student") {
      if (userId !== authRes.data.studentId) {
        // A student session's own id may differ from a linked `userId`
        // field; only allow this when it truly is their own account.
        const own = await db.student.findFirst({ where: { id: authRes.data.studentId, userId } });
        if (!own) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const student = await db.student.findUnique({ where: { id: authRes.data.studentId } });
      const enriched = await enrich(student);
      return enriched ? NextResponse.json({ student: enriched }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Portal/staff caller resolving a student by linked userId — only a
    // privileged staff member may do this lookup.
    if (!isPrivileged(authRes.data.roles ?? [], authRes.data.userType)) {
      if (userId !== authRes.data.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const student = await db.student.findFirst({ where: { userId } });
    const enriched = await enrich(student);
    return enriched ? NextResponse.json({ student: enriched }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (id) {
    if (authRes.type === "student") {
      if (id !== authRes.data.studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const roles = authRes.data.roles ?? [];
      if (!isPrivileged(roles, authRes.data.userType)) {
        const target = await db.student.findUnique({ where: { id }, select: { counselorId: true } });
        if (!target || target.counselorId !== authRes.data.userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }
    const student = await db.student.findUnique({
      where: { id },
      include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { orderBy: { startedAt: "desc" } }, payments: true, studentNotifications: { take: 5, orderBy: { createdAt: "desc" } } },
    });
    const enriched = await enrich(student);
    return enriched ? NextResponse.json({ student: enriched }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Listing every student requires a privileged staff session.
  if (authRes.type !== "portal" || !isPrivileged(authRes.data.roles ?? [], authRes.data.userType)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const students = await db.student.findMany({ include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { take: 1 }, payments: true }, orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(students.map((student) => enrich(student)));
  return NextResponse.json({ students: enriched });
}
