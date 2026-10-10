import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUnified } from "@/lib/unified-auth";

const STAFF_ROLES = new Set([
  "SUPER_ADMIN", "ADMIN", "super_admin", "admin",
  "COUNSELOR", "counselor", "APPLICATION_TEAM", "application_team",
  "VISA_OFFICER", "visa_officer",
]);

export async function GET(req: NextRequest) {
  const authResult = await authenticateUnified(req);
  if (authResult instanceof NextResponse) return authResult;

  const requestedStudentId = req.nextUrl.searchParams.get("studentId");
  if (!requestedStudentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  let studentId = requestedStudentId;
  if (authResult.type === "student") {
    studentId = authResult.data.studentId;
  } else {
    const roles = authResult.data.roles || [];
    const isStudent = authResult.data.userType.toUpperCase() === "STUDENT";
    if (isStudent) {
      const student = await db.student.findFirst({ where: { userId: authResult.data.userId }, select: { id: true } });
      if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      studentId = student.id;
    } else if (!roles.some((role) => STAFF_ROLES.has(role))) {
      return NextResponse.json({ error: "Insufficient role permissions" }, { status: 403 });
    }
  }

  if (studentId !== requestedStudentId && (authResult.type === "student" || authResult.data.userType.toUpperCase() === "STUDENT")) {
    return NextResponse.json({ error: "You can only access your own timeline" }, { status: 403 });
  }

  const events = await db.timelineEvent.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ events });
}
