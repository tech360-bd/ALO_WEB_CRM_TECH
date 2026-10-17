import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/journey-stage?studentId=
// Returns the student's current journey stage.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId query param is required" }, { status: 400 });
    }

    const { getJourneyStage } = await import("@/lib/brains/student-intelligence-brain");
    const stage = await getJourneyStage(studentId);
    return NextResponse.json(stage);
  } catch (err: any) {
    console.error("[brains/student/journey-stage] error", err);
    return NextResponse.json({ error: err?.message || "Failed to compute journey stage" }, { status: 500 });
  }
}
