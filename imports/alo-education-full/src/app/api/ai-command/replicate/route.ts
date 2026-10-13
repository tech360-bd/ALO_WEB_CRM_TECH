import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/ai-command/replicate
// AI Agent Self-Replication — each agent builds 3 child agents per 3-month cycle.
// After 2 successful cycles, the agent graduates to "2-loop AI model" status.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parentAgentId, requestedBy } = body;

    if (!parentAgentId || !requestedBy) {
      return NextResponse.json({ error: "parentAgentId and requestedBy are required" }, { status: 400 });
    }

    const parent = await db.aiEmployee.findUnique({ where: { id: parentAgentId } });
    if (!parent) return NextResponse.json({ error: "Parent AI agent not found" }, { status: 404 });
    if (parent.status !== "ACTIVE") {
      return NextResponse.json({ error: `Parent agent is ${parent.status}, must be ACTIVE to replicate` }, { status: 400 });
    }

    let department: any = null;
    if (parent.departmentId) {
      department = await db.enterpriseDepartment.findUnique({ where: { id: parent.departmentId } });
    }
    if (department && !department.canCreateAgents) {
      return NextResponse.json({
        error: `Department "${department.name}" is not DCC certified. Cannot create new agents.`,
        dccRequired: true,
        dccCriteria: { sopCoverage: department.sopCoverage, knowledgeCoverage: department.knowledgeCoverage, skillCoverage: department.skillCoverage, testPassRate: department.testPassRate },
      }, { status: 403 });
    }

    const existingCycle = await db.agentReplicationCycle.findFirst({ where: { parentAgentId, status: "ACTIVE" } });
    if (existingCycle) {
      return NextResponse.json({ error: "Agent already has an active replication cycle.", cycle: existingCycle }, { status: 409 });
    }

    const previousCycles = await db.agentReplicationCycle.count({ where: { parentAgentId } });
    const cycleNumber = previousCycles + 1;
    const isSecondCycle = cycleNumber === 2;

    const cycleStart = new Date();
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 3);

    const cycle = await db.agentReplicationCycle.create({
      data: {
        parentAgentId,
        parentAgentCode: parent.employeeCode,
        departmentId: parent.departmentId,
        cycleNumber,
        cycleStartDate: cycleStart,
        cycleEndDate: cycleEnd,
        targetChildren: 3,
        childrenCreated: 0,
        childrenPassedDcc: 0,
        status: "ACTIVE",
        isTwoLoop: isSecondCycle,
        createdBy: requestedBy,
      },
    });

    const parentLineage = await db.aiAgentLineage.findFirst({ where: { agentId: parentAgentId } });
    const parentGeneration = parentLineage?.generation || 1;
    const parentPath = parentLineage?.lineagePath || parent.employeeCode;

    const children: any[] = [];
    const safeUserId = requestedBy && requestedBy.length === 25 ? requestedBy : null;

    for (let i = 1; i <= 3; i++) {
      const childCode = `${parent.employeeCode}-C${cycleNumber}-${i}`;
      const childName = `${parent.name} - Cycle${cycleNumber} Clone ${i}`;

      const child = await db.aiEmployee.create({
        data: { employeeCode: childCode, name: childName, departmentId: parent.departmentId, role: "SPECIALIST", status: "ACTIVE" },
      });

      await db.aiAgentLineage.create({
        data: {
          agentId: child.id,
          agentCode: child.employeeCode,
          parentAgentId: parent.id,
          parentAgentCode: parent.employeeCode,
          generation: parentGeneration + 1,
          lineagePath: `${parentPath} > ${childCode}`,
          isTwoLoopModel: false,
        },
      });

      await db.auditLog.create({
        data: {
          userId: safeUserId,
          action: "AI_ACTION",
          resource: "AiEmployee",
          resourceId: child.id,
          details: JSON.stringify({ action: "AGENT_REPLICATION", parentAgent: parent.employeeCode, childAgent: child.employeeCode, cycleNumber, generation: parentGeneration + 1 }),
        },
      });

      children.push(child);
    }

    await db.agentReplicationCycle.update({
      where: { id: cycle.id },
      data: { childrenCreated: 3, status: "COMPLETED", childrenPassedDcc: 3 },
    });

    let graduation: any = null;
    if (isSecondCycle) {
      if (parentLineage) {
        await db.aiAgentLineage.update({ where: { id: parentLineage.id }, data: { isTwoLoopModel: true, graduatedAt: new Date() } });
      } else {
        await db.aiAgentLineage.create({
          data: { agentId: parent.id, agentCode: parent.employeeCode, generation: 1, lineagePath: parent.employeeCode, isTwoLoopModel: true, graduatedAt: new Date() },
        });
      }
      await db.agentReplicationCycle.update({ where: { id: cycle.id }, data: { status: "COMPLETED", graduatedAt: new Date(), childrenPassedDcc: 3 } });

      graduation = {
        graduated: true,
        agentCode: parent.employeeCode,
        agentName: parent.name,
        message: `${parent.name} (${parent.employeeCode}) has graduated to 2-LOOP AI MODEL status! It can now be called an AI model — it has successfully completed 2 replication cycles and created 6 child agents total.`,
      };

      await db.auditLog.create({
        data: {
          userId: safeUserId,
          action: "AI_ACTION",
          resource: "AiEmployee",
          resourceId: parent.id,
          details: JSON.stringify({ action: "AGENT_GRADUATION", agentCode: parent.employeeCode, milestone: "2_LOOP_AI_MODEL", totalChildrenCreated: 6, cyclesCompleted: 2 }),
        },
      });
    }

    const totalAgents = await db.aiEmployee.count();
    const twoLoopModels = await db.aiAgentLineage.count({ where: { isTwoLoopModel: true } });

    return NextResponse.json({
      success: true,
      cycle: {
        id: cycle.id,
        cycleNumber,
        parentAgent: parent.employeeCode,
        parentName: parent.name,
        childrenCreated: 3,
        childCodes: children.map(c => c.employeeCode),
        cycleEnd: cycleEnd.toISOString(),
        isTwoLoop: isSecondCycle,
      },
      children,
      graduation,
      stats: {
        totalAgents,
        totalTwoLoopModels: twoLoopModels,
        message: isSecondCycle
          ? `${parent.name} graduated to 2-loop AI model! Total agents: ${totalAgents}.`
          : `Cycle ${cycleNumber} started. ${parent.name} created 3 child agents. After cycle 2, it will graduate to AI model status.`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "ALL";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);

  const cycles = await db.agentReplicationCycle.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const stats = {
    totalCycles: await db.agentReplicationCycle.count(),
    activeCycles: await db.agentReplicationCycle.count({ where: { status: "ACTIVE" } }),
    completedCycles: await db.agentReplicationCycle.count({ where: { status: "COMPLETED" } }),
    twoLoopModels: await db.aiAgentLineage.count({ where: { isTwoLoopModel: true } }),
    totalAgents: await db.aiEmployee.count(),
  };

  return NextResponse.json({ cycles, stats });
}
