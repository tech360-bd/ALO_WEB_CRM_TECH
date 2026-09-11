import { NextRequest, NextResponse } from "next/server";
import { submitFeedback } from "@/lib/review-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/feedback
// Public — student submits feedback (rating + free-text) using the review
// request id (typically delivered via email/SMS link).
// Body: { requestId, rating (1-5), text? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { requestId, rating, text } = body as {
    requestId?: string;
    rating?: number;
    text?: string;
  };

  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be a number between 1 and 5" }, { status: 400 });
  }

  try {
    const review = await submitFeedback(requestId, { rating, text });
    return NextResponse.json({ ok: true, review });
  } catch (err: unknown) {
    const e = err as { message?: string };
    const status = e?.message === "Review request not found" ? 404 : 500;
    return NextResponse.json(
      { error: e?.message || "Failed to submit feedback" },
      { status }
    );
  }
}
