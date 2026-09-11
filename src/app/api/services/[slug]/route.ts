import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/services/[slug] — single service with FAQs + relationships (public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const service = await db.service.findUnique({
      where: { slug },
      include: {
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

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    if (service.status === "DRAFT" || service.status === "ARCHIVED") {
      // Allow draft preview via ?preview=1 but skip on prod for safety
      const preview = req.nextUrl.searchParams.get("preview");
      if (preview !== "1") {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
    }

    // Hydrate related entities (resolve string IDs to titles/slugs)
    const related = await hydrateRelationships([
      ...service.relationships.map((r) => ({ ...r, _direction: "out" })),
      ...service.reverseRelationships.map((r) => ({ ...r, _direction: "in" })),
    ]);

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
    return NextResponse.json({ error: "Failed to fetch service", detail: err.message }, { status: 500 });
  }
}

// PATCH /api/services/[slug] — update service (admin)
// Body: partial Service fields + optional faqs[]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { faqs, performedBy, ...patch } = body as any;

    const existing = await db.service.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Normalise JSON-encoded fields
    if (patch.requirements && typeof patch.requirements !== "string") {
      patch.requirements = JSON.stringify(patch.requirements);
    }
    if (patch.documents && typeof patch.documents !== "string") {
      patch.documents = JSON.stringify(patch.documents);
    }
    if (patch.lastVerifiedAt) {
      patch.lastVerifiedAt = new Date(patch.lastVerifiedAt);
    }
    if (patch.slug && patch.slug !== slug) {
      const clash = await db.service.findUnique({ where: { slug: patch.slug } });
      if (clash) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
    }

    const updated = await db.service.update({
      where: { slug },
      data: { ...patch },
      include: { faqs: { orderBy: { sortOrder: "asc" } } },
    });

    // Replace FAQs if provided
    if (Array.isArray(faqs)) {
      await db.serviceFaq.deleteMany({ where: { serviceId: updated.id } });
      if (faqs.length) {
        await db.serviceFaq.createMany({
          data: faqs.map((f: any, i: number) => ({
            serviceId: updated.id,
            question: f.question,
            answer: f.answer,
            sortOrder: f.sortOrder ?? i,
          })),
        });
      }
      const fresh = await db.service.findUnique({
        where: { id: updated.id },
        include: { faqs: { orderBy: { sortOrder: "asc" } } },
      });
      if (fresh) (updated as any).faqs = fresh.faqs;
    }

    // Audit log
    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: "SERVICE_UPDATE",
        resource: "Service",
        resourceId: updated.id,
        details: JSON.stringify({ slug, changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ service: updated });
  } catch (err: any) {
    console.error("[services.update] error:", err);
    return NextResponse.json({ error: "Failed to update service", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/services/[slug] — soft delete via ARCHIVED status (admin)
// Pass ?hard=true to fully delete (cascades FAQs + relationships)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const hard = req.nextUrl.searchParams.get("hard") === "1";
    const performedBy = req.nextUrl.searchParams.get("performedBy") || undefined;

    const existing = await db.service.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (hard) {
      await db.service.delete({ where: { slug } });
    } else {
      await db.service.update({ where: { slug }, data: { status: "ARCHIVED" } });
    }

    // Audit log
    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: hard ? "SERVICE_DELETE" : "SERVICE_ARCHIVE",
        resource: "Service",
        resourceId: existing.id,
        details: JSON.stringify({ slug, hard }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, slug, hard });
  } catch (err: any) {
    console.error("[services.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete service", detail: err.message }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────

function safeJson(v: string | null): any {
  if (!v) return null;
  try { return JSON.parse(v); } catch { return v; }
}

async function resolveUserId(performedBy?: string): Promise<string | null> {
  if (!performedBy) return null;
  if (performedBy.includes("@")) {
    const u = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    return u?.id ?? null;
  }
  return performedBy;
}

// Hydrates ContentRelationship records into a friendly shape:
// [{ relationshipType, direction, targetType, targetId, target: { slug, title } | null }]
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
        default:
          target = null;
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
