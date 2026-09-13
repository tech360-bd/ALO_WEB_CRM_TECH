import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignToolToAgent } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/agents/[id]/tools — assign a tool to an agent.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      toolId,
      toolName,
      brain,
      inputSchema,
      outputSchema,
      permission,
      riskLevel,
      approvalRequired,
      rateLimit,
      timeout,
    } = body;

    if (!toolId || !toolName || !brain) {
      return NextResponse.json(
        { error: "toolId, toolName, and brain are required" },
        { status: 400 }
      );
    }

    const tool = await assignToolToAgent(id, {
      toolId,
      toolName,
      brain,
      inputSchema,
      outputSchema,
      permission,
      riskLevel,
      approvalRequired,
      rateLimit,
      timeout,
    });
    return NextResponse.json({ success: true, tool });
  } catch (err: any) {
    if (err.message?.includes("Agent not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
