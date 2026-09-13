import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai-safety/status
// Returns the current pause status (global + all active scoped pauses).
// SUPER_ADMIN / ADMIN only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN required" }, { status: 403 });
  }

  try {
    const { getPauseStatus } = await import("@/lib/ai-safety");
    const status = await getPauseStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    console.error("[ai-safety/status] error", err);
    return NextResponse.json({ error: err?.message || "Failed to read pause status" }, { status: 500 });
  }
}
