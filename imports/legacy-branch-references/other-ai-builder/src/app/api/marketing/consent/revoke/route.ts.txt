import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/marketing/consent/revoke
// PUBLIC endpoint — revokes marketing consent for a visitor / email.
// Body: { visitorId?, email? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.visitorId && !body?.email) {
      return NextResponse.json(
        { error: "at least one of visitorId or email is required" },
        { status: 400 }
      );
    }

    const { revokeConsent } = await import("@/lib/marketing-consent");
    const result = await revokeConsent({ visitorId: body.visitorId, email: body.email });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[marketing/consent/revoke] error", err);
    return NextResponse.json({ error: err?.message || "Failed to revoke consent" }, { status: 500 });
  }
}
