import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const departmentId = req.nextUrl.searchParams.get("departmentId");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);

  const where: any = { status: "ACTIVE" };
  if (departmentId) where.departmentId = departmentId;

  const employees = await db.aiEmployee.findMany({
    where,
    orderBy: { employeeCode: "asc" },
    take: limit,
    select: { id: true, employeeCode: true, name: true, departmentId: true, role: true, status: true },
  });

  const lineageMap: Record<string, any> = {};
  const lineages = await db.aiAgentLineage.findMany({ where: { agentId: { in: employees.map(e => e.id) } } });
  for (const l of lineages) lineageMap[l.agentId] = l;

  const cycleMap: Record<string, any> = {};
  const cycles = await db.agentReplicationCycle.findMany({ where: { parentAgentId: { in: employees.map(e => e.id) } }, orderBy: { createdAt: "desc" } });
  for (const c of cycles) { if (!cycleMap[c.parentAgentId]) cycleMap[c.parentAgentId] = c; }

  const result = employees.map(e => ({
    ...e,
    lineage: lineageMap[e.id] || null,
    isTwoLoopModel: lineageMap[e.id]?.isTwoLoopModel || false,
    generation: lineageMap[e.id]?.generation || 1,
    hasActiveCycle: cycleMap[e.id]?.status === "ACTIVE" || false,
    cyclesCompleted: cycles.filter(c => c.parentAgentId === e.id && c.status === "COMPLETED").length,
  }));

  return NextResponse.json({ agents: result, count: result.length, twoLoopModels: result.filter(a => a.isTwoLoopModel).length });
}
