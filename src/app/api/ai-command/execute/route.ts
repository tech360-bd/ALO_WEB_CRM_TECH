import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deployContentFallback } from "@/lib/course-finder/ai-content-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_ACTION_TYPES = new Set(["CREATE_LEAD", "UPDATE_STUDENT", "MODIFY_APPLICATION", "BUILD_AGENT", "DEPLOY_CONTENT", "MODIFY_CRM"]);

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function actionPayloadMatches(action: any, identity: { actionType: string; targetType: string; targetId: string | null; payload: Record<string, unknown>; actorId: string }): boolean {
  let savedPayload: unknown;
  try { savedPayload = JSON.parse(action.payload || "{}"); } catch { return false; }
  return action.requestedBy === identity.actorId
    && action.actionType === identity.actionType
    && action.targetType === identity.targetType
    && (action.targetId || null) === identity.targetId
    && isRecord(savedPayload)
    && stableJson(savedPayload) === stableJson(identity.payload);
}

function idempotencyConflict() {
  return NextResponse.json({ success: false, code: "IDEMPOTENCY_KEY_REUSED", error: "This idempotency key is already bound to a different action or actor." }, { status: 409 });
}

async function isGlobalAiPaused(): Promise<boolean> {
  try {
    const safety = await import("@/lib/ai-safety");
    if (typeof safety.isGlobalAiPaused === "function") return await safety.isGlobalAiPaused();
  } catch {
    // Fall back to the persisted pause record when the helper is unavailable.
  }
  return Boolean(await db.globalAiPause.findFirst({ where: { scope: "GLOBAL", active: true }, select: { id: true } }));
}

function executionResponse(actionId: string, result: any, action: unknown, message: string) {
  if (result?.status === "EXECUTED" || result?.status === "CACHED") {
    return NextResponse.json({ action, result, message });
  }
  if (result?.status === "PENDING" || result?.status === "APPROVED" || result?.status === "EXECUTING") {
    return NextResponse.json({ success: true, action, result, actionId, message: "Action is still pending or already executing; inspect its durable status before any retry." }, { status: 202 });
  }
  return NextResponse.json({ success: false, action, result, actionId, code: "EXECUTION_FAILED_OR_UNCONFIRMED", error: "Action execution did not complete successfully. Inspect the action record before retrying." }, { status: 503 });
}

