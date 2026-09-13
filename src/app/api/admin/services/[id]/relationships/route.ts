import { contentAuditLog } from "@/lib/content-audit";
import { normalizeContentRelationshipType } from "@/lib/content-validation";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/services/[id]/relationships — list relationships for a service
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const service = await db.service.findUnique({ where: { id }, select: { id: true } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const [outgoing, incoming] = await Promise.all([
      db.contentRelationship.findMany({
        where: { sourceType: "SERVICE", sourceId: id },
        orderBy: { sortOrder: "asc" },
      }),
      db.contentRelationship.findMany({
        where: { targetType: "SERVICE", targetId: id },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({
      outgoing,
      incoming,
      total: outgoing.length + incoming.length,
    });
  } catch (err: any) {
    console.error("[admin.services.relationships.list] error:", err);
    return NextResponse.json({ error: "Failed to list relationships" }, { status: 500 });
  }
}

// POST /api/admin/services/[id]/relationships — create a relationship from this service
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const service = await db.service.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await req.json();
    const { targetId, relationshipType = "RELATED", sortOrder = 0, status = "ACTIVE" } = body as any;
    const targetType = normalizeContentRelationshipType((body as any).targetType);

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "targetType and targetId are required and must use a supported content type" }, { status: 400 });
    }
    if (targetType === "SERVICE" && targetId === id) {
      return NextResponse.json({ error: "A service cannot relate to itself" }, { status: 400 });
    }

    // Prevent duplicates
    const dupe = await db.contentRelationship.findFirst({
      where: {
        sourceType: "SERVICE", sourceId: id,
        targetType, targetId, relationshipType,
      },
    });
    if (dupe) {
      return NextResponse.json({ error: "Relationship already exists", relationship: dupe }, { status: 409 });
    }

    const rel = await db.contentRelationship.create({
      data: {
        sourceType: "SERVICE", sourceId: id,
        targetType, targetId,
        relationshipType, sortOrder, status,
      },
    });

    await contentAuditLog.create({
      data: {
        userId,
        action: "CONTENT_RELATIONSHIP_CREATE",
        resource: "ContentRelationship",
        resourceId: rel.id,
        details: JSON.stringify({ sourceType: "SERVICE", sourceId: id, targetType, targetId, relationshipType }),
      },
    }).catch(() => {});

    return NextResponse.json({ relationship: rel }, { status: 201 });
  } catch (err: any) {
    console.error("[admin.services.relationships.create] error:", err);
    return NextResponse.json({ error: "Failed to create relationship" }, { status: 500 });
  }
}
