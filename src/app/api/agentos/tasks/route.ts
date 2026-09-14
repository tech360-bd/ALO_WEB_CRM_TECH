import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const agentId = req.nextUrl.searchParams.get("agentId") || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
    const tasks = await getTasks(agentId, limit);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { agentId, triggeredBy, triggerType, input, metadata } = body;

    if (!agentId || !input) {
      return NextResponse.json({ error: "agentId and input are required" }, { status: 400 });
    }

    const task = await createTask({
      agentId,
      triggeredBy: triggeredBy || "system",
      triggerType: triggerType || "manual",
      input,
      metadata,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
