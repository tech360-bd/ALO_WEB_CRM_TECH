import { NextRequest, NextResponse } from "next/server";
import { trackBehaviorEvent } from "@/lib/behavior-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/behavior/track
// Public endpoint — accepts behavior events from the public website.
// Body: { visitorId, eventType, studentId?, leadId?, sessionId?, pageUrl?,
//         referrer?, utmSource?, utmMedium?, utmCampaign?, eventData? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    visitorId,
    eventType,
    studentId,
    leadId,
    sessionId,
    pageUrl,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    eventData,
  } = body as Record<string, unknown>;

  if (!visitorId || typeof visitorId !== "string") {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }
  if (!eventType || typeof eventType !== "string") {
    return NextResponse.json({ error: "eventType is required" }, { status: 400 });
  }

  try {
    const tracked = await trackBehaviorEvent({
      visitorId,
      eventType,
      studentId: typeof studentId === "string" ? studentId : undefined,
      leadId: typeof leadId === "string" ? leadId : undefined,
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      pageUrl: typeof pageUrl === "string" ? pageUrl : undefined,
      referrer: typeof referrer === "string" ? referrer : undefined,
      utmSource: typeof utmSource === "string" ? utmSource : undefined,
      utmMedium: typeof utmMedium === "string" ? utmMedium : undefined,
      utmCampaign: typeof utmCampaign === "string" ? utmCampaign : undefined,
      eventData: eventData && typeof eventData === "object"
        ? (eventData as Record<string, unknown>)
        : undefined,
    });

    return NextResponse.json({ ok: true, event: tracked });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to track event" },
      { status: 500 }
    );
  }
}
