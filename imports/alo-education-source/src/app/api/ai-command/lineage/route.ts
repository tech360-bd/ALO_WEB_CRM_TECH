import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId");
  const generation = req.nextUrl.searchParams.get("generation");
  const twoLoopOnly = req.nextUrl.searchParams.get("twoLoopOnly") === "true";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  const where: any = {};
  if (agentId) where.agentId = agentId;
  if (generation) where.generation = parseInt(generation);
  if (twoLoopOnly) where.isTwoLoopModel = true;

  const lineages = await db.aiAgentLineage.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });

  const tree: Record<string, any> = {};
  const roots: any[] = [];
  for (const l of lineages) { tree[l.agentId] = { ...l, children: [] }; }
  for (const l of lineages) {
    if (l.parentAgentId && tree[l.parentAgentId]) { tree[l.parentAgentId].children.push(tree[l.agentId]); }
    else { roots.push(tree[l.agentId]); }
  }

  const stats = {
    totalAgents: await db.aiEmployee.count(),
    totalWithLineage: lineages.length,
    twoLoopModels: lineages.filter(l => l.isTwoLoopModel).length,
    maxGeneration: lineages.length > 0 ? Math.max(...lineages.map(l => l.generation)) : 0,
    byGeneration: lineages.reduce((acc, l) => { acc[l.generation] = (acc[l.generation] || 0) + 1; return acc; }, {} as Record<number, number>),
  };

  return NextResponse.json({ tree: roots, lineages, stats });
}
