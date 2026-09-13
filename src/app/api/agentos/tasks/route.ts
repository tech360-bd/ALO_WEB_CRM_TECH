import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/tasks?limit=100
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10) || 100, 500);
    const lib = await import("@/lib/agentos");
    const tasks = await lib.getTasks(limit);
    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("[agentos/tasks GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load tasks" }, { status: 500 });
  }
}

// POST /api/agentos/tasks
// Body: { agentName, department, action, agentId?, crmId?, crmType?, applicationId?, priority?, input?, approvalRequired?, deadline? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.agentName || !body?.department || !body?.action) {
      return NextResponse.json(
        { error: "agentName, department, and action are required" },
        { status: 400 }
      );
    }

    const lib = await import("@/lib/agentos");
    const task = await lib.createTask({
      agentId: body.agentId,
      agentName: body.agentName,
      department: body.department,
      action: body.action,
      crmId: body.crmId,
      crmType: body.crmType,
      applicationId: body.applicationId,
      priority: body.priority,
      input: body.input,
      approvalRequired: body.approvalRequired,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    console.error("[agentos/tasks POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create task" }, { status: 500 });
  }
}
