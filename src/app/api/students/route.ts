import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function enrich(student: Awaited<ReturnType<typeof db.student.findUnique>>) {
  if (!student) return null;
  const [applications, visaCases, timelineEvents] = await Promise.all([
    db.application.findMany({ where: { studentId: student.id } }),
    db.visaCase.findMany({ where: { studentId: student.id } }),
    db.timelineEvent.findMany({ where: { studentId: student.id }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);
  return { ...student, applications, visaCases, timelineEvents };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const student = await db.student.findUnique({ where: { id }, include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { orderBy: { startedAt: "desc" } }, payments: true, studentNotifications: { take: 5, orderBy: { createdAt: "desc" } } } });
    const enriched = await enrich(student);
    return enriched ? NextResponse.json({ student: enriched }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const students = await db.student.findMany({ include: { documents: { orderBy: { category: "asc" } }, interviewSessions: { take: 1 }, payments: true }, orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(students.map((student) => enrich(student)));
  return NextResponse.json({ students: enriched });
}
