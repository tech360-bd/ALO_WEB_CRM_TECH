import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReviewStats } from "@/lib/review-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reviews/stats
// Auth required — aggregate review metrics for marketing dashboard.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getReviewStats();
    return NextResponse.json({ stats });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to fetch review stats" },
      { status: 500 }
    );
  }
}
