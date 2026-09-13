import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/keywords/stats
// Aggregate KeywordResearch stats. Auth: any logged-in user.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getKeywordResearchStats } = await import("@/lib/keyword-research-engine");
    const stats = await getKeywordResearchStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[seo/keywords/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load keyword stats" }, { status: 500 });
  }
}
