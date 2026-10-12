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

// ============================================================
// PATCH /api/student/profile
// Onboarding updates. A student may only update their OWN record:
// the id is always taken from the verified session, never from the body
// or query string, so a crafted studentId cannot reach another record.
// Staff portal sessions are rejected here — staff edits go through the
// CRM profile routes, which carry their own role checks.
// ============================================================

const EDITABLE_STRING_FIELDS = [
  "name", "email", "phone", "currentCountry", "currentCity",
] as const;

const MAX_FIELD_LENGTH: Record<string, number> = {
  name: 191, email: 191, phone: 30, currentCountry: 100, currentCity: 100,
};

export async function PATCH(req: NextRequest) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.type !== "student") {
    return NextResponse.json(
      { error: "Only students can update their own profile here." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: Record<string, string> = {};
  for (const field of EDITABLE_STRING_FIELDS) {
    const value = (body as Record<string, unknown>)[field];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      return NextResponse.json({ error: `${field} must be a string.` }, { status: 400 });
    }
    const trimmed = value.trim();
    const limit = MAX_FIELD_LENGTH[field] ?? 191;
    if (trimmed.length > limit) {
      return NextResponse.json({ error: `${field} must be ${limit} characters or fewer.` }, { status: 400 });
    }
    data[field] = trimmed;
  }

  if (data.email !== undefined && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (data.phone !== undefined && data.phone && !/^\+?[0-9\s().-]{7,30}$/.test(data.phone)) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const studentId = authRes.data.studentId;
  const existing = await db.student.findUnique({ where: { id: studentId } });
  if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Email must stay unique. Reject a clash rather than letting the DB throw.
  // No `mode: "insensitive"` here: this Prisma dialect does not support the
  // case-insensitive filter modifier. Both MySQL (default ci collation) and
  // SQLite compare these case-insensitively, so a plain `equals` matches.
  if (data.email && data.email.toLowerCase() !== existing.email.toLowerCase()) {
    const clash = await db.student.findFirst({
      where: { email: data.email, NOT: { id: studentId } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
  }

  const updated = await db.student.update({ where: { id: studentId }, data });

  return NextResponse.json({ student: stripSensitive(updated as unknown as Record<string, unknown>) });
}
