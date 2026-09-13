import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/content/opportunities/[id]/assign
// Assign the appropriate Content Brain agents to an opportunity.
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
      return NextResponse.json({ error: "opportunity id is required" }, { status: 400 });
    }

    const { assignOpportunityToAgents } = await import("@/lib/brains/content-brain");
    const result = await assignOpportunityToAgents(id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[brains/content/opportunities/[id]/assign] error", err);
    return NextResponse.json({ error: err?.message || "Failed to assign agents" }, { status: 500 });
  }
}
