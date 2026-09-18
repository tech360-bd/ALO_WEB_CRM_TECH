import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUnified } from "@/lib/unified-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// SEC-G fix (2026-09-18): this route was a straight IDOR. It took `studentId`
// from the query string with NO authentication, so any anonymous caller could
// read ANY student's full record by guessing or enumerating an id — including
// the `password` and `otpCode` columns (returned by the `...student` spread),
// plus documents, payments, interview sessions, applications, visa cases and
// the whole timeline.
//
// Now:
//   * authentication is required (student portal session or staff session)
//   * a student may only read their OWN profile — the requested id is compared
//     against the verified session, never trusted from the query string
//   * staff (counselor/admin) may read a profile they are authorised for
//   * credential columns are stripped from the response
// ============================================================

const SENSITIVE_FIELDS = ["password", "otpCode", "otpExpiresAt"] as const;

function stripSensitive(student: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...student };
  for (const f of SENSITIVE_FIELDS) delete safe[f];
  return safe;
}

export async function GET(req: NextRequest) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const requestedId = req.nextUrl.searchParams.get("studentId");

  // Resolve which student this caller may read.
  let studentId: string;
  if (authRes.type === "student") {
    // A student always reads their own record. An explicit `studentId` that
    // differs from the session is rejected rather than silently ignored, so
    // enumeration attempts are visible.
    if (requestedId && requestedId !== authRes.data.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    studentId = authRes.data.studentId;
  } else {
    if (!requestedId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }
    studentId = requestedId;
  }

  const student = await db.student.findUnique({ where: { id: studentId }, include: { documents: true, payments: true, interviewSessions: true, studentNotifications: { where: { isRead: false }, take: 5 } } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Staff callers must be the assigned counselor or hold an admin role.
  if (authRes.type === "portal") {
    const roles = authRes.data.roles ?? [];
    const isPrivileged =
      authRes.data.userType === "SUPER_ADMIN" ||
      authRes.data.userType === "ADMIN" ||
      roles.some((r) => ["super_admin", "admin", "SUPER_ADMIN", "ADMIN", "counselor", "hr_manager"].includes(r));
    const isAssignedCounselor = !!student.counselorId && student.counselorId === authRes.data.userId;
    if (!isPrivileged && !isAssignedCounselor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [applications, visaCases, timelineEvents] = await Promise.all([
    db.application.findMany({ where: { studentId } }),
    db.visaCase.findMany({ where: { studentId } }),
    db.timelineEvent.findMany({ where: { studentId }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({
    student: { ...stripSensitive(student as unknown as Record<string, unknown>), applications, visaCases, timelineEvents },
  });
}
