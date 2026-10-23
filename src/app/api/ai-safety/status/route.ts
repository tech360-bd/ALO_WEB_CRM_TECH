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

    const aiSafety = await import("@/lib/ai-safety");
    const [globalAiPaused, activePauses] = await Promise.all([
      aiSafety.isGlobalAiPaused(),
      db.globalAiPause.findMany({ where: { active: true } }),
    ]);
    const scopedPaused = scope
      ? await aiSafety.isScopedAiPaused(scope, targetId || undefined)
      : undefined;

    return NextResponse.json({
      globalAiPaused,
      canManageGlobalPause: role === "SUPER_ADMIN",
      scopedPaused,
      activePauses,
      totalActive: activePauses.length,
      filter: { scope, targetId },
      delegated: "ai-safety",
    });
  } catch (err: any) {
    console.error("[ai-safety.status] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
