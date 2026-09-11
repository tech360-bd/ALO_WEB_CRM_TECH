import { NextRequest, NextResponse } from "next/server";
import { getJourneyStage, JOURNEY_STAGES } from "@/lib/brains/student-intelligence-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/journey-stage?studentId=...
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }
    const stage = await getJourneyStage(studentId);
    if (stage === null) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({
      studentId,
      journeyStage: stage,
      stageIndex: JOURNEY_STAGES.indexOf(stage),
      totalStages: JOURNEY_STAGES.length,
      allStages: JOURNEY_STAGES,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
