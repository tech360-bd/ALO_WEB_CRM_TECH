import { NextRequest, NextResponse } from "next/server";
import { revokeConsent } from "@/lib/marketing-consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/marketing/consent/revoke
// Public — visitor revokes marketing consent (e.g. via unsubscribe link).
// Body: { visitorId?, email? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { visitorId, email } = body as { visitorId?: string; email?: string };

  if (!visitorId && !email) {
    return NextResponse.json(
      { error: "Either visitorId or email is required" },
      { status: 400 }
    );
  }

  try {
    const result = await revokeConsent({ visitorId, email });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to revoke consent" },
      { status: 500 }
    );
  }
}
