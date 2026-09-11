import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSkills, getSkillStats } from "@/lib/agentos";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  if (sp.get("stats") === "true") return NextResponse.json(await getSkillStats());
  const skills = await getSkills({
    category: sp.get("category") || undefined,
    status: sp.get("status") || undefined,
    limit: sp.get("limit") ? parseInt(sp.get("limit")!) : 100,
  });
  return NextResponse.json({ skills });
}
