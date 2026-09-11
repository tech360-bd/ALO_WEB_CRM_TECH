import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeSearchConsoleData } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/opportunities
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "OPEN";
  const opportunityType = req.nextUrl.searchParams.get("opportunityType");
  const priority = req.nextUrl.searchParams.get("priority");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (opportunityType) where.opportunityType = opportunityType;
  if (priority) where.priority = priority;

  const [opportunities, total] = await Promise.all([
    db.seoOpportunity.findMany({
      where,
      orderBy: [{ impressions: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
    db.seoOpportunity.count({ where }),
  ]);

  return NextResponse.json({ opportunities, total });
}

// POST /api/seo/opportunities
// Body: { metrics: [{ url, query, impressions, clicks, position }] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { metrics } = body;

  if (!Array.isArray(metrics)) {
    return NextResponse.json(
      { error: "metrics (array) is required" },
      { status: 400 }
    );
  }

  const result = await analyzeSearchConsoleData(metrics);
  return NextResponse.json(result);
}
