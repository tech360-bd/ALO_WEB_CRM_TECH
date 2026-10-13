import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "articles.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.article.findUnique({ where: { id } });
  if (!item) return fail("Article not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "articles.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.article.update({
      where: { id },
      data: {
        ...(b.title !== undefined ? { title: String(b.title) } : {}),
        ...(b.summary !== undefined ? { summary: String(b.summary) } : {}),
        ...(b.body !== undefined ? { body: String(b.body) } : {}),
        ...(b.category !== undefined ? { category: String(b.category) } : {}),
        ...(b.tags !== undefined ? { tags: b.tags ? String(b.tags) : null } : {}),
        ...(b.author !== undefined ? { author: String(b.author) } : {}),
        ...(b.readingMinutes !== undefined ? { readingMinutes: Number(b.readingMinutes) } : {}),
        ...(b.status !== undefined ? { status: String(b.status) } : {}),
        ...(b.featured !== undefined ? { featured: b.featured === true } : {}),
        ...(b.coverMedia !== undefined ? { coverMedia: b.coverMedia ? String(b.coverMedia) : null } : {}),
        ...(b.publishedAt !== undefined ? { publishedAt: new Date(String(b.publishedAt)) } : {}),
      },
    });
    await writeAudit(guard.session, "article.update", "Article", id);
    return ok(updated, "Article updated.");
  } catch (e) {
    return fail("Failed to update article.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "articles.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.article.delete({ where: { id } });
    await writeAudit(guard.session, "article.delete", "Article", id);
    return NextResponse.json({ success: true, message: "Article deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete article.", [(e as Error).message], 500);
  }
}
