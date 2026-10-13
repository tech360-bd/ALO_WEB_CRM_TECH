import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH — update task status, resolution, resolvedAt
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, resolution, priority, deadline, assignedTo } = body;

    const existing = await db.communicationTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const data: any = {};
    if (status) {
      if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status;
      if (status === "RESOLVED") {
        data.resolvedAt = new Date();
        if (resolution !== undefined) data.resolution = resolution;
      }
    }
    if (resolution !== undefined && status !== "RESOLVED") data.resolution = resolution;
    if (priority) data.priority = priority;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;

    const task = await db.communicationTask.update({ where: { id }, data });
    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update task" }, { status: 500 });
  }
}
