import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUnified } from "@/lib/unified-auth";

/**
 * Shared ownership checks for student resources.
 *
 * Dedicated student bearer sessions and portal/NextAuth sessions are both
 * supported. A student can only use their canonical Student.id. Staff must
 * provide a target student id and must either be an administrator or the
 * target student's assigned counselor.
 */
export async function resolveStudentAccess(
  req: NextRequest,
  requestedStudentId: string | null,
): Promise<{ studentId: string } | NextResponse> {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.type === "student") {
    if (requestedStudentId && requestedStudentId !== auth.data.studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return { studentId: auth.data.studentId };
  }

  // Portal/NextAuth student sessions need the canonical Student.id resolved
  // from the authenticated user rather than trusting a query/body id.
  const userType = auth.data.userType.toUpperCase();
  if (userType === "STUDENT" || auth.data.roles.some((role) => role.toUpperCase() === "STUDENT")) {
    const ownStudent = await db.student.findFirst({
      where: { userId: auth.data.userId },
      select: { id: true },
    });
    if (!ownStudent) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    if (requestedStudentId && requestedStudentId !== ownStudent.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return { studentId: ownStudent.id };
  }

  if (!requestedStudentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const roles = auth.data.roles ?? [];
  const isPrivileged =
    ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(userType) ||
    roles.some((role) => ["SUPER_ADMIN", "ADMIN", "super_admin", "admin", "branch_manager"].includes(role));

  if (!isPrivileged) {
    const student = await db.student.findUnique({
      where: { id: requestedStudentId },
      select: { counselorId: true },
    });
    if (!student || student.counselorId !== auth.data.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return { studentId: requestedStudentId };
}

/**
 * Student-only ownership guard for resources that must never be writable by
 * staff through the student namespace. Staff-specific handlers should use
 * resolveStudentAccess instead.
 */
export async function requireStudentResource(
  request: Request,
  requestedStudentId?: string | null,
): Promise<{ studentId: string } | NextResponse> {
  const auth = await authenticateUnified(request);
  if (auth instanceof NextResponse) return auth;

  let studentId: string | null = null;
  if (auth.type === "student") {
    studentId = auth.data.studentId;
  } else if (auth.data.userType.toUpperCase() === "STUDENT" || auth.data.roles.some((role) => role.toUpperCase() === "STUDENT")) {
    const student = await db.student.findFirst({
      where: { userId: auth.data.userId },
      select: { id: true },
    });
    studentId = student?.id || null;
  }

  if (!studentId) {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }
  if (requestedStudentId && requestedStudentId !== studentId) {
    return NextResponse.json({ error: "You can only access your own student data" }, { status: 403 });
  }

  return { studentId };
}
