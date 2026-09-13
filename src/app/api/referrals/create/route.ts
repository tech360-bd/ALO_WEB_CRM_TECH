import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/referrals/create
// Create a new referral. Auth: STUDENT or SUPER_ADMIN.
// Body: { referrerStudentId, campaign?, source?, rewardOffered? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — STUDENT or SUPER_ADMIN only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Resolve referrerStudentId — STUDENT role uses session studentId, SUPER_ADMIN must supply it
    let referrerStudentId: string | undefined = body?.referrerStudentId;
    if (role === "STUDENT") {
      referrerStudentId = referrerStudentId || (session.user as any).studentId;
    }
    if (!referrerStudentId) {
      return NextResponse.json({ error: "referrerStudentId is required" }, { status: 400 });
    }

    const { createReferral } = await import("@/lib/referral-engine");
    const result = await createReferral(referrerStudentId, {
      campaign: body?.campaign,
      source: body?.source,
      rewardOffered: body?.rewardOffered,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[referrals/create] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create referral" }, { status: 500 });
  }
}
