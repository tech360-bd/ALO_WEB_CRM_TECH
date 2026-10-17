import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/approve
// Approve a content asset (only if all quality gates have passed). Auth: admin only.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "asset id is required" }, { status: 400 });
    }

    const { approveContent } = await import("@/lib/content-engine");
    const result = await approveContent(id, (session.user as any).id || "ADMIN");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[content-engine/assets/[id]/approve] error", err);
    return NextResponse.json({ error: err?.message || "Approve failed" }, { status: 500 });
  }
}
