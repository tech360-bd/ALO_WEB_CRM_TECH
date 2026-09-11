import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeContentDNA } from "@/lib/brains/seo-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/dna — compute (or fetch cached) DNA for a content asset.
// Body: { contentAssetId: string }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { contentAssetId } = body;
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
    return NextResponse.json({ success: true, dna });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
