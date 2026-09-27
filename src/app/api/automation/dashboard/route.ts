import { NextResponse } from "next/server"
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { getAutomationStats } from "@/lib/crm-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/automation/dashboard — unified AutomationEvent stats + globalAiPaused + recentEvents.
async function getAutomationDashboard(_req: Request, _auth: AuthContext) {
  try {
    // Get original automation stats (from AutomationMetric)
    const stats = await getAutomationStats();

    // ── Unified AutomationEvent stats ──
    const [totalEvents, byMode, byCategory, byWorkflow, recentEvents] = await Promise.all([
      db.automationEvent.count(),
      db.automationEvent.groupBy({ by: ["mode"], _count: true }),
      db.automationEvent.groupBy({ by: ["category"], _count: true }),
      db.automationEvent.groupBy({
        by: ["workflow"],
        _count: true,
        orderBy: { _count: { workflow: "desc" } },
        take: 15,
      }),
      db.automationEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // ── Global AI pause status ──
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

    // AI task queue + agent stats
    const aiTasks = await db.aiTask.groupBy({ by: ["status"], _count: true });
    const aiAgentStats = await db.aiAgent.groupBy({ by: ["department"], _count: true });
    const recentActions = await db.aiAction.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        agentName: true,
        actionType: true,
        toolName: true,
        success: true,
        createdAt: true,
      },
    });

    const [totalAgents, totalAiTasks, totalFormSubmissions] = await Promise.all([
      db.aiAgent.count(),
      db.aiTask.count(),
      db.formSubmission.count(),
    ]);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const events24h = await db.automationEvent.count({
      where: { createdAt: { gte: last24h } },
    });

    return NextResponse.json({
      // Legacy (AutomationMetric-based)
      automation: stats,

      // Unified AutomationEvent stats
      automationEvents: {
        total: totalEvents,
        last24h: events24h,
        byMode: byMode.map((m: any) => ({ mode: m.mode, count: m._count.mode })),
        byCategory: byCategory.map((c: any) => ({
          category: c.category,
          count: c._count.category,
        })),
        byWorkflow: byWorkflow.map((w: any) => ({
          workflow: w.workflow,
          count: w._count.workflow,
        })),
        recent: recentEvents,
      },

      // Safety
      globalAiPaused,

      // AI agent stats
      aiTaskQueue: aiTasks.map((t: any) => ({ status: t.status, count: t._count })),
      aiAgentsByDepartment: aiAgentStats.map((a: any) => ({
        department: a.department,
        count: a._count,
      })),
      recentActions,
      totalAgents,
      totalAiTasks,
      totalFormSubmissions,

      // KPI target
      targetAutomation: 70,
      status: stats.automationPercentage >= 70 ? "TARGET_MET" : "BELOW_TARGET",
    });
  } catch (error: any) {
    console.error("[automation.dashboard] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getAutomationDashboard, {
  requireUserTypes: ["ADMIN", "SUPER_ADMIN"],
});
