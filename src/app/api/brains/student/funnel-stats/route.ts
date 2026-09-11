import { NextResponse } from "next/server";
import { getStudentFunnelStats } from "@/lib/brains/student-intelligence-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/student/funnel-stats
export async function GET() {
  try {
    const stats = await getStudentFunnelStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
