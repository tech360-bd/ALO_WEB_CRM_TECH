import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReferralStats } from "@/lib/referral-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/referrals/stats?studentId=...
// Auth required — returns referral stats for the given student.
//   - STUDENT role may only query their own studentId.
//   - SUPER_ADMIN / ADMIN / COUNSELOR may query any student.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const requestedStudentId = req.nextUrl.searchParams.get("studentId");

  if (!requestedStudentId) {
    return NextResponse.json({ error: "studentId query param is required" }, { status: 400 });
  }

  if (role === "STUDENT" && sessionStudentId && requestedStudentId !== sessionStudentId) {
    return NextResponse.json(
      { error: "Forbidden — students can only view their own referral stats" },
      { status: 403 }
    );
  }

  try {
    const stats = await getReferralStats(requestedStudentId);
    return NextResponse.json({ stats });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}
