import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAutomationStats } from "@/lib/crm-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getAutomationStats();

    // Get AI task queue stats
    const aiTasks = await db.aiTask.groupBy({ by: ["status"], _count: true });
    const aiAgentStats = await db.aiAgent.groupBy({ by: ["department"], _count: true });
    const recentActions = await db.aiAction.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { id: true, agentName: true, actionType: true, toolName: true, success: true, createdAt: true },
    });

    return NextResponse.json({
      automation: stats,
      aiTaskQueue: aiTasks.map((t: any) => ({ status: t.status, count: t._count })),
      aiAgentsByDepartment: aiAgentStats.map((a: any) => ({ department: a.department, count: a._count })),
      recentActions,
      totalAgents: await db.aiAgent.count(),
      totalAiTasks: await db.aiTask.count(),
      totalFormSubmissions: await db.formSubmission.count(),
      targetAutomation: 70,
      status: stats.automationPercentage >= 70 ? "TARGET_MET" : "BELOW_TARGET",
    });
  } catch (error: any) {
    console.error("[automation.dashboard] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
