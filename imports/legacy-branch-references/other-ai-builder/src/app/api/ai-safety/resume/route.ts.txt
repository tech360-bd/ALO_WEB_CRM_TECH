import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai-safety/resume
// Deactivate the active GLOBAL AI pause. SUPER_ADMIN only.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 });
  }

  try {
    const deactivatedBy = (session.user as any).id || "SUPER_ADMIN";
    const { deactivateGlobalPause } = await import("@/lib/ai-safety");
    const ok = await deactivateGlobalPause(deactivatedBy);
    return NextResponse.json({ resumed: ok });
  } catch (err: any) {
    console.error("[ai-safety/resume] error", err);
    return NextResponse.json({ error: err?.message || "Failed to resume" }, { status: 500 });
  }
}
