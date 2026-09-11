import { NextRequest, NextResponse } from "next/server";
import { detectStaleContent } from "@/lib/brains/seo-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/seo/stale?sourceType=University&sourceId=oxford
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const sourceType = sp.get("sourceType") || undefined;
    const sourceId = sp.get("sourceId") || undefined;

    const result = await detectStaleContent(sourceType, sourceId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
