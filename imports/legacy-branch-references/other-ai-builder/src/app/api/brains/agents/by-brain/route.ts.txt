import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AGENT_BRAINS } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/agents/by-brain?brain=CONTENT
// Lists all AiAgents that have at least one skill or tool assigned to the given brain.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const brain = req.nextUrl.searchParams.get("brain") as any;
    if (!brain || !AGENT_BRAINS.includes(brain)) {
      return NextResponse.json(
        { error: `brain is required and must be one of: ${AGENT_BRAINS.join(", ")}` },
        { status: 400 }
      );
    }

    const { getAgentsByBrain } = await import("@/lib/agent-extension-registry");
    const agents = await getAgentsByBrain(brain);
    return NextResponse.json({ brain, agents });
  } catch (err: any) {
    console.error("[brains/agents/by-brain] error", err);
    return NextResponse.json({ error: err?.message || "Failed to list agents" }, { status: 500 });
  }
}
