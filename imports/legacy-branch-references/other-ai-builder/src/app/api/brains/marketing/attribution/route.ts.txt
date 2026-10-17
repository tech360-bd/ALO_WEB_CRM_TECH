import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/marketing/attribution
// Record an attribution touchpoint.
// Body: TrackAttributionParams
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.channel || !body?.touchType) {
      return NextResponse.json(
        { error: "channel and touchType are required (touchType: FIRST_TOUCH|LAST_TOUCH|ASSIST)" },
        { status: 400 }
      );
    }
    if (!body?.visitorId && !body?.leadId && !body?.studentId) {
      return NextResponse.json(
        { error: "at least one of visitorId, leadId, studentId is required" },
        { status: 400 }
      );
    }

    const { trackAttribution } = await import("@/lib/brains/marketing-brain");
    const result = await trackAttribution(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[brains/marketing/attribution] error", err);
    return NextResponse.json({ error: err?.message || "Failed to track attribution" }, { status: 500 });
  }
}
