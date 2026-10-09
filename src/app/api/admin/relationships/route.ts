import { contentAuditLog } from "@/lib/content-audit";
import { normalizeContentRelationshipType } from "@/lib/content-validation";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getContentAdminSession } from "@/lib/content-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/relationships — list all content relationships for admin
export async function GET(req: NextRequest) {
  const session = await getContentAdminSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const sourceType = req.nextUrl.searchParams.get("sourceType");
    const targetType = req.nextUrl.searchParams.get("targetType");
    const relationshipType = req.nextUrl.searchParams.get("relationshipType");
    const status = req.nextUrl.searchParams.get("status");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "200", 10), 500);

    const where: any = {};
    if (sourceType) where.sourceType = sourceType;
    if (targetType) where.targetType = targetType;
    if (relationshipType) where.relationshipType = relationshipType;
    if (status) where.status = status;

    const relationships = await db.contentRelationship.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ relationships, total: relationships.length });
  } catch (err: any) {
    console.error("[admin.relationships.list] error:", err);
    return NextResponse.json({ error: "Failed to list relationships" }, { status: 500 });
  }
}

// POST /api/admin/relationships — create a new relationship
export async function POST(req: NextRequest) {
  const session = await getContentAdminSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      sourceId, targetId,
      relationshipType = "RELATED", sortOrder = 0, status = "ACTIVE",
    } = body as any;
    const sourceType = normalizeContentRelationshipType((body as any).sourceType);
    const targetType = normalizeContentRelationshipType((body as any).targetType);

    if (!sourceType || !sourceId || !targetType || !targetId) {
      return NextResponse.json(
        { error: "sourceType, sourceId, targetType, and targetId are required and must use a supported content type" },
        { status: 400 }
      );
    }
    if (sourceType === targetType && sourceId === targetId) {
      return NextResponse.json({ error: "A content item cannot relate to itself" }, { status: 400 });
    }

    // Prevent duplicates
    const dupe = await db.contentRelationship.findFirst({
      where: { sourceType, sourceId, targetType, targetId, relationshipType },
    });
    if (dupe) {
      return NextResponse.json({ error: "Relationship already exists", relationship: dupe }, { status: 409 });
    }

    const rel = await db.$transaction(async tx => {
      const rel = await tx.contentRelationship.create({
      data: { sourceType, sourceId, targetType, targetId, relationshipType, sortOrder, status },
    });
      await contentAuditLog.create({
      data: {
        userId,
        action: "CONTENT_RELATIONSHIP_CREATE",
        resource: "ContentRelationship",
        resourceId: rel.id,
        details: JSON.stringify({ sourceType, sourceId, targetType, targetId, relationshipType }),
      },
    }, tx);
      return rel;
    });

    return NextResponse.json({ relationship: rel }, { status: 201 });
  } catch (err: any) {
    console.error("[admin.relationships.create] error:", err);
    return NextResponse.json({ error: "Failed to create relationship" }, { status: 500 });
  }
}
