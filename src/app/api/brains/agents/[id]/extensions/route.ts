import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAgentBrainCapabilities } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/agents/[id]/extensions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const capabilities = await getAgentBrainCapabilities(id);
    if (!capabilities) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json(capabilities);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
