import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/behavior/track
// PUBLIC endpoint — tracks a visitor behavior event.
// Body: TrackBehaviorEventParams { visitorId, eventType, pageUrl?, referrer?, utmSource?, utmMedium?, utmCampaign?, sessionId?, metadata? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.visitorId || !body?.eventType) {
      return NextResponse.json(
        { error: "visitorId and eventType are required" },
        { status: 400 }
      );
    }

    const { trackBehaviorEvent } = await import("@/lib/behavior-tracking");
    const result = await trackBehaviorEvent(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[behavior/track] error", err);
    return NextResponse.json({ error: err?.message || "Failed to track event" }, { status: 500 });
  }
}
