import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/agents/[id]/skills
// Attach a skill to the given AiAgent.
// Body: { skillCode, skillName, brain, capability, description?, proficiencyLevel? }
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
      return NextResponse.json({ error: "agent id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { skillCode, skillName, brain, capability, description, proficiencyLevel } = body || {};
    if (!skillCode || !skillName || !brain || !capability) {
      return NextResponse.json(
        { error: "skillCode, skillName, brain, capability are required" },
        { status: 400 }
      );
    }

    const { assignSkillToAgent } = await import("@/lib/agent-extension-registry");
    const result = await assignSkillToAgent(id, {
      skillCode,
      skillName,
      brain,
      capability,
      description,
      proficiencyLevel,
    });
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err: any) {
    console.error("[brains/agents/[id]/skills POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to assign skill" }, { status: 500 });
  }
}
