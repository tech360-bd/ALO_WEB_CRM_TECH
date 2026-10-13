import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/logs
// Returns monitoring logs (audit trail).
export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  const level = req.nextUrl.searchParams.get("level");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  const where: any = {};
  if (runId) where.runId = runId;
  if (level) where.level = level;

  const logs = await db.monitoringLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}
