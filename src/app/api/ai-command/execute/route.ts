import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-command/execute — create + (optionally) execute an AiCommandAction.
// Delegates execution to ai-action-executor when available; otherwise uses inline fallback.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const body = await req.json();
    const {
      actionType,
      targetType,
      targetId,
      payload,
      requestedBy,
      aiAgentId,
      autoApprove,
      trigger,
      actor,
      idempotencyKey,
    } = body;

    if (!actionType || !targetType || !requestedBy) {
      return NextResponse.json(
        { error: "actionType, targetType, and requestedBy are required" },
        { status: 400 }
      );
    }

    // Check Global AI Pause — block ALL AI execution when paused
    try {
      const aiSafety = await import("@/lib/ai-safety");
      if (typeof (aiSafety as any).isGlobalAiPaused === "function") {
        const paused = await (aiSafety as any).isGlobalAiPaused();
        if (paused) {
          return NextResponse.json(
            { error: "AI execution is globally paused by Super Admin", paused: true },
            { status: 423 }
          );
        }
      }
    } catch {
      // ai-safety lib not available — check DB directly
      const pauseRecord = await db.globalAiPause.findFirst({ where: { scope: "GLOBAL", active: true } });
      if (pauseRecord) {
        return NextResponse.json(
          { error: "AI execution is globally paused by Super Admin", paused: true },
          { status: 423 }
        );
      }
    }

    // Idempotency check
    if (idempotencyKey) {
      const existing = await db.aiCommandAction.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return NextResponse.json({
          action: existing,
          idempotent: true,
          message: "Action with this idempotencyKey already exists.",
        });
      }
    }

    const riskLevel = assessRisk(actionType, payload);
    const riskFlags: string[] = [];
    if (payload?.amount && Number(payload.amount) > 50000) riskFlags.push("HIGH_VALUE_TRANSACTION");
    if (actionType === "MODIFY_CRM" && payload?.table === "User") riskFlags.push("USER_MODIFICATION");
    if (actionType === "BUILD_AGENT") riskFlags.push("AGENT_CREATION");
    if (actionType === "DEPLOY_CONTENT") riskFlags.push("PUBLIC_CONTENT");

    const shouldAutoApprove = riskLevel === "LOW" && autoApprove;

    const action = await db.aiCommandAction.create({
      data: {
        actionType,
        targetType,
        targetId: targetId || null,
        requestedBy,
        aiAgentId: aiAgentId || null,
        trigger: trigger || null,
        actor: actor || "USER",
        idempotencyKey: idempotencyKey || null,
        payload: JSON.stringify(payload || {}),
        riskLevel,
        riskFlags: JSON.stringify(riskFlags),
        status: shouldAutoApprove ? "APPROVED" : "PENDING",
        approvedBy: shouldAutoApprove ? requestedBy : null,
        approvedAt: shouldAutoApprove ? new Date() : null,
      },
    });

    if (action.status === "APPROVED") {
      // Delegate to ai-action-executor
      try {
        const executor = await import("@/lib/ai-action-executor");
        if (typeof (executor as any).executeAiAction === "function") {
          const result = await (executor as any).executeAiAction(action.id, {
            actorId: session?.user ? (session.user as any).id : requestedBy,
            actorType: "USER",
          });
          return NextResponse.json({
            action: { ...action, status: "EXECUTED", result },
            message: `Action executed via ai-action-executor (auto-approved, ${riskLevel} risk).`,
          });
        }
      } catch (err: any) {
        console.warn("[ai-command.execute] executor unavailable:", err?.message);
      }

      // Inline fallback
      try {
        const result = await executeActionInline(actionType, targetType, targetId, payload);
        await db.aiCommandAction.update({
          where: { id: action.id },
          data: {
            status: "EXECUTED",
            result: JSON.stringify(result),
            executedAt: new Date(),
          },
        });
        await db.auditLog
          .create({
            data: {
              userId: requestedBy && requestedBy.length === 25 ? requestedBy : null,
              action: "AI_ACTION",
              resource: targetType,
              resourceId: result?.id || targetId || action.id,
              details: JSON.stringify({ actionType, riskLevel, result: result?.summary || "executed" }),
            },
          })
          .catch(() => {});
        return NextResponse.json({
          action: { ...action, status: "EXECUTED", result },
          message: `Action executed successfully (auto-approved, ${riskLevel} risk).`,
        });
      } catch (err: any) {
        await db.aiCommandAction.update({
          where: { id: action.id },
          data: {
            status: "FAILED",
            lastError: err.message,
            result: JSON.stringify({ error: err.message }),
          },
        });
        return NextResponse.json(
          { error: err.message, actionId: action.id },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        action,
        message: `Action requires manual approval (risk: ${riskLevel}). Flags: ${
          riskFlags.join(", ") || "none"
        }.`,
        requiresApproval: true,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/ai-command/execute — list actions (optionally filter by status)
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") || "PENDING";
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") || "50"),
      200
    );
    const actions = await db.aiCommandAction.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ actions, count: actions.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/ai-command/execute — approve / reject / rollback an action.
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { id, decision, approvedBy, rollbackReason } = body;

    if (!id || !decision || !approvedBy) {
      return NextResponse.json(
        { error: "id, decision, and approvedBy are required" },
        { status: 400 }
      );
    }

    const action = await db.aiCommandAction.findUnique({ where: { id } });
    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

    const safeUserId = approvedBy && approvedBy.length === 25 ? approvedBy : null;

    if (decision === "APPROVED") {
      await db.aiCommandAction.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: safeUserId,
          approvedAt: new Date(),
        },
      });

      // Delegate to executor
      try {
        const executor = await import("@/lib/ai-action-executor");
        if (typeof (executor as any).executeAiAction === "function") {
          const result = await (executor as any).executeAiAction(id, {
            actorId: safeUserId || undefined,
            actorType: "USER",
          });
          return NextResponse.json({ action, result, message: "Action approved and executed via ai-action-executor." });
        }
      } catch (err: any) {
        console.warn("[ai-command.execute PATCH] executor unavailable:", err?.message);
      }

      // Inline fallback
      try {
        const payload = JSON.parse(action.payload || "{}");
        const result = await executeActionInline(
          action.actionType,
          action.targetType,
          action.targetId || undefined,
          payload
        );
        await db.aiCommandAction.update({
          where: { id },
          data: {
            status: "EXECUTED",
            result: JSON.stringify(result),
            executedAt: new Date(),
          },
        });
        await db.auditLog
          .create({
            data: {
              userId: safeUserId,
              action: "AI_ACTION",
              resource: action.targetType,
              resourceId: action.targetId || id,
              details: JSON.stringify({
                actionType: action.actionType,
                decision: "APPROVED",
                result: result?.summary,
              }),
            },
          })
          .catch(() => {});
        return NextResponse.json({
          action,
          result,
          message: "Action approved and executed.",
        });
      } catch (err: any) {
        await db.aiCommandAction.update({
          where: { id },
          data: {
            status: "FAILED",
            lastError: err.message,
            result: JSON.stringify({ error: err.message }),
          },
        });
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    } else if (decision === "REJECTED") {
      await db.aiCommandAction.update({
        where: { id },
        data: {
          status: "FAILED",
          approvedBy: safeUserId,
          approvedAt: new Date(),
          result: JSON.stringify({ rejected: true }),
        },
      });
      return NextResponse.json({ message: "Action rejected." });
    } else if (decision === "ROLLBACK") {
      if (action.status !== "EXECUTED") {
        return NextResponse.json(
          { error: "Only executed actions can be rolled back" },
          { status: 400 }
        );
      }
      await db.aiCommandAction.update({
        where: { id },
        data: {
          status: "ROLLED_BACK",
          rollbackReason: rollbackReason || "Manual rollback",
          rolledBackAt: new Date(),
        },
      });
      return NextResponse.json({ message: "Action rolled back." });
    }

    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function assessRisk(actionType: string, payload: any): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (actionType === "CREATE_LEAD") return "LOW";
  if (actionType === "UPDATE_STUDENT" && payload?.status) return "MEDIUM";
  if (actionType === "MODIFY_APPLICATION" && payload?.status === "REJECTED") return "HIGH";
  if (actionType === "MODIFY_CRM" && payload?.table === "Payment") return "CRITICAL";
  if (actionType === "BUILD_AGENT") return "MEDIUM";
  if (actionType === "DEPLOY_CONTENT") return "MEDIUM";
  return "LOW";
}

