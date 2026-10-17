import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/capacity-test
// Run a system-wide capacity test. SUPER_ADMIN only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 });
  }

  try {
    const { runCapacityTest } = await import("@/lib/agentos");
    const result = await runCapacityTest();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[agentos/capacity-test] error", err);
    return NextResponse.json({ error: err?.message || "Capacity test failed" }, { status: 500 });
  }
}
