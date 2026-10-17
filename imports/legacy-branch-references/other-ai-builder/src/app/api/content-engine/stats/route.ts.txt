import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/content-engine/stats
// Aggregate content performance stats. Auth: any logged-in user.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getContentPerformanceStats } = await import("@/lib/content-engine");
    const stats = await getContentPerformanceStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[content-engine/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load stats" }, { status: 500 });
  }
}
