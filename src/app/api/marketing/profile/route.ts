import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarketingProfile, getVisitorIntentScore } from "@/lib/behavior-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/marketing/profile?visitorId=...
// Auth required — returns the visitor's marketing profile + intent breakdown.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const visitorId = req.nextUrl.searchParams.get("visitorId");
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId query param is required" }, { status: 400 });
  }

  const [profile, intent] = await Promise.all([
    getMarketingProfile(visitorId),
    getVisitorIntentScore(visitorId),
  ]);

  if (!profile) {
    return NextResponse.json({
      profile: null,
      intent,
      message: "No marketing profile found for this visitorId",
    });
  }

  return NextResponse.json({ profile, intent });
}
