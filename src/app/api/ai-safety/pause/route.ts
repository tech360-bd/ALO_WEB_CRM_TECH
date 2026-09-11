import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-safety/pause — SUPER_ADMIN only.
// Body: { scope: "GLOBAL" | string, targetId?: string, reason?: string }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only SUPER_ADMIN can pause AI" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const scope = body.scope || "GLOBAL";
    const targetId = body.targetId || null;
    const reason = body.reason || "Manual SUPER_ADMIN pause";

    // Try to delegate to ai-safety lib (created by parallel agent)
    try {
      const aiSafety = await import("@/lib/ai-safety");
      if (scope === "GLOBAL" && typeof (aiSafety as any).activateGlobalPause === "function") {
        await (aiSafety as any).activateGlobalPause(reason, (session.user as any).id);
        return NextResponse.json({ success: true, paused: true, scope, delegated: "ai-safety" });
      }
      if (scope !== "GLOBAL" && targetId && typeof (aiSafety as any).activateScopedPause === "function") {
        await (aiSafety as any).activateScopedPause(scope, targetId, reason, (session.user as any).id);
        return NextResponse.json({ success: true, paused: true, scope, targetId, delegated: "ai-safety" });
      }
    } catch {
      // fall through to inline implementation
    }

    // Inline fallback — use findFirst+update/create (not upsert, because targetId can be null)
    const existing = await db.globalAiPause.findFirst({ where: { scope, targetId: targetId as any } });
    let pause;
    if (existing) {
      pause = await db.globalAiPause.update({
        where: { id: existing.id },
        data: { active: true, reason, activatedBy: (session.user as any).id, activatedAt: new Date(), deactivatedBy: null, deactivatedAt: null },
      });
    } else {
      pause = await db.globalAiPause.create({
        data: { scope, targetId: targetId as any, active: true, reason, activatedBy: (session.user as any).id, activatedAt: new Date() },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "AI_PAUSE",
        resource: "GlobalAiPause",
        resourceId: pause.id,
        details: JSON.stringify({ scope, targetId, reason }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, pause });
  } catch (err: any) {
    console.error("[ai-safety.pause] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
