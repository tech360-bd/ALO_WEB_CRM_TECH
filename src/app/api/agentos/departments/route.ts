import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/departments
// Returns department-level stats (workforce, legacy, config, active tasks).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getDepartmentStats } = await import("@/lib/agentos");
    const stats = await getDepartmentStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[agentos/departments] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load departments" }, { status: 500 });
  }
}
