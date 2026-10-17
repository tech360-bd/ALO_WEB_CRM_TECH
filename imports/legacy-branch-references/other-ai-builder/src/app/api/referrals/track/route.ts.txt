import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/referrals/track
// PUBLIC endpoint — tracks usage of a referral code (e.g. when a referred
// lead lands on the site). Idempotent per referralCode.
// Body: { referralCode, referredName?, referredPhone?, referredEmail? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { referralCode } = body || {};
    if (!referralCode) {
      return NextResponse.json({ error: "referralCode is required" }, { status: 400 });
    }

    const { trackReferralUsage } = await import("@/lib/referral-engine");
    const result = await trackReferralUsage(referralCode, {
      referredName: body?.referredName,
      referredPhone: body?.referredPhone,
      referredEmail: body?.referredEmail,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[referrals/track] error", err);
    return NextResponse.json({ error: err?.message || "Failed to track referral" }, { status: 500 });
  }
}