// POST /api/ai-command/execute — create + (optionally) execute an AiCommandAction.
// Delegates execution to ai-action-executor when available; otherwise uses inline fallback.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    const actorId = (session.user as { id?: string }).id;
    if (!actorId) return NextResponse.json({ error: "Authenticated user identity is missing" }, { status: 403 });
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    if (!isRecord(body)) return NextResponse.json({ error: "A valid action request is required." }, { status: 400 });
    const { actionType, targetType, autoApprove, idempotencyKey } = body;
    const targetId = typeof body.targetId === "string" ? body.targetId.trim() : null;
    const payload = body.payload === undefined ? {} : body.payload;

    if (typeof actionType !== "string" || !SUPPORTED_ACTION_TYPES.has(actionType) || typeof targetType !== "string" || !targetType.trim() || targetType.length > 80) {
      return NextResponse.json({ error: "A supported actionType and valid targetType are required." }, { status: 400 });
    }
    if (targetId !== null && (targetId.length > 191 || /[\u0000-\u001f\u007f]/.test(targetId))) {
      return NextResponse.json({ error: "targetId is invalid." }, { status: 400 });
    }
    if (!isRecord(payload)) return NextResponse.json({ error: "payload must be a JSON object." }, { status: 400 });
    if (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9:_-]{8,191}$/.test(idempotencyKey)) {
      return NextResponse.json({ error: "A stable idempotencyKey of 8-191 safe characters is required." }, { status: 400 });
    }
    const identity = { actionType, targetType: targetType.trim(), targetId, payload, actorId };

    // Check Global AI Pause — block all AI action writes when paused.
    if (await isGlobalAiPaused()) {
      return NextResponse.json({ error: "AI execution is globally paused by Super Admin", paused: true }, { status: 423 });
    }

    // Same-key replays are safe only when the authenticated actor and the
    // complete action identity match. A key cannot be repurposed to mutate a
    // different target or payload.
    const existing = await db.aiCommandAction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (!actionPayloadMatches(existing, identity)) return idempotencyConflict();
      return NextResponse.json({ action: existing, idempotent: true, message: "Action with this idempotencyKey already exists." });
    }

    const riskLevel = assessRisk(actionType, payload);
    const riskFlags: string[] = [];
    if (typeof payload.amount === "number" && payload.amount > 50000) riskFlags.push("HIGH_VALUE_TRANSACTION");
    if (actionType === "MODIFY_CRM" && payload.table === "User") riskFlags.push("USER_MODIFICATION");
    if (actionType === "BUILD_AGENT") riskFlags.push("AGENT_CREATION");
    if (actionType === "DEPLOY_CONTENT") riskFlags.push("PUBLIC_CONTENT");

    const shouldAutoApprove = riskLevel === "LOW" && autoApprove === true;
    let action: any;
    try {
      action = await db.aiCommandAction.create({
        data: {
          actionType,
          targetType: targetType.trim(),
          targetId,
          requestedBy: actorId,
          aiAgentId: null,
          trigger: "USER_REQUEST",
          actor: "USER",
          idempotencyKey,
          payload: JSON.stringify(payload),
          riskLevel,
          riskFlags: JSON.stringify(riskFlags),
          status: shouldAutoApprove ? "APPROVED" : "PENDING",
          approvedBy: shouldAutoApprove ? actorId : null,
          approvedAt: shouldAutoApprove ? new Date() : null,
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        const raced = await db.aiCommandAction.findUnique({ where: { idempotencyKey } });
        if (raced && actionPayloadMatches(raced, identity)) {
          return NextResponse.json({ action: raced, idempotent: true, message: "Action with this idempotencyKey already exists." });
        }
        if (raced) return idempotencyConflict();
      }
      throw error;
    }

    if (action.status === "APPROVED") {
      try {
        const executor = await import("@/lib/ai-action-executor");
        if (typeof (executor as any).approveAndExecute !== "function") throw new Error("Approval executor is unavailable");
        const result = await (executor as any).approveAndExecute(action.id, actorId, (approvedPayload: Record<string, unknown>) =>
          executeActionInline(actionType, targetType, targetId || undefined, approvedPayload, actorId, action.id)
        );
        const latestAction = await db.aiCommandAction.findUnique({ where: { id: action.id } }).catch(() => action);
        return executionResponse(action.id, result, latestAction, `Action processed through the approval executor (${riskLevel} risk).`);
      } catch (error) {
        console.error("[ai-command.execute] approval executor failed", { error: error instanceof Error ? error.name : "UnknownError", actionId: action.id });
        return NextResponse.json({ success: false, code: "EXECUTION_OUTCOME_UNCERTAIN", actionId: action.id, error: "Action execution could not be confirmed. Do not retry with a new key; inspect this action record." }, { status: 503 });
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
  } catch (err) {
    console.error("[ai-command.execute] request failed", { error: err instanceof Error ? err.name : "UnknownError" });
    return NextResponse.json({ error: "AI action request could not be completed." }, { status: 503 });
  }
}

// GET /api/ai-command/execute — list actions (optionally filter by status)
export async function GET(req: NextRequest) {
  try {
    // Phase 1 review: action payloads can contain CRM data, so listing them
    // requires the same ADMIN/SUPER_ADMIN check as POST/PATCH (previously the
    // handler relied on the proxy alone).
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
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
    const actorId = (session.user as any).id as string | undefined;
    if (!actorId) return NextResponse.json({ error: "Authenticated user identity is missing" }, { status: 403 });
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const id = isRecord(body) && typeof body.id === "string" ? body.id.trim() : "";
    const decision = isRecord(body) && typeof body.decision === "string" ? body.decision : "";

    if (!id || !decision) {
      return NextResponse.json(
        { error: "id and decision are required" },
        { status: 400 }
      );
    }

    const action = await db.aiCommandAction.findUnique({ where: { id } });
    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

    const safeUserId = actorId;

    if (decision === "APPROVED") {
      if (action.status !== "PENDING" && action.status !== "APPROVED") {
        return NextResponse.json({ success: false, code: "ACTION_NOT_APPROVABLE", error: `Action is not awaiting approval (current status: ${action.status}).` }, { status: 409 });
      }
      if (await isGlobalAiPaused()) return NextResponse.json({ success: false, paused: true, error: "AI execution is globally paused by Super Admin." }, { status: 423 });
      try {
        const executor = await import("@/lib/ai-action-executor");
        if (typeof (executor as any).approveAndExecute !== "function") throw new Error("Approval executor is unavailable");
        const result = await (executor as any).approveAndExecute(id, safeUserId, (approvedPayload: Record<string, unknown>) =>
          executeActionInline(action.actionType, action.targetType, action.targetId || undefined, approvedPayload, safeUserId, id)
        );
        const latestAction = await db.aiCommandAction.findUnique({ where: { id } }).catch(() => action);
        return executionResponse(id, result, latestAction, "Action processed through the human-approval executor.");
      } catch (error) {
        console.error("[ai-command.execute PATCH] approval executor failed", { error: error instanceof Error ? error.name : "UnknownError", actionId: id });
        return NextResponse.json({ success: false, code: "EXECUTION_OUTCOME_UNCERTAIN", actionId: id, error: "Execution could not be confirmed. Inspect the action record before retrying." }, { status: 503 });
      }
    } else if (decision === "REJECTED") {
      if (action.status !== "PENDING" && action.status !== "APPROVED") {
        return NextResponse.json({ success: false, code: "ACTION_NOT_REJECTABLE", error: `Action is not awaiting a decision (current status: ${action.status}).` }, { status: 409 });
      }
      const rejected = await db.$transaction(async (tx) => {
        const update = await tx.aiCommandAction.updateMany({
          where: { id, status: action.status, executedAt: null },
          data: { status: "REJECTED", result: JSON.stringify({ rejected: true, rejectedBy: safeUserId, rejectedAt: new Date().toISOString() }) },
        });
        if (update.count !== 1) return false;
        await tx.auditLog.create({
          data: { userId: safeUserId, action: "AI_ACTION_REJECTED", resource: "AiCommandAction", resourceId: id, details: JSON.stringify({ actionType: action.actionType, targetType: action.targetType, targetId: action.targetId }), actorRole: role },
        });
        return true;
      });
      if (!rejected) return NextResponse.json({ success: false, code: "ACTION_STATE_CHANGED", error: "The action changed while being rejected. Reload its current status." }, { status: 409 });
      return NextResponse.json({ success: true, message: "Action rejected.", actionId: id });
    } else if (decision === "ROLLBACK") {
      return NextResponse.json({ success: false, code: "COMPENSATION_UNAVAILABLE", error: "No verified compensation handler is registered for this action; bookkeeping-only rollback is disabled." }, { status: 409 });
    }

    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  } catch (err) {
    console.error("[ai-command.execute PATCH] request failed", { error: err instanceof Error ? err.name : "UnknownError" });
    return NextResponse.json({ error: "AI action decision could not be completed." }, { status: 503 });
  }
}

function assessRisk(actionType: string, payload: any): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (actionType === "CREATE_LEAD") {
    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const phone = typeof payload?.phone === "string" ? payload.phone.replace(/[\s().-]/g, "") : "";
    return name.length >= 2 && name.length <= 191 && /^\+?\d{8,15}$/.test(phone) ? "LOW" : "HIGH";
  }
  if (actionType === "MODIFY_CRM" && payload?.table === "Payment") return "CRITICAL";
  if (actionType === "UPDATE_STUDENT" || actionType === "MODIFY_APPLICATION" || actionType === "MODIFY_CRM" || actionType === "BUILD_AGENT" || actionType === "DEPLOY_CONTENT") return "HIGH";
  return "HIGH";
}

async function executeActionInline(
  actionType: string,
  targetType: string,
  targetId: string | undefined,
  payload: any,
  actorId: string,
  executionId?: string
): Promise<any> {
  switch (actionType) {
    case "CREATE_LEAD": {
      if (!executionId) throw new Error("Idempotent action identity is required");
      const leadName = typeof payload?.name === "string" ? payload.name.trim() : "";
      const phone = typeof payload?.phone === "string" ? payload.phone.replace(/[\s().-]/g, "") : "";
      if (leadName.length < 2 || leadName.length > 191 || /[\u0000-\u001f\u007f]/.test(leadName) || !/^\+?\d{8,15}$/.test(phone)) {
        throw new Error("A real lead name and valid phone number are required; placeholder leads are not created");
      }
      const leadId = `ALO-AI-${executionId}`;
      const existing = await db.lead.findFirst({ where: { leadId } });
      if (existing) return { id: existing.id, summary: `Lead ${existing.leadId} already created for this action` };
      const lead = await db.lead.create({
        data: {
          leadId,
          fullName: leadName,
          email: typeof payload?.email === "string" ? payload.email.trim() || null : null,
          phone,
          source: payload?.source || "AI_COMMAND",
          sourceDetail: `Created by AI Command Center`,
          notes: payload?.notes || "Created from an authorized AI command",
          status: "NEW",
        },
      });
      return { id: lead.id, summary: `Lead ${lead.leadId} created` };
    }
    case "UPDATE_STUDENT": {
      if (!targetId) throw new Error("targetId required for UPDATE_STUDENT");
      const ALLOWED_STUDENT_FIELDS = ["name", "email", "phone", "notes", "status", "stage", "priority", "assignedTo", "tags", "lastContactAt", "nextFollowUp"];
      const safeStudentData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload?.data || {})) {
        if (ALLOWED_STUDENT_FIELDS.includes(key)) {
          safeStudentData[key] = value;
        }
      }
      const student = await db.student.update({
        where: { id: targetId },
        data: safeStudentData,
      });
      return { id: student.id, summary: `Student ${student.studentId} updated` };
    }
    case "MODIFY_APPLICATION": {
      if (!targetId) throw new Error("targetId required for MODIFY_APPLICATION");
      const app = await db.application.findUnique({ where: { id: targetId }, select: { id: true, studentId: true } });
      if (!app) throw new Error("Application not found");
      const note = typeof payload?.data?.comment === "string" ? payload.data.comment.trim() : typeof payload?.data?.notes === "string" ? payload.data.notes.trim() : "";
      if (!note || note.length > 5000) throw new Error("A note of 1-5000 characters is required; AI cannot change application status or stage");
      const priorComment = executionId ? await db.applicationComment.findUnique({ where: { id: executionId } }) : null;
      if (priorComment) return { id: app.id, commentId: priorComment.id, summary: "Internal note already appended for this action" };
      const comment = await db.applicationComment.create({
        data: { ...(executionId ? { id: executionId } : {}), applicationId: app.id, userId: actorId, role: "APPLICATION_TEAM", commentType: "APPLICATION_TEAM_INTERNAL", visibility: "internal", commentText: note, isB2bConfidential: false },
      });
      await db.auditLog.create({
        data: { userId: actorId, action: "AI_APPLICATION_NOTE_CREATED", resource: "ApplicationComment", resourceId: comment.id, details: JSON.stringify({ applicationId: app.id }), actorRole: "AI_COMMAND", studentId: app.studentId },
      });
      return { id: app.id, commentId: comment.id, summary: "Internal application note appended; stage and decision fields were not changed" };
    }
    case "BUILD_AGENT": {
      if (!executionId) throw new Error("Idempotent action identity is required");
      const existingAgent = await db.aiEmployee.findUnique({ where: { id: executionId } });
      if (existingAgent) return { id: existingAgent.id, summary: `AI Agent ${existingAgent.employeeCode} already created for this action` };
      const dept = payload?.departmentId
        ? await db.enterpriseDepartment.findUnique({
            where: { id: payload.departmentId },
          })
        : null;
      if (!dept) throw new Error("Valid departmentId required for BUILD_AGENT");
      if (!dept.canCreateAgents && !dept.dccCertified)
        throw new Error("Department is not DCC certified — cannot create new agents.");
      const agent = await db.aiEmployee.create({
        data: {
          id: executionId,
          employeeCode: `AI-${dept.deptCode}-${executionId.slice(-8).toUpperCase()}`,
          name: typeof payload?.name === "string" && payload.name.trim() ? payload.name.trim().slice(0, 191) : `AI Agent ${executionId.slice(-4)}`,
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
      // Phase 1 review (P0-B): never invent facts, never inherit the
      // VERIFIED/PUBLISHED schema defaults, never mass-assign payload.data and
      // never report success for an unsupported target.
      return deployContentFallback(targetType, targetId, payload);
    }
    case "MODIFY_CRM": {
      const ALLOWED_CRM_FIELDS = ["status", "notes", "priority", "tags", "assignedTo"];
      return { summary: `CRM modification logged for ${targetType}`, allowedFields: ALLOWED_CRM_FIELDS, payloadFiltered: Object.keys(payload?.data || {}).filter(k => ALLOWED_CRM_FIELDS.includes(k)) };
    }
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
