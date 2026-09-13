import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scholarships/[slug] — single scholarship with FAQs + relationships (public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const scholarship = await db.scholarship.findUnique({
      where: { slug },
      include: {
        faqs: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }
    if (scholarship.status === "DRAFT") {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    const relationships = await db.contentRelationship.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { sourceType: "SCHOLARSHIP", sourceId: scholarship.id },
          { targetType: "SCHOLARSHIP", targetId: scholarship.id },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
    const related = await hydrateRelationships(relationships.map((r) => {
      const outgoing = r.sourceType === "SCHOLARSHIP" && r.sourceId === scholarship.id;
      return outgoing
        ? { ...r, _direction: "out" }
        : { ...r, targetType: r.sourceType, targetId: r.sourceId, _direction: "in" };
    }));

    return NextResponse.json({
      scholarship: {
        ...scholarship,
        coverage: safeJson(scholarship.coverage),
        minimumRequirements: safeJson(scholarship.minimumRequirements),
        documentsRequired: safeJson(scholarship.documentsRequired),
      },
      related,
    });
  } catch (err: any) {
    console.error("[scholarships.get] error:", err);
    return NextResponse.json({ error: "Failed to fetch scholarship" }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────

function safeJson(v: string | null): any {
  if (!v) return null;
  try { return JSON.parse(v); } catch { return v; }
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
