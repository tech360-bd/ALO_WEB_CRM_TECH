import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reviews/stats
// Returns aggregate review stats. Auth: admin only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { getReviewStats } = await import("@/lib/review-engine");
    const stats = await getReviewStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[reviews/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load review stats" }, { status: 500 });
  }
}
