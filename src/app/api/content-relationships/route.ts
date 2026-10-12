import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/content-relationships?sourceType=X&sourceId=Y — get related content (public)
// Also supports: ?targetType=X&targetId=Y for reverse lookups
export async function GET(req: NextRequest) {
  try {
    const sourceType = req.nextUrl.searchParams.get("sourceType");
    const sourceId = req.nextUrl.searchParams.get("sourceId");
    const targetType = req.nextUrl.searchParams.get("targetType");
    const targetId = req.nextUrl.searchParams.get("targetId");
    const relationshipType = req.nextUrl.searchParams.get("relationshipType");
    const status = req.nextUrl.searchParams.get("status") || "ACTIVE";

    const where: any = { status };
    if (sourceType) where.sourceType = sourceType;
    if (sourceId) where.sourceId = sourceId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (relationshipType) where.relationshipType = relationshipType;

    const rels = await db.contentRelationship.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    // Hydrate both source and target where possible
    const hydrated: any[] = [];
    for (const r of rels) {
      const [sourceEntity, targetEntity] = await Promise.all([
        resolveEntity(r.sourceType, r.sourceId),
        resolveEntity(r.targetType, r.targetId),
      ]);
      hydrated.push({
        ...r,
        source: sourceEntity,
        target: targetEntity,
      });
    }

    return NextResponse.json({ relationships: hydrated, total: hydrated.length });
  } catch (err: any) {
    console.error("[content-relationships.list] error:", err);
    return NextResponse.json({ error: "Failed to list relationships", detail: err.message }, { status: 500 });
  }
}

// POST /api/content-relationships — create relationship (admin)
// Body: { sourceType, sourceId, targetType, targetId, relationshipType, sortOrder, status, performedBy }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceType, sourceId, targetType, targetId,
      relationshipType = "RELATED", sortOrder = 0, status = "ACTIVE",
      performedBy,
    } = body as any;

    if (!sourceType || !sourceId || !targetType || !targetId) {
      return NextResponse.json(
        { error: "sourceType, sourceId, targetType, and targetId are required" },
        { status: 400 }
      );
    }

    // Validate that source/target actually exist when they're typed entities we manage
    const sourceExists = await checkEntityExists(sourceType, sourceId);
    if (sourceExists === false) {
      return NextResponse.json({ error: `Source ${sourceType} with id ${sourceId} not found` }, { status: 404 });
    }
    const targetExists = await checkEntityExists(targetType, targetId);
    if (targetExists === false) {
      return NextResponse.json({ error: `Target ${targetType} with id ${targetId} not found` }, { status: 404 });
    }

    // Prevent duplicates
    const dupe = await db.contentRelationship.findFirst({
      where: { sourceType, sourceId, targetType, targetId, relationshipType },
    });
    if (dupe) {
      return NextResponse.json({ error: "Relationship already exists", relationship: dupe }, { status: 409 });
    }

    const rel = await db.contentRelationship.create({
      data: { sourceType, sourceId, targetType, targetId, relationshipType, sortOrder, status },
    });

    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: "CONTENT_RELATIONSHIP_CREATE",
        resource: "ContentRelationship",
        resourceId: rel.id,
        details: JSON.stringify({ sourceType, sourceId, targetType, targetId, relationshipType }),
      },
    }).catch(() => {});

    return NextResponse.json({ relationship: rel }, { status: 201 });
  } catch (err: any) {
    console.error("[content-relationships.create] error:", err);
    return NextResponse.json({ error: "Failed to create relationship", detail: err.message }, { status: 500 });
  }
}

// Helper — resolve an entity reference into a friendly shape (slug + title)
async function resolveEntity(type: string, id: string): Promise<any> {
  try {
    switch (type) {
      case "SERVICE":
        return await db.service.findUnique({ where: { id }, select: { slug: true, title: true, icon: true } });
      case "SCHOLARSHIP":
        return await db.scholarship.findUnique({ where: { id }, select: { slug: true, name: true, fundingType: true } });
      case "RESOURCE":
        return await db.resource.findUnique({ where: { id }, select: { slug: true, title: true, featuredImage: true } });
      // COURSE / UNIVERSITY / COUNTRY / etc. are resolved by other systems (e.g. CountryPage) — return null here.
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Helper — checks whether an entity exists for relationship validation.
// Returns true for types we don't manage (COURSE / UNIVERSITY / COUNTRY) to allow soft linking.
async function checkEntityExists(type: string, id: string): Promise<boolean | null> {
  try {
    switch (type) {
      case "SERVICE":
        return !!(await db.service.findUnique({ where: { id }, select: { id: true } }));
      case "SCHOLARSHIP":
        return !!(await db.scholarship.findUnique({ where: { id }, select: { id: true } }));
      case "RESOURCE":
        return !!(await db.resource.findUnique({ where: { id }, select: { id: true } }));
      default:
        return null; // COURSE / UNIVERSITY / COUNTRY — caller responsible for existence
    }
  } catch {
    return false;
  }
}

async function resolveUserId(performedBy?: string): Promise<string | null> {
  if (!performedBy) return null;
  if (performedBy.includes("@")) {
    const u = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    return u?.id ?? null;
  }
  return performedBy;
}
