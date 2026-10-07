import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMonitoringViewer } from "@/lib/university-monitoring-auth";

// GET /api/university-monitoring/runs
// Returns monitoring run history.
export async function GET(req: NextRequest) {
  // Staff-only: this endpoint exposes unapproved, unverified detected changes.
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 100);
  const runs = await db.verificationRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ runs });
}
