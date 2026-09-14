import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const counselorId = req.nextUrl.searchParams.get("counselorId");
  const students = await db.student.findMany({ where: counselorId ? { counselorId } : {}, include: { documents: { take: 10 }, interviewSessions: { take: 1 }, payments: true }, orderBy: { updatedAt: "desc" } });
  const enriched = await Promise.all(students.map(async (student) => ({ ...student, applications: await db.application.findMany({ where: { studentId: student.id }, take: 1, orderBy: { updatedAt: "desc" } }) })));
  return NextResponse.json({ students: enriched });
}
