import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Compare courses — get comparison list for a student
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ compared: [] });
  const compared = await db.courseComparison.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ compared: compared.map((c) => c.courseSlug) });
}

export async function POST(req: NextRequest) {
  const { studentId, courseSlug } = await req.json();
  if (!studentId || !courseSlug) return NextResponse.json({ error: "studentId and courseSlug required" }, { status: 400 });
  const existing = await db.courseComparison.count({ where: { studentId } });
  if (existing >= 3) {
    return NextResponse.json({ error: "Maximum 3 courses can be compared at once. Remove one to add another." }, { status: 400 });
  }
  try {
    await db.courseComparison.create({ data: { studentId, courseSlug } });
    return NextResponse.json({ added: true, count: existing + 1 });
  } catch {
    // Already in comparison — remove it (toggle)
    await db.courseComparison.deleteMany({ where: { studentId, courseSlug } });
    return NextResponse.json({ added: false, removed: true, count: existing - 1 });
  }
}

export async function DELETE(req: NextRequest) {
  const { studentId, courseSlug } = await req.json();
  await db.courseComparison.deleteMany({ where: { studentId, courseSlug } });
  return NextResponse.json({ removed: true });
}
