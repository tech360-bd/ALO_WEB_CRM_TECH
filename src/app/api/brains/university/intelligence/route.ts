import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/intelligence?universitySlug=
// Returns an aggregated intelligence summary for a university.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const universitySlug = req.nextUrl.searchParams.get("universitySlug");
    if (!universitySlug) {
      return NextResponse.json({ error: "universitySlug query param is required" }, { status: 400 });
    }

    const { getUniversityIntelligenceSummary } = await import("@/lib/brains/university-research-brain");
    const summary = await getUniversityIntelligenceSummary(universitySlug);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("[brains/university/intelligence] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load intelligence summary" }, { status: 500 });
  }
}
