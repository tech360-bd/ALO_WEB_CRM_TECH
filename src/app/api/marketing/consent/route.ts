import { NextRequest, NextResponse } from "next/server";
import { grantConsent } from "@/lib/marketing-consent";
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGet() {
  try {
    const [count, optedOut] = await Promise.all([
      db.communicationConsent.count({ where: { consentGiven: true, optedOutAt: null } }),
      db.communicationConsent.count({ where: { optedOutAt: { not: null } } }),
    ]);
    return NextResponse.json({ success: true, count, optedOut });
  } catch (error) {
    console.error('[marketing/consent] Consent summary query failed.', {
      code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: 'Consent summary is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'MARKETING', 'MARKETING_MANAGER'] });

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
  } catch (error: unknown) {
    console.error('[marketing/consent] Consent write failed.', {
      code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: 'Failed to grant consent.' }, { status: 500 });
  }
}
