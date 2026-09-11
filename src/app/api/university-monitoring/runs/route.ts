import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/runs
// Returns monitoring run history.
export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 100);
  const runs = await db.verificationRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ runs });
}
