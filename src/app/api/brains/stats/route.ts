import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/stats
// Aggregate skill/tool counts per brain.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getBrainStats } = await import("@/lib/agent-extension-registry");
    const stats = await getBrainStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[brains/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load brain stats" }, { status: 500 });
  }
}
