import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/quality-gate
// Run quality gates for a content asset. Auth: any logged-in user.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "asset id is required" }, { status: 400 });
    }

    const { runQualityGates } = await import("@/lib/content-engine");
    const report = await runQualityGates(id);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[content-engine/assets/[id]/quality-gate] error", err);
    return NextResponse.json({ error: err?.message || "Quality gate run failed" }, { status: 500 });
  }
}
