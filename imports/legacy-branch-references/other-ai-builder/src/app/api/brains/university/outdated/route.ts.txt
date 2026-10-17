import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/outdated
// Scans all knowledge objects and returns counts of outdated / conflicting ones.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { detectOutdatedKnowledge } = await import("@/lib/brains/university-research-brain");
    const result = await detectOutdatedKnowledge();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[brains/university/outdated] error", err);
    return NextResponse.json({ error: err?.message || "Outdated detection failed" }, { status: 500 });
  }
}
