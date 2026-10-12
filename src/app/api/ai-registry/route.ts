import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — AI agent registry (Central AI Command Center)
export async function GET() {
  const agents = await db.aiAgentRegistry.findMany({ orderBy: { agentType: "asc" } });
  return NextResponse.json({
    agents,
    stats: {
      total: agents.length,
      active: agents.filter(a => a.status === "ACTIVE").length,
      totalRequests: agents.reduce((s, a) => s + a.totalRequests, 0),
      dailyRequests: agents.reduce((s, a) => s + a.dailyRequests, 0),
      monthlyRequests: agents.reduce((s, a) => s + a.monthlyRequests, 0),
      avgSuccessRate: agents.length > 0 ? (agents.reduce((s, a) => s + a.successRate, 0) / agents.length).toFixed(1) : 0,
      errorCount: agents.reduce((s, a) => s + a.errorCount, 0),
    },
  });
}

// PATCH — toggle agent status
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const agent = await db.aiAgentRegistry.update({ where: { id }, data: { status } });
  await db.auditLog.create({ data: { action: "AI_ACTION", resource: "AiAgentRegistry", resourceId: id, details: JSON.stringify({ status }) } });
  return NextResponse.json({ agent, message: `Agent ${status.toLowerCase()}.` });
}
