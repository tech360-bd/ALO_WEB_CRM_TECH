import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — knowledge news
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const country = req.nextUrl.searchParams.get("country");
  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (country) where.country = country;
  const news = await db.knowledgeNews.findMany({ where, orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }], take: 30 });
  return NextResponse.json({ news });
}

// POST — create news
export async function POST(req: NextRequest) {
  const body = await req.json();
  const news = await db.knowledgeNews.create({ data: { ...body, status: "PUBLISHED", publishedAt: new Date() } });
  return NextResponse.json({ news, message: "News published to Knowledge Center." });
}
