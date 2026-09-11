import { NextRequest, NextResponse } from "next/server";
import { computeContentDNA, findRelatedContent } from "@/lib/brains/seo-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/seo/related?contentAssetId=... — compute DNA + find related.
export async function GET(req: NextRequest) {
  try {
    const contentAssetId = req.nextUrl.searchParams.get("contentAssetId");
    if (!contentAssetId) {
      return NextResponse.json(
        { error: "contentAssetId is required" },
        { status: 400 }
      );
    }

    const dna = await computeContentDNA(contentAssetId);
    if (!dna) {
      return NextResponse.json(
        { error: "Content asset not found" },
        { status: 404 }
      );
    }

    const related = await findRelatedContent(dna, 10);
    return NextResponse.json({ dna, related, count: related.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
