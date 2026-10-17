import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/opportunities
// Lists SeoOpportunity records. Auth: any logged-in user.
// Query params: opportunityType?, status?, limit?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const where: any = {};
    if (sp.get("opportunityType")) where.opportunityType = sp.get("opportunityType");
    const limit = Math.min(parseInt(sp.get("limit") || "100", 10) || 100, 500);

    const xdb = db as unknown as {
      seoOpportunity: {
        findMany: (args: Record<string, unknown>) => Promise<any[]>;
      };
    };
    const opportunities = await xdb.seoOpportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ opportunities });
  } catch (err: any) {
    console.error("[seo/opportunities GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load opportunities" }, { status: 500 });
  }
}

// POST /api/seo/opportunities
// Analyze Search Console data and create/update SeoOpportunity records.
// Auth: any logged-in user.
// Body: { metrics: SearchConsoleRow[] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!Array.isArray(body?.metrics)) {
      return NextResponse.json(
        { error: "metrics must be an array of SearchConsoleRow objects" },
        { status: 400 }
      );
    }

    const { analyzeSearchConsoleData } = await import("@/lib/seo-engine");
    const result = await analyzeSearchConsoleData(body.metrics);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[seo/opportunities POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to analyze" }, { status: 500 });
  }
}
