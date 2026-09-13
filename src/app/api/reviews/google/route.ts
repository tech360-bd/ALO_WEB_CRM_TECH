import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/google
// Send a Google review request to an existing review invitation.
// Auth: any staff member.
// Body: { requestId, googleReviewUrl }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { requestId, googleReviewUrl } = body || {};
    if (!requestId || !googleReviewUrl) {
      return NextResponse.json({ error: "requestId and googleReviewUrl are required" }, { status: 400 });
    }

    const { requestGoogleReview } = await import("@/lib/review-engine");
    const result = await requestGoogleReview(requestId, googleReviewUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[reviews/google] error", err);
    return NextResponse.json({ error: err?.message || "Failed to request Google review" }, { status: 500 });
  }
}
