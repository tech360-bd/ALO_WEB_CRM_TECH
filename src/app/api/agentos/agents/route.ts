import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/agents?stats=true
// Returns agent stats (canonical workforce/legacy/config) when stats=true,
// otherwise returns the dashboard's recent agent list.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getAgentStats } = await import("@/lib/agentos");
    const stats = await getAgentStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[agentos/agents] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load agents" }, { status: 500 });
  }
}
