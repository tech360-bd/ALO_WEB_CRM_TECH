import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

// ============================================================
// COUNSELOR TASKS API
//
// SECURITY FIX (2026-09-28): GET/POST/PATCH previously had NO
// authentication at all — any caller could list any counselor's
// task queue via an arbitrary `assigneeId`, create a task
// "assigned" to any user, or mark any task (belonging to anyone)
// as completed. Now requires a session. Non-privileged callers
// (counselors) are always scoped to their own tasks regardless of
// query/body parameters; Admin/Super Admin/Branch Manager may
// operate across assignees for oversight.
// ============================================================

function isPrivileged(auth: { userType: string; roles: string[] }): boolean {
  return (
    auth.userType === "ADMIN" ||
    auth.userType === "SUPER_ADMIN" ||
    auth.roles.includes("admin") ||
    auth.roles.includes("super_admin") ||
    auth.roles.includes("branch_manager") ||
    auth.userType === "BRANCH_MANAGER"
  );
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const { searchParams } = new URL(req.url);
    const requestedAssigneeId = searchParams.get("assigneeId");
    const privileged = isPrivileged(auth);

    const where: Record<string, unknown> = {};
    if (privileged) {
      if (requestedAssigneeId) where.assigneeId = requestedAssigneeId;
    } else {
      where.assigneeId = auth.userId;
    }

    const tasks = await db.task.findMany({ where, orderBy: { dueDate: "asc" } });

    const studentIds = Array.from(new Set(tasks.map((t) => t.studentId).filter(Boolean))) as string[];
    const students = studentIds.length > 0
      ? await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, studentId: true, name: true } })
      : [];
    const smap: Record<string, (typeof students)[number]> = {};
    for (const s of students) smap[s.id] = s;

    const tasksWithStudent = tasks.map((t) => ({ ...t, student: t.studentId ? smap[t.studentId] || null : null }));
    return NextResponse.json({ tasks: tasksWithStudent });
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    const { title, description, assigneeId, studentId, type, priority, dueDate } = body;
    const privileged = isPrivileged(auth);

    // Non-privileged callers may only create tasks assigned to themselves.
    const finalAssigneeId = privileged ? (assigneeId || auth.userId) : auth.userId;

    const task = await db.task.create({
      data: {
        title,
        description,
        assigneeId: finalAssigneeId,
        studentId,
        type: type || "FOLLOW_UP",
        priority: priority || "NORMAL",
        dueDate,
      },
    });
    return NextResponse.json({ task });
  })(request);
}

export async function PATCH(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    const { id, status } = body;
    const privileged = isPrivileged(auth);

    if (!privileged) {
      const existing = await db.task.findUnique({ where: { id } });
      if (!existing || existing.assigneeId !== auth.userId) {
        return NextResponse.json({ error: "Forbidden: not your task" }, { status: 403 });
      }
    }

    const task = await db.task.update({
      where: { id },
      data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
    });
    return NextResponse.json({ task });
  })(request);
}
