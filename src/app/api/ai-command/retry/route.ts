import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-command/retry — SUPER_ADMIN/ADMIN only.
// Body: { actionId: string }
// Resets an action's status to PENDING, increments retryCount, clears lastError,
// then attempts execution via ai-action-executor (if available).
export async function POST(req: NextRequest) {
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
    const { actionId } = body;
    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const action = await db.aiCommandAction.findUnique({ where: { id: actionId } });
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    if (action.status === "EXECUTED") {
      return NextResponse.json(
        { error: "Cannot retry an action that already succeeded" },
        { status: 400 }
      );
    }

    // Bump retryCount + reset
    await db.aiCommandAction.update({
      where: { id: actionId },
      data: {
        retryCount: { increment: 1 },
        lastError: null,
        status: "PENDING",
      },
    });

    // Try to delegate to ai-action-executor
    try {
      const executor = await import("@/lib/ai-action-executor");
      if (typeof (executor as any).executeAiAction === "function") {
        const result = await (executor as any).executeAiAction(actionId, {
          actorId: (session.user as any).id,
          actorType: "USER",
        });
        return NextResponse.json({
          success: true,
          actionId,
          result,
          delegated: "ai-action-executor",
        });
      }
    } catch (err: any) {
      console.warn("[ai-command.retry] executor unavailable:", err?.message);
    }

    // Inline fallback: attempt execution by replaying the action's payload via existing patterns
    try {
      const payload = JSON.parse(action.payload || "{}");

      let result: any = null;
      if (action.actionType === "CREATE_LEAD") {
        const lead = await db.lead.create({
          data: {
            leadId: `ALO-AI-${Date.now().toString().slice(-6)}`,
            fullName: payload?.name || "AI-created Lead",
            email: payload?.email || null,
            phone: payload?.phone || "N/A",
            source: payload?.source || "AI_COMMAND",
            sourceDetail: "Retried from AI Command Center",
            notes: payload?.notes || "Auto-created",
            status: "NEW",
          },
        });
        result = { id: lead.id, summary: `Lead ${lead.leadId} created` };
      } else if (action.actionType === "UPDATE_STUDENT" && action.targetId) {
        const student = await db.student.update({
          where: { id: action.targetId },
          data: payload?.data || {},
        });
        result = { id: student.id, summary: `Student ${student.studentId} updated` };
      } else if (action.actionType === "MODIFY_APPLICATION" && action.targetId) {
        const app = await db.application.update({
          where: { id: action.targetId },
          data: payload?.data || {},
        });
        result = { id: app.id, summary: `Application ${app.applicationId} updated` };
      } else {
        result = { summary: `Retried action ${action.actionType} (no executor bound)` };
      }

      await db.aiCommandAction.update({
        where: { id: actionId },
        data: {
          status: "EXECUTED",
          result: JSON.stringify(result),
          executedAt: new Date(),
          lastError: null,
        },
      });

      return NextResponse.json({ success: true, actionId, result });
    } catch (err: any) {
      await db.aiCommandAction.update({
        where: { id: actionId },
        data: {
          status: "FAILED",
          lastError: err.message,
          result: JSON.stringify({ error: err.message }),
        },
      });
      return NextResponse.json(
        { error: err.message, actionId },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[ai-command.retry] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
