import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  const answers = await db.interviewAnswer.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ answers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, questionId, question, studentAnswer } = body;
  if (!studentId || !question) return NextResponse.json({ error: "studentId and question required" }, { status: 400 });
  const existing = await db.interviewAnswer.findFirst({ where: { studentId, questionId } });
  if (existing) {
    const updated = await db.interviewAnswer.update({ where: { id: existing.id }, data: { studentAnswer, lastUpdated: new Date() } });
    return NextResponse.json({ answer: updated });
  }
  const answer = await db.interviewAnswer.create({ data: { studentId, questionId, question, studentAnswer } });
  return NextResponse.json({ answer });
}
