import { NextRequest, NextResponse } from "next/server";
import { getPersonalizedRecommendations } from "@/lib/brains/marketing-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/marketing/recommendations?marketingProfileId=...
// Returns [] if marketingConsent is false (LeadOutreach.consentStatus === "OPTED_OUT").
export async function GET(req: NextRequest) {
  try {
    const marketingProfileId = req.nextUrl.searchParams.get("marketingProfileId");
    if (!marketingProfileId) {
      return NextResponse.json(
        { error: "marketingProfileId is required" },
        { status: 400 }
      );
    }

    const recommendations = await getPersonalizedRecommendations(marketingProfileId);
    return NextResponse.json({
      marketingProfileId,
      recommendations,
      count: recommendations.length,
      consentGranted: recommendations.length > 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
