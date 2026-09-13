import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/services/[id] — single service with FAQs + relationships
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
    const service = await db.service.findUnique({
      where: { id },
      include: {
        faqs: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (err: any) {
    console.error("[admin.services.get] error:", err);
    return NextResponse.json({ error: "Failed to fetch service", detail: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/services/[id] — update service fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = { ...body };
    // Drop fields that should not be directly written
    delete patch.id;
    delete patch.faqs;
    delete patch.relationships;
    delete patch.reverseRelationships;
    delete patch.createdAt;
    delete patch.updatedAt;

    // Normalise JSON-encoded fields
    if (patch.content && typeof patch.content !== "string") {
      patch.content = JSON.stringify(patch.content);
    }
    if (patch.requirements && typeof patch.requirements !== "string") {
      patch.requirements = JSON.stringify(patch.requirements);
    }
    if (patch.documents && typeof patch.documents !== "string") {
      patch.documents = JSON.stringify(patch.documents);
    }
    if (patch.lastVerifiedAt) {
      patch.lastVerifiedAt = new Date(patch.lastVerifiedAt);
    }

    // Slug change uniqueness check
    if (patch.slug && patch.slug !== existing.slug) {
      const clash = await db.service.findUnique({ where: { slug: patch.slug } });
      if (clash) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
    }

    const updated = await db.service.update({
      where: { id },
      data: patch,
      include: {
        faqs: { orderBy: { sortOrder: "asc" } },
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "SERVICE_UPDATE",
        resource: "Service",
        resourceId: id,
        details: JSON.stringify({ changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ service: updated });
  } catch (err: any) {
    console.error("[admin.services.update] error:", err);
    return NextResponse.json({ error: "Failed to update service", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/services/[id] — soft delete (set status to ARCHIVED)
// Pass ?hard=1 to hard delete (cascades FAQs + relationships)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const hard = req.nextUrl.searchParams.get("hard") === "1";
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (hard) {
      // Relationships are polymorphic scalar references, so remove both
      // directions explicitly before deleting the content record.
      await db.contentRelationship.deleteMany({
        where: {
          OR: [
            { sourceType: "SERVICE", sourceId: id },
            { targetType: "SERVICE", targetId: id },
          ],
        },
      });
      await db.service.delete({ where: { id } });
    } else {
      await db.service.update({ where: { id }, data: { status: "ARCHIVED" } });
    }

    await db.auditLog.create({
      data: {
        userId,
        action: hard ? "SERVICE_DELETE" : "SERVICE_ARCHIVE",
        resource: "Service",
        resourceId: id,
        details: JSON.stringify({ slug: existing.slug, hard }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, id, hard });
  } catch (err: any) {
    console.error("[admin.services.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete service", detail: err.message }, { status: 500 });
  }
}
