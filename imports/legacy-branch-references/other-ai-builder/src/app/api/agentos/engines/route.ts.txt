import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/engines?stats=true
// Returns engine stats (by type / status / health) when stats=true,
// otherwise returns the list of all engines.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const wantStats = url.searchParams.get("stats") === "true";
    const lib = await import("@/lib/agentos");
    if (wantStats) {
      const stats = await lib.getEngineStats();
      return NextResponse.json(stats);
    }
    const engines = await lib.getEngines();
    return NextResponse.json({ engines });
  } catch (err: any) {
    console.error("[agentos/engines] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load engines" }, { status: 500 });
  }
}
