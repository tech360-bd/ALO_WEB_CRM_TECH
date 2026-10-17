import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/tools?stats=true
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
      const stats = await lib.getToolStats();
      return NextResponse.json(stats);
    }
    const tools = await lib.getTools();
    return NextResponse.json({ tools });
  } catch (err: any) {
    console.error("[agentos/tools] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load tools" }, { status: 500 });
  }
}
