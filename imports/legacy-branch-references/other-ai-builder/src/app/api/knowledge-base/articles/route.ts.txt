import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/knowledge-base/articles
// Lists knowledge base articles. Auth: any logged-in user.
// Query params: KnowledgeBaseFilters (category, status, tags (csv), relatedEntityType, relatedEntitySlug, searchQuery, limit, offset)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const tags = sp.get("tags") ? sp.get("tags")!.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
    const filters: any = {
      category: sp.get("category") || undefined,
      status: sp.get("status") || undefined,
      tags,
      relatedEntityType: sp.get("relatedEntityType") || undefined,
      relatedEntitySlug: sp.get("relatedEntitySlug") || undefined,
      searchQuery: sp.get("searchQuery") || undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!, 10) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!, 10) : undefined,
    };

    const { getKnowledgeBaseArticles } = await import("@/lib/knowledge-base-engine");
    const articles = await getKnowledgeBaseArticles(filters);
    return NextResponse.json({ articles });
  } catch (err: any) {
    console.error("[knowledge-base/articles GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load articles" }, { status: 500 });
  }
}

// POST /api/knowledge-base/articles
// Create a new knowledge base article. Auth: any logged-in user.
// Body: CreateKnowledgeBaseArticleData
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.title || !body?.category || !body?.bodyMarkdown) {
      return NextResponse.json(
        { error: "title, category, bodyMarkdown are required" },
        { status: 400 }
      );
    }

    const { createKnowledgeBaseArticle } = await import("@/lib/knowledge-base-engine");
    const result = await createKnowledgeBaseArticle(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[knowledge-base/articles POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create article" }, { status: 500 });
  }
}
