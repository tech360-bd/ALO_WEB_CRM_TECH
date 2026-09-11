import { NextRequest, NextResponse } from "next/server";
import { runImpactAnalysis } from "@/lib/brains/seo-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/impact-analysis — what would be impacted if X changes.
// NEVER auto-updates — only returns analysis.
// Body: { sourceType, sourceId, sourceField? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceType, sourceId, sourceField } = body;

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "sourceType and sourceId are required" },
        { status: 400 }
      );
    }

    const analysis = await runImpactAnalysis(sourceType, sourceId, sourceField);
    return NextResponse.json(analysis);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
