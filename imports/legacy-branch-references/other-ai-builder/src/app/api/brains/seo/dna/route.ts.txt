import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/dna
// Compute (or refresh) the content DNA hash + topic terms for a content asset.
// Body: { contentAssetId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const contentAssetId = body?.contentAssetId as string;
    if (!contentAssetId) {
      return NextResponse.json({ error: "contentAssetId is required" }, { status: 400 });
    }

    const { computeContentDNA } = await import("@/lib/brains/seo-brain");
    const result = await computeContentDNA(contentAssetId);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[brains/seo/dna] error", err);
    return NextResponse.json({ error: err?.message || "Failed to compute DNA" }, { status: 500 });
  }
}
