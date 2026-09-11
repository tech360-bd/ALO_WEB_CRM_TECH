import { NextRequest, NextResponse } from "next/server";
import { getUniversityIntelligenceSummary } from "@/lib/brains/university-research-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/intelligence?universitySlug=oxford
export async function GET(req: NextRequest) {
  try {
    const universitySlug = req.nextUrl.searchParams.get("universitySlug");
    if (!universitySlug) {
      return NextResponse.json(
        { error: "universitySlug is required" },
        { status: 400 }
      );
    }
    const summary = await getUniversityIntelligenceSummary(universitySlug);
    if (!summary) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
