import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReferral } from "@/lib/referral-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/referrals/create
// Auth required — STUDENT (creates own referral code) or SUPER_ADMIN (on behalf).
// Body: { referrerStudentId, campaign?, source?, rewardOffered? }
//   - If caller is STUDENT, referrerStudentId must match their session.
//   - If caller is SUPER_ADMIN, any referrerStudentId is allowed.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  const sessionStudentId = (session.user as { studentId?: string }).studentId;

  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Forbidden — only STUDENT or SUPER_ADMIN can create referrals" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { referrerStudentId, campaign, source, rewardOffered } = body as {
    referrerStudentId?: string;
    campaign?: string;
    source?: string;
    rewardOffered?: string;
  };

  if (!referrerStudentId) {
    return NextResponse.json({ error: "referrerStudentId is required" }, { status: 400 });
  }

  // STUDENT role can only create referrals for themselves
  if (role === "STUDENT" && sessionStudentId && referrerStudentId !== sessionStudentId) {
    return NextResponse.json(
      { error: "Students can only create referrals for themselves" },
      { status: 403 }
    );
  }

  try {
    const referral = await createReferral(referrerStudentId, {
      campaign,
      source,
      rewardOffered,
    });
    return NextResponse.json({ ok: true, referral });
  } catch (err: unknown) {
    const e = err as { message?: string };
    const status = e?.message === "Referrer student not found" ? 404 : 500;
    return NextResponse.json(
      { error: e?.message || "Failed to create referral" },
      { status }
    );
  }
}
