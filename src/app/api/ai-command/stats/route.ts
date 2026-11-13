import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai-command/stats — SUPER_ADMIN/ADMIN only.
// Returns REAL stats: by status, by riskLevel, recent failures, globalAiPaused.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const since = req.nextUrl.searchParams.get("since");
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, byStatus, byRiskLevel, recentFailures, recentExecuted, totalRetries] = await Promise.all([
      db.aiCommandAction.count(),
      db.aiCommandAction.groupBy({ by: ["status"], _count: true }),
      db.aiCommandAction.groupBy({ by: ["riskLevel"], _count: true }),
      db.aiCommandAction.findMany({
        where: { status: "FAILED", createdAt: { gte: sinceDate } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          actionType: true,
          targetType: true,
          targetId: true,
          lastError: true,
          retryCount: true,
          createdAt: true,
        },
      }),
      db.aiCommandAction.count({
        where: { status: "EXECUTED", executedAt: { gte: sinceDate } },
      }),
      db.aiCommandAction.aggregate({ _sum: { retryCount: true } }),
    ]);

    // Check global AI pause status
    let globalAiPaused = false;
    try {
      const aiSafety = await import("@/lib/ai-safety");
      if (typeof (aiSafety as any).isAiPaused === "function") {
        globalAiPaused = await (aiSafety as any).isAiPaused({});
      } else {
        throw new Error("not bound");
      }
    } catch {
      const activePauses = await db.globalAiPause.findMany({ where: { active: true } });
      globalAiPaused = activePauses.length > 0;
    }

    const pending = byStatus.find((s: any) => s.status === "PENDING")?._count || 0;
    const approved = byStatus.find((s: any) => s.status === "APPROVED")?._count || 0;
    const executing = byStatus.find((s: any) => s.status === "EXECUTING")?._count || 0;
    const rejected = byStatus.find((s: any) => s.status === "REJECTED")?._count || 0;
    const executed = byStatus.find((s: any) => s.status === "EXECUTED")?._count || 0;
    const failed = byStatus.find((s: any) => s.status === "FAILED")?._count || 0;
    const rolledBack = byStatus.find((s: any) => s.status === "ROLLED_BACK")?._count || 0;

    return NextResponse.json({
      total,
      since: sinceDate.toISOString(),
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count.status })),
      byRiskLevel: byRiskLevel.map((r: any) => ({
        riskLevel: r.riskLevel,
        count: r._count.riskLevel,
      })),
      summary: {
        pending,
        approved,
        executing,
        rejected,
        executed,
        failed,
        rolledBack,
        executedInWindow: recentExecuted,
        totalRetries: totalRetries._sum.retryCount || 0,
        successRate:
          executed + failed > 0 ? Math.round((executed / (executed + failed)) * 10000) / 100 : 0,
      },
      recentFailures,
      globalAiPaused,
    });
  } catch (err: any) {
    console.error("[ai-command.stats] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
