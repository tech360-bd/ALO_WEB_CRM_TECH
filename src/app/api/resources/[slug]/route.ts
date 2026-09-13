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
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    if (resource.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const relationships = await db.contentRelationship.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { sourceType: "RESOURCE", sourceId: resource.id },
          { targetType: "RESOURCE", targetId: resource.id },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
    const related = await hydrateRelationships(relationships.map((r) => {
      const outgoing = r.sourceType === "RESOURCE" && r.sourceId === resource.id;
      return outgoing
        ? { ...r, _direction: "out" }
        : { ...r, targetType: r.sourceType, targetId: r.sourceId, _direction: "in" };
    }));

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
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 });
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

async function hydrateRelationships(rels: any[]): Promise<any[]> {
  const out: any[] = [];
  for (const r of rels) {
    let target: any = null;
    try {
      switch (r.targetType) {
        case "SERVICE":
          target = await db.service.findUnique({ where: { id: r.targetId, status: "PUBLISHED" }, select: { slug: true, title: true, icon: true, shortDescription: true } });
          break;
        case "SCHOLARSHIP":
          target = await db.scholarship.findUnique({ where: { id: r.targetId, status: { not: "DRAFT" } }, select: { slug: true, name: true, fundingType: true, amount: true, currency: true } });
          break;
        case "RESOURCE":
          target = await db.resource.findUnique({ where: { id: r.targetId, status: "PUBLISHED" }, select: { slug: true, title: true, excerpt: true, featuredImage: true } });
          break;
      }
    } catch {}
    if (!target) continue;
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
