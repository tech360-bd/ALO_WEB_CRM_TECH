import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const assigneeId = req.nextUrl.searchParams.get("assigneeId");
  const where: any = {};
  if (assigneeId) where.assigneeId = assigneeId;
  const tasks = await db.task.findMany({
    where,
    orderBy: { dueDate: "asc" },
  });

  // Fetch student info for tasks with studentId
  const studentIds = Array.from(new Set(tasks.map((t) => t.studentId).filter(Boolean))) as string[];
  const students = studentIds.length > 0 ? await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, studentId: true, name: true } }) : [];
  const smap: Record<string, any> = {};
  for (const s of students) smap[s.id] = s;

  const tasksWithStudent = tasks.map((t) => ({ ...t, student: t.studentId ? smap[t.studentId] || null : null }));
  return NextResponse.json({ tasks: tasksWithStudent });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, assigneeId, studentId, type, priority, dueDate } = body;
  const task = await db.task.create({
    data: { title, description, assigneeId, studentId, type: type || "FOLLOW_UP", priority: priority || "NORMAL", dueDate },
  });
  return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const task = await db.task.update({
    where: { id },
    data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  return NextResponse.json({ task });
}
