import { NextRequest, NextResponse } from "next/server";
import { recordKeyword, searchKeywords } from "@/lib/keyword-research-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/keywords — search/filter keywords.
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await searchKeywords({
      q: sp.get("q") || undefined,
      country: sp.get("country") || undefined,
      intent: sp.get("intent") || undefined,
      status: sp.get("status") || undefined,
      priority: sp.get("priority") || undefined,
      clusterId: sp.get("clusterId") || undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!) : undefined,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/seo/keywords — record (upsert) a keyword.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      keyword,
      country,
      course,
      universitySlug,
      searchVolume,
      difficulty,
      cpc,
      competition,
      intent,
      relatedKeywords,
      serpFeatures,
      status,
      priority,
      contentAssetId,
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const record = await recordKeyword({
      keyword,
      country,
      course,
      universitySlug,
      searchVolume,
      difficulty,
      cpc,
      competition,
      intent,
      relatedKeywords,
      serpFeatures,
      status,
      priority,
      contentAssetId,
    });
    return NextResponse.json({ success: true, keyword: record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
