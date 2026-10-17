import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { documents: true, applications: true, payments: true, timelineEvents: { take: 20, orderBy: { createdAt: "desc" } }, interviews: true, mockTests: true, visaCases: true, notifications: { where: { isRead: false }, take: 5 } },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ student });
}
