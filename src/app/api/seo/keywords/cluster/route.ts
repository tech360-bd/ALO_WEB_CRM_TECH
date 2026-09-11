import { NextRequest, NextResponse } from "next/server";
import { clusterKeywords } from "@/lib/keyword-research-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/seo/keywords/cluster — group keywords into a cluster.
// Body: { keywordIds: string[], clusterName: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keywordIds, clusterName } = body;

    if (!Array.isArray(keywordIds) || keywordIds.length === 0 || !clusterName) {
      return NextResponse.json(
        { error: "keywordIds (array) and clusterName are required" },
        { status: 400 }
      );
    }

    const result = await clusterKeywords(keywordIds, clusterName);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
