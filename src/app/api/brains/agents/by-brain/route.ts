import { NextRequest, NextResponse } from "next/server";
import { getAgentsByBrain } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/agents/by-brain?brain=content
export async function GET(req: NextRequest) {
  try {
    const brain = req.nextUrl.searchParams.get("brain");
    if (!brain) {
      return NextResponse.json(
        { error: "brain query parameter is required" },
        { status: 400 }
      );
    }
    const agents = await getAgentsByBrain(brain);
    return NextResponse.json({ brain, agents, count: agents.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
