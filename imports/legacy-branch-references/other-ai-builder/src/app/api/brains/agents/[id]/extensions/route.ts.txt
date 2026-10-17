import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/agents/[id]/extensions
// Returns the full skill + tool brain extension map for a given AiAgent.
export async function GET(
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

    const { getAgentBrainCapabilities } = await import("@/lib/agent-extension-registry");
    const capabilities = await getAgentBrainCapabilities(id);
    return NextResponse.json(capabilities);
  } catch (err: any) {
    console.error("[brains/agents/[id]/extensions] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load agent extensions" }, { status: 500 });
  }
}
