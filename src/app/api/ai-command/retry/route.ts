import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-command/retry — SUPER_ADMIN/ADMIN only.
// A failed external action can have an uncertain outcome. This endpoint never
// resets its state or invokes an executor; an authorized operator must reconcile
// the original side effect before creating a separately approved replacement.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as { role?: string; id?: string };
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    if (!user.id) return NextResponse.json({ error: "Authenticated user identity is missing" }, { status: 403 });

    const body = await req.json().catch(() => null) as { actionId?: unknown } | null;
    const actionId = typeof body?.actionId === "string" ? body.actionId.trim() : "";
    if (!actionId || actionId.length > 191 || /[\u0000-\u001f\u007f]/.test(actionId)) {
      return NextResponse.json({ error: "A valid actionId is required" }, { status: 400 });
    }

    const action = await db.aiCommandAction.findUnique({ where: { id: actionId }, select: { id: true, actionType: true, status: true } });
    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });
    if (action.status === "EXECUTED") {
      return NextResponse.json({ success: false, code: "ACTION_ALREADY_EXECUTED", error: "Cannot retry an action that already succeeded." }, { status: 409 });
    }

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "AI_ACTION_RETRY_BLOCKED",
        resource: "AiCommandAction",
        resourceId: action.id,
        details: JSON.stringify({ actionType: action.actionType, currentStatus: action.status, reason: "MANUAL_RECONCILIATION_REQUIRED" }),
        actorRole: user.role,
      },
    });

    const retryableState = action.status === "FAILED" || action.status === "EXECUTING" || action.status === "PERMANENTLY_FAILED";
    return NextResponse.json({
      success: false,
      code: retryableState ? "RETRY_REQUIRES_RECONCILIATION" : "ACTION_NOT_RETRYABLE",
      actionId: action.id,
      currentStatus: action.status,
      error: retryableState
        ? "Automatic retry is disabled because the prior executor may have completed its side effect. Reconcile the original action before requesting a replacement."
        : "Only a separately verified, action-specific workflow may retry this action; pending actions should be reviewed through the approval queue.",
    }, { status: 409 });
  } catch (error) {
    console.error("[ai-command.retry] request failed", { error: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "AI action retry could not be safely evaluated." }, { status: 503 });
  }
}
