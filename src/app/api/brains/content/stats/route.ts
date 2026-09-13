import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/content/stats
// Aggregate content-opportunity metrics.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getContentOpportunityStats } = await import("@/lib/brains/content-brain");
    const stats = await getContentOpportunityStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[brains/content/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load stats" }, { status: 500 });
  }
}
