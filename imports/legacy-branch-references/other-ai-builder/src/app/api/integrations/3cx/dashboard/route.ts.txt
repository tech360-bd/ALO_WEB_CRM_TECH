import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/dashboard
// Aggregate 3CX dashboard stats. Auth: admin only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { get3cxDashboardStats } = await import("@/lib/threecx-integration");
    const stats = await get3cxDashboardStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[3cx/dashboard] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load dashboard" }, { status: 500 });
  }
}
