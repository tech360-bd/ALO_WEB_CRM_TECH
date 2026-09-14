import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — AI agent registry (Central AI Command Center) — auth required (SEC-10)
export async function GET(request: Request) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
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

// PATCH — toggle agent status (admin only)
export async function PATCH(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.roles.some((r: string) => ['super_admin','admin','SUPER_ADMIN','ADMIN'].includes(r))) {
    return NextResponse.json({ error: 'Forbidden: admin required' }, { status: 403 });
  }
  const body = await req.json();
  const { id, status } = body;
  const agent = await db.aiAgentRegistry.update({ where: { id }, data: { status } });
  await db.auditLog.create({ data: { action: "AI_ACTION", resource: "AiAgentRegistry", resourceId: id, details: JSON.stringify({ status }) } });
  return NextResponse.json({ agent, message: `Agent ${status.toLowerCase()}.` });
}
