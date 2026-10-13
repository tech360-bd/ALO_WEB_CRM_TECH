import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "articles.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["title", "slug", "summary"]),
    ...(status && status !== "all" ? { status } : {}),
    ...(category && category !== "all" ? { category } : {}),
  };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip, take }),
    db.article.count({ where }),
  ]);
  return ok(items, "Articles loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "articles.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  if (!b.title || !b.slug || !b.category || !b.summary || !b.body) {
    return fail("title, slug, category, summary, body are required.", ["missing_fields"]);
  }
  try {
    const article = await db.article.create({
      data: {
        slug: String(b.slug),
        title: String(b.title),
        summary: String(b.summary),
        body: String(b.body),
        category: String(b.category),
        tags: b.tags ? String(b.tags) : null,
        author: b.author ? String(b.author) : "Al Aminn",
        readingMinutes: b.readingMinutes ? Number(b.readingMinutes) : 5,
        status: b.status ? String(b.status) : "draft",
        featured: b.featured === true,
        coverMedia: b.coverMedia ? String(b.coverMedia) : null,
        publishedAt: b.publishedAt ? new Date(String(b.publishedAt)) : new Date(),
      },
    });
    await writeAudit(guard.session, "article.create", "Article", article.id, { slug: article.slug });
    return ok(article, "Article created.", {}, 201);
  } catch (e) {
    return fail("Failed to create article.", [(e as Error).message], 500);
  }
}
