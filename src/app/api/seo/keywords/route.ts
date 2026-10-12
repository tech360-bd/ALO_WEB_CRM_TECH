import { NextRequest, NextResponse } from "next/server";
import { recordKeyword, searchKeywords } from "@/lib/keyword-research-engine";

import { requireSeoStaff } from "@/lib/seo/request-access";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/keywords — search/filter keywords.
export async function GET(req: NextRequest) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const sp = req.nextUrl.searchParams;
    const pagination = z.object({ limit: z.coerce.number().int().min(1).max(200), offset: z.coerce.number().int().min(0).max(100000) }).safeParse({ limit: sp.get('limit') || 50, offset: sp.get('offset') || 0 });
    if (!pagination.success || [...sp.values()].some(value => value.length > 191)) return NextResponse.json({ error: 'Invalid keyword filters or pagination.' }, { status: 400 });
    const result = await searchKeywords({
      q: sp.get("q") || undefined,
      country: sp.get("country") || undefined,
      intent: sp.get("intent") || undefined,
      status: sp.get("status") || undefined,
      priority: sp.get("priority") || undefined,
      clusterId: sp.get("clusterId") || undefined,
      limit: pagination.data.limit,
      offset: pagination.data.offset,
    });
    return NextResponse.json({ ...result, provenance: 'Stored keyword records; metrics may be manual or legacy defaults, not a live rank/provider report.', liveProviderVerified: false });
  } catch (err: any) {
    return NextResponse.json({ error: "Keyword data unavailable." }, { status: 503 });
  }
}

// POST /api/seo/keywords — record (upsert) a keyword.
export async function POST(req: NextRequest) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const short = z.string().trim().max(191).optional();
    const parsed = z.object({ keyword: z.string().trim().min(1).max(191), country: short, course: short, universitySlug: short,
      searchVolume: z.number().int().min(0).max(2147483647).optional(), difficulty: z.number().min(0).max(100).optional(), cpc: z.number().min(0).max(1000000).optional(),
      competition: z.enum(['LOW','MEDIUM','HIGH','UNKNOWN']).optional(), intent: z.enum(['INFORMATIONAL','NAVIGATIONAL','TRANSACTIONAL','COMMERCIAL']).optional(),
      relatedKeywords: z.array(z.string().max(100)).max(20).refine(v => JSON.stringify(v).length <= 191).optional(), serpFeatures: z.array(z.string().max(100)).max(20).refine(v => JSON.stringify(v).length <= 191).optional(),
      status: short, priority: z.enum(['HIGH','MEDIUM','LOW']).optional(), contentAssetId: short,
    }).strict().safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid bounded keyword data. Metrics must be non-negative numbers.' }, { status: 400 });
    const { keyword, country, course, universitySlug, searchVolume, difficulty, cpc, competition, intent, relatedKeywords, serpFeatures, status, priority, contentAssetId } = parsed.data;
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
    return NextResponse.json({ error: "Keyword data unavailable." }, { status: 503 });
  }
}
