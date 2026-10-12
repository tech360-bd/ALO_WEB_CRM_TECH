import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSeoStaff } from "@/lib/seo/request-access";
import { z } from "zod";
import { analyzeSearchConsoleData } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/opportunities
export async function GET(req: NextRequest) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;

  const status = req.nextUrl.searchParams.get("status") || "OPEN";
  const opportunityType = req.nextUrl.searchParams.get("opportunityType");
  const priority = req.nextUrl.searchParams.get("priority");
  const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) return NextResponse.json({ error: "Invalid page limit." }, { status: 400 });

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (opportunityType) where.opportunityType = opportunityType;
  if (priority) where.priority = priority;

  try {
  const [opportunities, total] = await Promise.all([
    db.seoOpportunity.findMany({
      where,
      orderBy: [{ impressions: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
    db.seoOpportunity.count({ where }),
  ]);

  return NextResponse.json({ opportunities, total });
  } catch { return NextResponse.json({error:'SEO records unavailable.'},{status:503}); }
}

// POST /api/seo/opportunities
// Body: { metrics: [{ url, query, impressions, clicks, position }] }
export async function POST(req: NextRequest) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;

  const row = z.object({
    url:z.string().max(191).url().nullable().optional(), query:z.string().trim().max(191).nullable().optional(),
    impressions:z.number().int().nonnegative().max(2147483647), clicks:z.number().int().nonnegative().max(2147483647),
    position:z.number().nonnegative().max(10000),
  }).strict().refine(v => v.clicks <= v.impressions && Boolean(v.url || v.query));
  const parsed = z.object({metrics:z.array(row).min(1).max(500)}).strict().safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:'Supply 1–500 valid metric rows with a URL or query, non-negative metrics, and clicks no greater than impressions.'},{status:400});
  try {
    const result = await analyzeSearchConsoleData(parsed.data.metrics);
    return NextResponse.json({...result, provenance:'Analysis of supplied metrics, not a live Search Console fetch.', liveProviderVerified:false});
  } catch { return NextResponse.json({error:'SEO analysis unavailable.'},{status:503}); }
}
