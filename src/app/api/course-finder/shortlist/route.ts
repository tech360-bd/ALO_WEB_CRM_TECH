import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Shortlist (save) a course for a student
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ shortlisted: [] });
  const shortlisted = await db.courseShortlist.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shortlisted: shortlisted.map((s) => s.courseSlug) });
}

export async function POST(req: NextRequest) {
  const { studentId, courseSlug } = await req.json();
  if (!studentId || !courseSlug) return NextResponse.json({ error: "studentId and courseSlug required" }, { status: 400 });
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
  const { studentId, courseSlug } = await req.json();
  await db.courseShortlist.deleteMany({ where: { studentId, courseSlug } });
  return NextResponse.json({ removed: true });
}
