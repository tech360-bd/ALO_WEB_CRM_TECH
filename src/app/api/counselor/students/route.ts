import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

// ============================================================
// COUNSELOR STUDENTS API (legacy `Student` model — used by the
// Counselor 360 view and SOP Studio)
//
// SECURITY FIX (2026-09-28): this endpoint previously had NO
// authentication at all, and trusted a client-supplied
// `counselorId` query parameter — meaning any unauthenticated
// caller could list every student in the system, and any
// authenticated counselor could view another counselor's caseload
// simply by changing the query string. Neither UI caller
// (counselor-student-360.tsx, sop-studio.tsx) even sent a
// counselorId, so in practice every counselor was already seeing
// every student in the database.
//
// Fix: require a valid session (withAuth). Non-admin callers are
// always scoped to their OWN assigned students (auth.userId),
// regardless of any query parameter. Admin/Super Admin (and
// Branch Manager) may see the full list for oversight purposes.
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const blockedTypes = ["STUDENT", "student", "PARTNER", "partner"];
    if (
      blockedTypes.includes(auth.userType) ||
      (auth.roles && auth.roles.some((r: string) => blockedTypes.includes(r)))
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: employee access only" },
        { status: 403 }
      );
    }

    const isPrivileged =
      auth.userType === "ADMIN" ||
      auth.userType === "SUPER_ADMIN" ||
      auth.roles.includes("admin") ||
      auth.roles.includes("super_admin") ||
      auth.roles.includes("branch_manager") ||
      auth.userType === "BRANCH_MANAGER";

    const where = isPrivileged ? {} : { counselorId: auth.userId };

    const students = await db.student.findMany({
      where,
      include: { documents: { take: 10 }, interviewSessions: { take: 1 }, payments: true },
      orderBy: { updatedAt: "desc" },
    });

    const enriched = await Promise.all(
      students.map(async (student) => ({
        ...student,
        applications: await db.application.findMany({
          where: { studentId: student.id },
          take: 1,
          orderBy: { updatedAt: "desc" },
        }),
      }))
    );

    return NextResponse.json({ students: enriched });
  })(request);
}
