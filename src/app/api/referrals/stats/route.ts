import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/referrals/stats?studentId=
// Returns referral stats for a student. Auth: any logged-in user.
// STUDENT role defaults to their own studentId.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId && (session.user as any).role === "STUDENT") {
      studentId = (session.user as any).studentId;
    }
    if (!studentId) {
      return NextResponse.json({ error: "studentId query param is required" }, { status: 400 });
    }

    const { getReferralStats } = await import("@/lib/referral-engine");
    const stats = await getReferralStats(studentId);
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[referrals/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load referral stats" }, { status: 500 });
  }
}
