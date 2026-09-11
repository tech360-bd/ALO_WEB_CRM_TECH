import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-safety/resume — SUPER_ADMIN only.
// Body: { scope?: string, targetId?: string }  (omitting both resumes ALL pauses)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only SUPER_ADMIN can resume AI" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const scope = body.scope;
    const targetId = body.targetId;

    // Try to delegate to ai-safety lib
    try {
      const aiSafety = await import("@/lib/ai-safety");
      if (typeof (aiSafety as any).resumeAi === "function") {
        const result = await (aiSafety as any).resumeAi({
          scope,
          targetId,
          resumedBy: (session.user as any).id,
        });
        return NextResponse.json({ success: true, resumed: result, delegated: "ai-safety" });
      }
    } catch {
      // fall through
    }

    const where: Record<string, unknown> = { active: true };
    if (scope) where.scope = scope;
    if (targetId) where.targetId = targetId;

    const result = await db.globalAiPause.updateMany({
      where,
      data: {
        active: false,
        deactivatedBy: (session.user as any).id,
        deactivatedAt: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "AI_RESUME",
        resource: "GlobalAiPause",
        details: JSON.stringify({ scope, targetId, resumed: result.count }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      resumed: result.count,
      scope: scope || "ALL",
      targetId: targetId || null,
    });
  } catch (err: any) {
    console.error("[ai-safety.resume] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
