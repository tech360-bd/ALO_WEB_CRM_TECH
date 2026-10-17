import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-command/retry
// Retry a previously-failed AiCommandAction (up to 3 attempts).
// SUPER_ADMIN / ADMIN only.
// Body: { actionId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN required" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const actionId = body?.actionId as string;
    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const { retryFailedAction } = await import("@/lib/ai-action-executor");
    const result = await retryFailedAction(actionId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[ai-command/retry] error", err);
    return NextResponse.json({ error: err?.message || "Retry failed" }, { status: 500 });
  }
}
