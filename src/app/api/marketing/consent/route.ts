import { NextRequest, NextResponse } from "next/server";
import { grantConsent } from "@/lib/marketing-consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/marketing/consent
// Public — visitor grants marketing consent (e.g. via footer form or modal).
// Body: { visitorId?, email?, studentId?, leadId?, consentSource,
//         consentMethod, consentVersion?, ip?, campaign?, medium? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    visitorId,
    email,
    studentId,
    leadId,
    consentSource,
    consentMethod,
    consentVersion,
    ip,
    campaign,
    medium,
  } = body as Record<string, unknown>;

  if (!consentSource || typeof consentSource !== "string") {
    return NextResponse.json({ error: "consentSource is required" }, { status: 400 });
  }
  if (!consentMethod || typeof consentMethod !== "string") {
    return NextResponse.json({ error: "consentMethod is required" }, { status: 400 });
  }
  if (!visitorId && !email) {
    return NextResponse.json({ error: "Either visitorId or email is required" }, { status: 400 });
  }

  try {
    const result = await grantConsent({
      visitorId: typeof visitorId === "string" ? visitorId : undefined,
      email: typeof email === "string" ? email : undefined,
      studentId: typeof studentId === "string" ? studentId : undefined,
      leadId: typeof leadId === "string" ? leadId : undefined,
      consentSource,
      consentMethod,
      consentVersion: typeof consentVersion === "string" ? consentVersion : undefined,
      ip: typeof ip === "string" ? ip : req.headers.get("x-forwarded-for") || undefined,
      campaign: typeof campaign === "string" ? campaign : undefined,
      medium: typeof medium === "string" ? medium : undefined,
    });
    return NextResponse.json({ ok: true, consent: result });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to grant consent" },
      { status: 500 }
    );
  }
}
