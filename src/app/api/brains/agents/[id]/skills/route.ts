import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignSkillToAgent } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/agents/[id]/skills — assign a skill to an agent.
// Requires SUPER_ADMIN/ADMIN. NEVER creates new agents (the lib throws if missing).
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
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { skillCode, skillName, brain, capability, proficiencyLevel } = body;

    if (!skillCode || !skillName || !brain || !capability) {
      return NextResponse.json(
        { error: "skillCode, skillName, brain, and capability are required" },
        { status: 400 }
      );
    }

    const skill = await assignSkillToAgent(id, {
      skillCode,
      skillName,
      brain,
      capability,
      proficiencyLevel,
    });
    return NextResponse.json({ success: true, skill });
  } catch (err: any) {
    if (err.message?.includes("Agent not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
