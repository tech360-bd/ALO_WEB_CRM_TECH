import { NextRequest, NextResponse } from "next/server";
import { trackReferralUsage } from "@/lib/referral-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/referrals/track
// Public — a prospect uses a referral code (e.g. from a landing page form).
// Body: { referralCode, referredName?, referredPhone?, referredEmail? }
// Returns: { success, leadId, leadCode, referralId, referrerStudentId }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { referralCode, referredName, referredPhone, referredEmail } = body as {
    referralCode?: string;
    referredName?: string;
    referredPhone?: string;
    referredEmail?: string;
  };

  if (!referralCode) {
    return NextResponse.json({ error: "referralCode is required" }, { status: 400 });
  }

  try {
    const result = await trackReferralUsage(referralCode, {
      referredName,
      referredPhone,
      referredEmail,
    });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        INVALID_CODE: 400,
        MISSING_PROSPECT_INFO: 400,
        NOT_FOUND: 404,
        ALREADY_USED: 409,
        INTERNAL_ERROR: 500,
      };
      const status = statusMap[result.errorCode || "INTERNAL_ERROR"] || 500;
      return NextResponse.json(
        { ok: false, error: result.error, errorCode: result.errorCode },
        { status }
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to track referral" },
      { status: 500 }
    );
  }
}
