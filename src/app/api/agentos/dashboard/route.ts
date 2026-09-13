import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/dashboard
// Top-level AgentOS dashboard. Restricted to SUPER_ADMIN / ADMIN.
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
    const { getAgentOSDashboard } = await import("@/lib/agentos");
    const dashboard = await getAgentOSDashboard();
    return NextResponse.json(dashboard);
  } catch (err: any) {
    console.error("[agentos/dashboard] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load dashboard" }, { status: 500 });
  }
}
