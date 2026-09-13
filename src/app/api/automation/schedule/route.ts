import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAllSchedulers } from "@/lib/automation-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/schedule — execute the real scheduler workflows.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const activePauses = await db.globalAiPause.findMany({ where: { active: true }, take: 1 });
    if (activePauses.length > 0) {
      return NextResponse.json({
        error: "Global AI is paused. Resume via /api/ai-safety/resume before scheduling.",
        globalAiPaused: true,
      }, { status: 423 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await runAllSchedulers({
      actorId: (session.user as { id?: string }).id,
      dryRun: body.dryRun === true,
    });
    return NextResponse.json({ success: true, result, globalAiPaused: false });
  } catch (error) {
    console.error("[automation.schedule] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduler failed" }, { status: 500 });
  }
}
