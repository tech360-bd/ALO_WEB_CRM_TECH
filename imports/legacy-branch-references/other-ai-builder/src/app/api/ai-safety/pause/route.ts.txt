import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-safety/pause
// Activate a GLOBAL AI pause. SUPER_ADMIN only.
// Body: { reason?: string }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason as string) || "Manual SUPER_ADMIN pause";
    const activatedBy = (session.user as any).id || "SUPER_ADMIN";

    const { activateGlobalPause } = await import("@/lib/ai-safety");
    const rec = await activateGlobalPause(reason, activatedBy);
    return NextResponse.json({ paused: true, record: rec });
  } catch (err: any) {
    console.error("[ai-safety/pause] error", err);
    return NextResponse.json({ error: err?.message || "Failed to activate pause" }, { status: 500 });
  }
}
