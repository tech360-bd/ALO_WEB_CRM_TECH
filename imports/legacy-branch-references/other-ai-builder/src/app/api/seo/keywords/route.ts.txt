import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/keywords
// Lists KeywordResearch records. Auth: any logged-in user.
// Query params: KeywordResearchFilters (keyword, intent, cluster, status, country, minSearchVolume, maxDifficulty, limit, offset)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const filters: any = {
      keyword: sp.get("keyword") || undefined,
      intent: sp.get("intent") || undefined,
      cluster: sp.get("cluster") || undefined,
      status: sp.get("status") || undefined,
      country: sp.get("country") || undefined,
      minSearchVolume: sp.get("minSearchVolume") ? Number(sp.get("minSearchVolume")) : undefined,
      maxDifficulty: sp.get("maxDifficulty") ? Number(sp.get("maxDifficulty")) : undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!, 10) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!, 10) : undefined,
    };

    const { getKeywordResearch } = await import("@/lib/keyword-research-engine");
    const keywords = await getKeywordResearch(filters);
    return NextResponse.json({ keywords });
  } catch (err: any) {
    console.error("[seo/keywords GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load keywords" }, { status: 500 });
  }
}

// POST /api/seo/keywords
// Create a new KeywordResearch record. Auth: any logged-in user.
// Body: CreateKeywordResearchData
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const { createKeywordResearch } = await import("@/lib/keyword-research-engine");
    const result = await createKeywordResearch(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[seo/keywords POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create keyword" }, { status: 500 });
  }
}
