import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/marketing/attribution-stats
// Returns aggregate attribution stats (by channel / touchType).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getAttributionStats } = await import("@/lib/brains/marketing-brain");
    const stats = await getAttributionStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[brains/marketing/attribution-stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load attribution stats" }, { status: 500 });
  }
}
