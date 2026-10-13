import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "PENDING";
  const riskLevel = req.nextUrl.searchParams.get("riskLevel");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (riskLevel) where.riskLevel = riskLevel;

  const [actions, stats] = await Promise.all([
    db.aiCommandAction.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
    db.aiCommandAction.groupBy({ by: ["status"], _count: true }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const s of stats) statusCounts[s.status] = s._count;

  return NextResponse.json({
    actions,
    stats: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      pending: statusCounts.PENDING || 0,
      approved: statusCounts.APPROVED || 0,
      executed: statusCounts.EXECUTED || 0,
      failed: statusCounts.FAILED || 0,
      rolledBack: statusCounts.ROLLED_BACK || 0,
    },
  });
}
