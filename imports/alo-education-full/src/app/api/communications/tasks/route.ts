import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list communication tasks (filter by assignedTo / status / studentId)
export async function GET(req: NextRequest) {
  try {
    const assignedTo = req.nextUrl.searchParams.get("assignedTo");
    const status = req.nextUrl.searchParams.get("status");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const priority = req.nextUrl.searchParams.get("priority");

    const where: any = {};
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (priority) where.priority = priority;

    const tasks = await db.communicationTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST — create communication task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      communicationMessageId,
      socialInboxMessageId,
      studentId,
      applicationId,
      assignedTo,
      priority,
      source,
      deadline,
      createdBy,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const task = await db.communicationTask.create({
      data: {
        title,
        description,
        communicationMessageId,
        socialInboxMessageId,
        studentId,
        applicationId,
        assignedTo,
        priority: priority || "MEDIUM",
        status: "OPEN",
        source: source || "COMMUNICATION",
        deadline: deadline ? new Date(deadline) : null,
        createdBy,
      },
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create task" }, { status: 500 });
  }
}
