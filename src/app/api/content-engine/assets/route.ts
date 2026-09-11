import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createContentAsset } from "@/lib/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/content-engine/assets — list assets with filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "ALL";
  const contentType = req.nextUrl.searchParams.get("contentType");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (contentType) where.contentType = contentType;

  const [assets, total] = await Promise.all([
    db.contentAsset.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    db.contentAsset.count({ where }),
  ]);

  return NextResponse.json({ assets, total, limit, offset });
}

// POST /api/content-engine/assets — create a new content asset
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.contentType) {
    return NextResponse.json(
      { error: "title and contentType are required" },
      { status: 400 }
    );
  }

  const asset = await createContentAsset({
    title: body.title,
    contentType: body.contentType,
    body: body.body,
    excerpt: body.excerpt,
    topic: body.topic,
    source: body.source,
    sourceQuery: body.sourceQuery,
    authorAgentId: body.authorAgentId,
    tags: body.tags,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    targetKeywords: body.targetKeywords,
    canonicalUrl: body.canonicalUrl,
  });

  return NextResponse.json({ asset });
}
