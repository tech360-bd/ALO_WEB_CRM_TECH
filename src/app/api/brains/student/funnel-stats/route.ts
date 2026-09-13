import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/funnel-stats
// Returns the student funnel statistics (across all students).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getStudentFunnelStats } = await import("@/lib/brains/student-intelligence-brain");
    const stats = await getStudentFunnelStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[brains/student/funnel-stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load funnel stats" }, { status: 500 });
  }
}
