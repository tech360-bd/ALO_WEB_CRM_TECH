import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requestGoogleReview } from "@/lib/review-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/google
// Auth required — staff records that a Google review was requested from the
// student (after they submitted internal feedback). The Google review URL is
// configured per-business-location and supplied by the staff client.
// Body: { requestId, googleReviewUrl }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { requestId, googleReviewUrl } = body as {
    requestId?: string;
    googleReviewUrl?: string;
  };

  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }
  if (!googleReviewUrl) {
    return NextResponse.json({ error: "googleReviewUrl is required" }, { status: 400 });
  }

  try {
    const review = await requestGoogleReview(requestId, googleReviewUrl);
    return NextResponse.json({ ok: true, review });
  } catch (err: unknown) {
    const e = err as { message?: string };
    const status = e?.message === "Review request not found" ? 404 : 500;
    return NextResponse.json(
      { error: e?.message || "Failed to request Google review" },
      { status }
    );
  }
}
