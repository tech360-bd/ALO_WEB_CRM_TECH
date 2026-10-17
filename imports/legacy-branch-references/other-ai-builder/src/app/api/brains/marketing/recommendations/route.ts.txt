import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/marketing/recommendations?marketingProfileId=
// Returns personalized content/course recommendations for a visitor.
// Returns [] if no consent has been granted.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const marketingProfileId = req.nextUrl.searchParams.get("marketingProfileId");
    if (!marketingProfileId) {
      return NextResponse.json({ error: "marketingProfileId query param is required" }, { status: 400 });
    }

    const { getPersonalizedRecommendations } = await import("@/lib/brains/marketing-brain");
    const recommendations = await getPersonalizedRecommendations(marketingProfileId);
    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error("[brains/marketing/recommendations] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load recommendations" }, { status: 500 });
  }
}
