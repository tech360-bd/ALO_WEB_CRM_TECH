import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/agents/[id]/tools
// Attach a tool to the given AiAgent.
// Body: { toolId, toolName, brain, capability, description?, config? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "agent id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { toolId, toolName, brain, capability, description, config } = body || {};
    if (!toolId || !toolName || !brain || !capability) {
      return NextResponse.json(
        { error: "toolId, toolName, brain, capability are required" },
        { status: 400 }
      );
    }

    const { assignToolToAgent } = await import("@/lib/agent-extension-registry");
    const result = await assignToolToAgent(id, {
      toolId,
      toolName,
      brain,
      capability,
      description,
      config,
    });
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err: any) {
    console.error("[brains/agents/[id]/tools POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to assign tool" }, { status: 500 });
  }
}
