import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicScholarshipWhere } from "@/lib/public-catalog";
import { hasCurrentScholarshipSourceVerification } from "@/lib/scholarships/status-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/services/[slug] — single service with FAQs + relationships (public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const service = await db.service.findUnique({
      where: { slug },
      include: {
        faqs: { where: { status: "active" }, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (service.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Hydrate related entities (resolve string IDs to titles/slugs)
    const relationships = await db.contentRelationship.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { sourceType: "SERVICE", sourceId: service.id },
          { targetType: "SERVICE", targetId: service.id },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
    const related = await hydrateRelationships(relationships.map((r) => {
      const outgoing = r.sourceType === "SERVICE" && r.sourceId === service.id;
      return outgoing
        ? { ...r, _direction: "out" }
        : { ...r, targetType: r.sourceType, targetId: r.sourceId, _direction: "in" };
    }));

    return NextResponse.json({
      service: {
        ...service,
        content: safeJson(service.content),
        requirements: safeJson(service.requirements),
        documents: safeJson(service.documents),
        eligibility: service.eligibility,
      },
      related,
    });
  } catch (err: any) {
    console.error("[services.get] error:", err);
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
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
          target = await db.scholarship.findUnique({
            where: { id: r.targetId, ...publicScholarshipWhere() },
            select: { slug: true, name: true, fundingType: true, amount: true, currency: true, verificationStatus: true, lastVerifiedAt: true, officialSourceUrl: true },
          });
          break;
        case "RESOURCE":
          target = await db.resource.findUnique({ where: { id: r.targetId, status: "PUBLISHED" }, select: { slug: true, title: true, excerpt: true, featuredImage: true } });
          break;
        default:
          target = null;
      }
    } catch {}
    if (!target) continue;
    if (r.targetType === "SCHOLARSHIP" && !hasCurrentScholarshipSourceVerification({
      verificationStatus: target.verificationStatus,
      lastVerifiedAt: target.lastVerifiedAt,
      officialSourceUrl: target.officialSourceUrl,
    })) continue;
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
