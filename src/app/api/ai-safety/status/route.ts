import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai-safety/status — SUPER_ADMIN/ADMIN only.
// Returns global AI pause status + active pauses by scope.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const scope = req.nextUrl.searchParams.get("scope");
    const targetId = req.nextUrl.searchParams.get("targetId");

    // Try ai-safety lib
    try {
      const aiSafety = await import("@/lib/ai-safety");
      if (typeof (aiSafety as any).isAiPaused === "function") {
        const paused = await (aiSafety as any).isAiPaused({ scope: scope || undefined, targetId: targetId || undefined });
        const activePauses = await db.globalAiPause.findMany({ where: { active: true } });
        return NextResponse.json({
          globalAiPaused: paused,
          activePauses,
          totalActive: activePauses.length,
          delegated: "ai-safety",
        });
      }
    } catch {
      // fall through
    }

    // Inline fallback
    const where: Record<string, unknown> = { active: true };
    if (scope) where.scope = scope;
    if (targetId) where.targetId = targetId;

    const activePauses = await db.globalAiPause.findMany({ where });
    const globalAiPaused =
      activePauses.some((p) => p.scope === "GLOBAL") || activePauses.length > 0;

    return NextResponse.json({
      globalAiPaused,
      activePauses,
      totalActive: activePauses.length,
      filter: { scope, targetId },
    });
  } catch (err: any) {
    console.error("[ai-safety.status] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
