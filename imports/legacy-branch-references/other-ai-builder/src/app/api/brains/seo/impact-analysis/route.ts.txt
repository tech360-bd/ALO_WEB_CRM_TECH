import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/impact-analysis
// Run an impact analysis: which content assets depend on a given source.
// Body: { sourceType, sourceId, sourceField? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.sourceType || !body?.sourceId) {
      return NextResponse.json({ error: "sourceType and sourceId are required" }, { status: 400 });
    }

    const { runImpactAnalysis } = await import("@/lib/brains/seo-brain");
    const result = await runImpactAnalysis(body.sourceType, body.sourceId, body.sourceField);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[brains/seo/impact-analysis] error", err);
    return NextResponse.json({ error: err?.message || "Impact analysis failed" }, { status: 500 });
  }
}
