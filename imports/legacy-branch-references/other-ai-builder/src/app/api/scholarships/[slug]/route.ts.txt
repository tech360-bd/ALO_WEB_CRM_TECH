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

    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }
    if (scholarship.status === "CLOSED" && req.nextUrl.searchParams.get("preview") !== "1") {
      // Still return closed scholarships — students should see archive
    }

    const related = await hydrateRelationships([
      ...scholarship.relationships.map((r) => ({ ...r, _direction: "out" })),
      ...scholarship.reverseRelationships.map((r) => ({ ...r, _direction: "in" })),
    ]);

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
    return NextResponse.json({ error: "Failed to fetch scholarship", detail: err.message }, { status: 500 });
  }
}

// PATCH /api/scholarships/[slug] — update (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { faqs, performedBy, ...patch } = body as any;

    const existing = await db.scholarship.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    // Normalise JSON-encoded fields
    if (patch.coverage && typeof patch.coverage !== "string") patch.coverage = JSON.stringify(patch.coverage);
    if (patch.minimumRequirements && typeof patch.minimumRequirements !== "string") patch.minimumRequirements = JSON.stringify(patch.minimumRequirements);
    if (patch.documentsRequired && typeof patch.documentsRequired !== "string") patch.documentsRequired = JSON.stringify(patch.documentsRequired);
    if (patch.lastVerifiedAt) patch.lastVerifiedAt = new Date(patch.lastVerifiedAt);

    if (patch.slug && patch.slug !== slug) {
      const clash = await db.scholarship.findUnique({ where: { slug: patch.slug } });
      if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (patch.scholarshipCode && patch.scholarshipCode !== existing.scholarshipCode) {
      const clash = await db.scholarship.findUnique({ where: { scholarshipCode: patch.scholarshipCode } });
      if (clash) return NextResponse.json({ error: "Scholarship code already in use" }, { status: 409 });
    }

    const updated = await db.scholarship.update({
      where: { slug },
      data: { ...patch },
      include: { faqs: { orderBy: { sortOrder: "asc" } } },
    });

    if (Array.isArray(faqs)) {
      await db.scholarshipFaq.deleteMany({ where: { scholarshipId: updated.id } });
      if (faqs.length) {
        await db.scholarshipFaq.createMany({
          data: faqs.map((f: any, i: number) => ({
            scholarshipId: updated.id,
            question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? i,
          })),
        });
      }
      const fresh = await db.scholarship.findUnique({
        where: { id: updated.id },
        include: { faqs: { orderBy: { sortOrder: "asc" } } },
      });
      if (fresh) (updated as any).faqs = fresh.faqs;
    }

    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: "SCHOLARSHIP_UPDATE",
        resource: "Scholarship",
        resourceId: updated.id,
        details: JSON.stringify({ slug, changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ scholarship: updated });
  } catch (err: any) {
    console.error("[scholarships.update] error:", err);
    return NextResponse.json({ error: "Failed to update scholarship", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/scholarships/[slug] — soft delete via CLOSED status (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const hard = req.nextUrl.searchParams.get("hard") === "1";
    const performedBy = req.nextUrl.searchParams.get("performedBy") || undefined;

    const existing = await db.scholarship.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    if (hard) {
      await db.scholarship.delete({ where: { slug } });
    } else {
      await db.scholarship.update({ where: { slug }, data: { status: "CLOSED" } });
    }

    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: hard ? "SCHOLARSHIP_DELETE" : "SCHOLARSHIP_CLOSE",
        resource: "Scholarship",
        resourceId: existing.id,
        details: JSON.stringify({ slug, hard }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, slug, hard });
  } catch (err: any) {
    console.error("[scholarships.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete scholarship", detail: err.message }, { status: 500 });
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
