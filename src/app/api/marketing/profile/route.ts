import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/marketing/profile?visitorId=
// Returns the marketing profile + intent score for a visitor.
// Auth: any staff member.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const visitorId = req.nextUrl.searchParams.get("visitorId");
    if (!visitorId) {
      return NextResponse.json({ error: "visitorId query param is required" }, { status: 400 });
    }

    const { getMarketingProfile, getVisitorIntentScore } = await import("@/lib/behavior-tracking");
    const [profile, intentScore] = await Promise.all([
      getMarketingProfile(visitorId),
      getVisitorIntentScore(visitorId),
    ]);
    return NextResponse.json({ visitorId, profile, intentScore });
  } catch (err: any) {
    console.error("[marketing/profile] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load marketing profile" }, { status: 500 });
  }
}
