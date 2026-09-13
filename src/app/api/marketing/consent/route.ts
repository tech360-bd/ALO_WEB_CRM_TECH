import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/marketing/consent
// PUBLIC endpoint — grants marketing consent for a channel.
// Body: GrantConsentParams { visitorId?, email?, phone?, channel, source?, ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.channel) {
      return NextResponse.json({ error: "channel is required" }, { status: 400 });
    }
    if (!body?.visitorId && !body?.email && !body?.phone) {
      return NextResponse.json(
        { error: "at least one of visitorId, email, phone is required" },
        { status: 400 }
      );
    }

    const { grantConsent } = await import("@/lib/marketing-consent");
    const result = await grantConsent(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[marketing/consent] error", err);
    return NextResponse.json({ error: err?.message || "Failed to grant consent" }, { status: 500 });
  }
}
