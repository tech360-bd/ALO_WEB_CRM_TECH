import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/stats
// Aggregate SEO stats. Auth: any logged-in user.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getSeoStats } = await import("@/lib/seo-engine");
    const stats = await getSeoStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[seo/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load SEO stats" }, { status: 500 });
  }
}
