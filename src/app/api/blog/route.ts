import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/blog — list published blog posts
// GET /api/blog?slug=... — single post by slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const category = req.nextUrl.searchParams.get("category");
  const featured = req.nextUrl.searchParams.get("featured");

  if (slug) {
    const post = await db.blogPost.findUnique({
      where: { slug, status: "PUBLISHED" },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (featured === "true") where.featured = true;

  const posts = await db.blogPost.findMany({
    where,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      tags: true,
      authorName: true,
      authorRole: true,
      readMinutes: true,
      featured: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({ posts });
}
