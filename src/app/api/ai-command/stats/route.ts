import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai-command/stats
// Returns aggregated AiCommandAction stats. SUPER_ADMIN / ADMIN only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN required" }, { status: 403 });
  }

  try {
    const grouped = await db.aiCommandAction.groupBy({
      by: ["status"],
      _count: true,
    });

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const g of grouped) {
      byStatus[g.status] = g._count;
      total += g._count;
    }

    const recent = await db.aiCommandAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        actionType: true,
        targetType: true,
        targetId: true,
        status: true,
        riskLevel: true,
        createdAt: true,
        executedAt: true,
      },
    });

    const byRisk = await db.aiCommandAction.groupBy({
      by: ["riskLevel"],
      _count: true,
    });
    const riskDistribution: Record<string, number> = {};
    for (const r of byRisk) {
      riskDistribution[r.riskLevel || "UNKNOWN"] = r._count;
    }

    return NextResponse.json({
      total,
      byStatus,
      riskDistribution,
      recent,
    });
  } catch (err: any) {
    console.error("[ai-command/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load stats" }, { status: 500 });
  }
}
