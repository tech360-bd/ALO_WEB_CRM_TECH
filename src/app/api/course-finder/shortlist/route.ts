import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudentResource } from "@/lib/student-resource-auth";

// Shortlist (save) a course for a student
export async function GET(req: NextRequest) {
  const access = await requireStudentResource(req, req.nextUrl.searchParams.get("studentId"));
  if (access instanceof NextResponse) return access;
  const studentId = access.studentId;
  const shortlisted = await db.courseShortlist.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shortlisted: shortlisted.map((s) => s.courseSlug) });
}

export async function POST(req: NextRequest) {
  const { studentId: requestedStudentId, courseSlug } = await req.json();
  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;
  const studentId = access.studentId;
  if (!courseSlug) return NextResponse.json({ error: "courseSlug required" }, { status: 400 });
  try {
    await db.courseShortlist.create({ data: { studentId, courseId: courseSlug, courseSlug } });
    return NextResponse.json({ saved: true });
  } catch {
    // Already shortlisted — remove it (toggle)
    await db.courseShortlist.deleteMany({ where: { studentId, courseSlug } });
    return NextResponse.json({ saved: false, removed: true });
  }
}

export async function DELETE(req: NextRequest) {
  const { studentId: requestedStudentId, courseSlug } = await req.json();
  const access = await requireStudentResource(req, requestedStudentId);
  if (access instanceof NextResponse) return access;
  if (!courseSlug) return NextResponse.json({ error: "courseSlug required" }, { status: 400 });
  await db.courseShortlist.deleteMany({ where: { studentId: access.studentId, courseSlug } });
  return NextResponse.json({ removed: true });
}
