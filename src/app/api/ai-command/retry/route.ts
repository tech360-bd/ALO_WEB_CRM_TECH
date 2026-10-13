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

    // The centralized ai-action-executor must handle retries. No unprotected inline fallback is permitted.
    return NextResponse.json(
      { error: "Retry blocked: centralized ai-action-executor unavailable. Unprotected fallback execution is not permitted for security and authorization compliance.", actionId },
      { status: 423 }
    );
  } catch (err: any) {
    console.error("[ai-command.retry] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
