import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/resources/[slug] — single resource with FAQs + relationships + TOC (public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const resource = await db.resource.findUnique({
      where: { slug },
      include: {
        category: true,
        faqs: { orderBy: { sortOrder: "asc" } },
        relationships: {
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
        },
        reverseRelationships: {
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    if (resource.status !== "PUBLISHED" && req.nextUrl.searchParams.get("preview") !== "1") {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const related = await hydrateRelationships([
      ...resource.relationships.map((r) => ({ ...r, _direction: "out" })),
      ...resource.reverseRelationships.map((r) => ({ ...r, _direction: "in" })),
    ]);

    // Auto-generate table of contents from H2/H3 headings in content
    const toc = generateToc(resource.content);

    return NextResponse.json({
      resource: {
        ...resource,
        tags: safeJson(resource.tags) || [],
      },
      toc,
      related,
    });
  } catch (err: any) {
    console.error("[resources.get] error:", err);
    return NextResponse.json({ error: "Failed to fetch resource", detail: err.message }, { status: 500 });
  }
}

// PATCH /api/resources/[slug] — update (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { faqs, performedBy, ...patch } = body as any;

    const existing = await db.resource.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (Array.isArray(patch.tags)) patch.tags = JSON.stringify(patch.tags);
    if (patch.publishedAt) patch.publishedAt = new Date(patch.publishedAt);
    if (patch.lastVerifiedAt) patch.lastVerifiedAt = new Date(patch.lastVerifiedAt);

    if (patch.slug && patch.slug !== slug) {
      const clash = await db.resource.findUnique({ where: { slug: patch.slug } });
      if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (patch.categoryId && patch.categoryId !== existing.categoryId) {
      const cat = await db.resourceCategory.findUnique({ where: { id: patch.categoryId } });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await db.resource.update({
      where: { slug },
      data: { ...patch },
      include: { faqs: { orderBy: { sortOrder: "asc" } }, category: true },
    });

    if (Array.isArray(faqs)) {
      await db.resourceFaq.deleteMany({ where: { resourceId: updated.id } });
      if (faqs.length) {
        await db.resourceFaq.createMany({
          data: faqs.map((f: any, i: number) => ({
            resourceId: updated.id,
            question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? i,
          })),
        });
      }
      const fresh = await db.resource.findUnique({
        where: { id: updated.id },
        include: { faqs: { orderBy: { sortOrder: "asc" } } },
      });
      if (fresh) (updated as any).faqs = fresh.faqs;
    }

    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_UPDATE",
        resource: "Resource",
        resourceId: updated.id,
        details: JSON.stringify({ slug, changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ resource: updated });
  } catch (err: any) {
    console.error("[resources.update] error:", err);
    return NextResponse.json({ error: "Failed to update resource", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/resources/[slug] — soft delete via ARCHIVED status (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const hard = req.nextUrl.searchParams.get("hard") === "1";
    const performedBy = req.nextUrl.searchParams.get("performedBy") || undefined;

    const existing = await db.resource.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (hard) {
      await db.resource.delete({ where: { slug } });
    } else {
      await db.resource.update({ where: { slug }, data: { status: "ARCHIVED" } });
    }

    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: hard ? "RESOURCE_DELETE" : "RESOURCE_ARCHIVE",
        resource: "Resource",
        resourceId: existing.id,
        details: JSON.stringify({ slug, hard }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, slug, hard });
  } catch (err: any) {
    console.error("[resources.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete resource", detail: err.message }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────

function safeJson(v: string | null): any {
  if (!v) return null;
  try { return JSON.parse(v); } catch { return v; }
}

function generateToc(html: string): { id: string; level: number; text: string }[] {
  if (!html) return [];
  const out: { id: string; level: number; text: string }[] = [];
  // Match Markdown ## or ### OR HTML <h2>/<h3>
  const mdHeading = /^(#{2,3})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = mdHeading.exec(html)) !== null) {
    const level = m[1].length; // 2 or 3
    const text = m[2].trim().replace(/[*_`~]/g, "");
    out.push({ id: slugifyHeading(text), level, text });
  }
  if (out.length) return out;

  // Fallback: HTML <h2>/<h3> tags
  const htmlHeading = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  while ((m = htmlHeading.exec(html)) !== null) {
    const level = parseInt(m[1], 10);
    const text = m[2].replace(/<[^>]*>/g, "").trim();
    if (text) out.push({ id: slugifyHeading(text), level, text });
  }
  return out;
}

function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
}

async function resolveUserId(performedBy?: string): Promise<string | null> {
  if (!performedBy) return null;
  if (performedBy.includes("@")) {
    const u = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    return u?.id ?? null;
  }
  return performedBy;
}

async function hydrateRelationships(rels: any[]): Promise<any[]> {
  const out: any[] = [];
  for (const r of rels) {
    let target: any = null;
    try {
      switch (r.targetType) {
        case "SERVICE":
          target = await db.service.findUnique({ where: { id: r.targetId }, select: { slug: true, title: true, icon: true, shortDescription: true } });
          break;
        case "SCHOLARSHIP":
          target = await db.scholarship.findUnique({ where: { id: r.targetId }, select: { slug: true, name: true, fundingType: true, amount: true, currency: true } });
          break;
        case "RESOURCE":
          target = await db.resource.findUnique({ where: { id: r.targetId }, select: { slug: true, title: true, excerpt: true, featuredImage: true } });
          break;
      }
    } catch {}
    out.push({
      id: r.id,
      direction: r._direction,
      relationshipType: r.relationshipType,
      targetType: r.targetType,
      targetId: r.targetId,
      target,
    });
  }
  return out;
}
