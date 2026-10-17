import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/feedback
// PUBLIC endpoint — submits feedback for a review request.
// Body: { requestId, feedback: SubmitFeedbackInput }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { requestId, feedback } = body || {};
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }
    if (!feedback || typeof feedback.rating !== "number" || !feedback.text) {
      return NextResponse.json(
        { error: "feedback with rating (1-5) and text is required" },
        { status: 400 }
      );
    }

    const { submitFeedback } = await import("@/lib/review-engine");
    const result = await submitFeedback(requestId, feedback);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[reviews/feedback] error", err);
    return NextResponse.json({ error: err?.message || "Failed to submit feedback" }, { status: 500 });
  }
}