async function executeActionInline(
  actionType: string,
  targetType: string,
  targetId: string | undefined,
  payload: any
): Promise<any> {
  switch (actionType) {
    case "CREATE_LEAD": {
      const lead = await db.lead.create({
        data: {
          leadId: `ALO-AI-${Date.now().toString().slice(-6)}`,
          fullName: payload?.name || "AI-created Lead",
          email: payload?.email || null,
          phone: payload?.phone || "N/A",
          source: payload?.source || "AI_COMMAND",
          sourceDetail: `Created by AI Command Center`,
          notes: payload?.notes || "Auto-created from AI Command Center",
          status: "NEW",
        },
      });
      return { id: lead.id, summary: `Lead ${lead.leadId} created` };
    }
    case "UPDATE_STUDENT": {
      if (!targetId) throw new Error("targetId required for UPDATE_STUDENT");
      const student = await db.student.update({
        where: { id: targetId },
        data: payload?.data || {},
      });
      return { id: student.id, summary: `Student ${student.studentId} updated` };
    }
    case "MODIFY_APPLICATION": {
      if (!targetId) throw new Error("targetId required for MODIFY_APPLICATION");
      const app = await db.application.update({
        where: { id: targetId },
        data: payload?.data || {},
      });
      return { id: app.id, summary: `Application ${app.applicationId} updated` };
    }
    case "BUILD_AGENT": {
      const dept = payload?.departmentId
        ? await db.enterpriseDepartment.findUnique({
            where: { id: payload.departmentId },
          })
        : null;
      if (!dept) throw new Error("Valid departmentId required for BUILD_AGENT");
      if (!dept.canCreateAgents && !dept.dccCertified)
        throw new Error("Department is not DCC certified — cannot create new agents.");
      const count = await db.aiEmployee.count();
      const agent = await db.aiEmployee.create({
        data: {
          employeeCode: `AI-${dept.deptCode}-${String(count + 1).padStart(3, "0")}`,
          name: payload?.name || `AI Agent ${count + 1}`,
          departmentId: dept.id,
          role: payload?.role || "SPECIALIST",
          status: "ACTIVE",
        },
      });
      await db.aiAgentLineage.create({
        data: {
          agentId: agent.id,
          agentCode: agent.employeeCode,
          parentAgentId: payload?.parentAgentId || null,
          parentAgentCode: payload?.parentAgentCode || null,
          generation: payload?.generation || 1,
          lineagePath: payload?.lineagePath || agent.employeeCode,
        },
      });
      return {
        id: agent.id,
        summary: `AI Agent ${agent.employeeCode} (${agent.name}) created in ${dept.name}`,
      };
    }
    case "DEPLOY_CONTENT": {
      if (targetType === "CoursePage") {
        if (targetId) {
          const updated = await db.coursePage.update({
            where: { id: targetId },
            data: payload?.data || {},
          });
          return { id: updated.id, summary: `Course page ${updated.name} updated` };
        }
        const created = await db.coursePage.create({
          data: {
            name: payload?.name || "New Course",
            slug: payload?.slug || `course-${Date.now()}`,
            universitySlug: payload?.universitySlug || "aalborg-university",
            countrySlug: payload?.countrySlug || "denmark",
            city: payload?.city || "Unknown",
            level: payload?.level || "Bachelors",
            subject: payload?.subject || "General",
            duration: payload?.duration || "3 years",
            intake: payload?.intake || "September",
            tuition: payload?.tuition || "Contact for details",
            englishRequirement: payload?.englishRequirement || "IELTS 6.0",
            academicRequirement: payload?.academicRequirement || "SSC/HSC equivalent",
            overview: payload?.overview || "Course overview pending.",
            approvalStatus: "DRAFT",
          },
        });
        return { id: created.id, summary: `Course page ${created.name} created (draft)` };
      }
      return { summary: `Content deployed to ${targetType}` };
    }
    case "MODIFY_CRM": {
      return { summary: `CRM modification logged for ${targetType}` };
    }
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
