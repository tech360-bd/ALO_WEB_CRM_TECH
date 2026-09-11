import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/news — list published news
// GET /api/news?slug=... — single article by slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const category = req.nextUrl.searchParams.get("category");
  const country = req.nextUrl.searchParams.get("country");

  if (slug) {
    const article = await db.newsArticle.findUnique({
      where: { slug, status: "PUBLISHED" },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ article });
  }

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (country) where.country = country;

  const articles = await db.newsArticle.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      country: true,
      tags: true,
      authorName: true,
      isPinned: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({ articles });
}
