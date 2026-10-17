import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agentos/skills?stats=true
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const wantStats = url.searchParams.get("stats") === "true";
    const lib = await import("@/lib/agentos");
    if (wantStats) {
      const stats = await lib.getSkillStats();
      return NextResponse.json(stats);
    }
    const skills = await lib.getSkills();
    return NextResponse.json({ skills });
  } catch (err: any) {
    console.error("[agentos/skills] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load skills" }, { status: 500 });
  }
}
