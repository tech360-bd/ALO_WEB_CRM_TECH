import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignOpportunityToAgents } from "@/lib/brains/content-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/content/opportunities/[id]/assign — assign opportunity to agents.
// Body: { agentIds?: string[] } — omit to auto-find content-brain agents.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { agentIds } = body;

    const opportunity = await assignOpportunityToAgents(id, agentIds);
    return NextResponse.json({ success: true, opportunity });
  } catch (err: any) {
    if (err.message?.includes("not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
