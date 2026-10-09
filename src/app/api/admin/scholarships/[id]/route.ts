import { pickEditableContentFields } from "@/lib/content-validation";
import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getContentAdminSession } from "@/lib/content-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/scholarships/[id] — single scholarship with FAQs + relationships
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getContentAdminSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const scholarship = await db.scholarship.findUnique({
      where: { id },
      include: {
        faqs: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }
    return NextResponse.json({ scholarship });
  } catch (err: any) {
    console.error("[admin.scholarships.get] error:", err);
    return NextResponse.json({ error: "Failed to fetch scholarship" }, { status: 500 });
  }
}

// PATCH /api/admin/scholarships/[id] — update scholarship
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    const existing = await db.scholarship.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = pickEditableContentFields(body, "scholarship");
    delete patch.id;
    delete patch.faqs;
    delete patch.relationships;
    delete patch.reverseRelationships;
    delete patch.createdAt;
    delete patch.updatedAt;

    // Normalise JSON-encoded fields
    if (patch.coverage && typeof patch.coverage !== "string") patch.coverage = JSON.stringify(patch.coverage);
    if (patch.minimumRequirements && typeof patch.minimumRequirements !== "string") patch.minimumRequirements = JSON.stringify(patch.minimumRequirements);
    if (patch.documentsRequired && typeof patch.documentsRequired !== "string") patch.documentsRequired = JSON.stringify(patch.documentsRequired);
    if (patch.lastVerifiedAt) patch.lastVerifiedAt = new Date(patch.lastVerifiedAt);

    if (patch.slug && patch.slug !== existing.slug) {
      const clash = await db.scholarship.findUnique({ where: { slug: patch.slug } });
      if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (patch.scholarshipCode && patch.scholarshipCode !== existing.scholarshipCode) {
      const clash = await db.scholarship.findUnique({ where: { scholarshipCode: patch.scholarshipCode } });
      if (clash) return NextResponse.json({ error: "Scholarship code already in use" }, { status: 409 });
    }

    const updated = await db.$transaction(async tx => {
      const updated = await tx.scholarship.update({
      where: { id },
      data: patch,
      include: { faqs: { orderBy: { sortOrder: "asc" } } },
    });
      await contentAuditLog.create({
      data: {
        userId,
        action: "SCHOLARSHIP_UPDATE",
        resource: "Scholarship",
        resourceId: id,
        details: JSON.stringify({ changes: Object.keys(patch) }),
      },
    }, tx);
      return updated;
    });

    return NextResponse.json({ scholarship: updated });
  } catch (err: any) {
    console.error("[admin.scholarships.update] error:", err);
    return NextResponse.json({ error: "Failed to update scholarship" }, { status: 500 });
  }
}

// DELETE /api/admin/scholarships/[id] — soft delete (set status to CLOSED)
// Permanent deletion is disabled; retain content history.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    const hard = req.nextUrl.searchParams.get("hard") === "1";
    if (hard && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only SUPER_ADMIN may permanently delete content" }, { status: 403 });
    }
    const existing = await db.scholarship.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    if (hard) return NextResponse.json({ error: 'Permanent content deletion is disabled. Archive the record to retain history.' }, { status: 403 });
    await db.$transaction(async tx => {
      await tx.scholarship.update({ where: { id }, data: { status: 'CLOSED' } });
    await contentAuditLog.create({
      data: {
        userId,
        action: hard ? "SCHOLARSHIP_DELETE" : "SCHOLARSHIP_CLOSE",
        resource: "Scholarship",
        resourceId: id,
        details: JSON.stringify({ slug: existing.slug, hard }),
      },
    }, tx);

    });

    return NextResponse.json({ success: true, id, hard });
  } catch (err: any) {
    console.error("[admin.scholarships.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete scholarship" }, { status: 500 });
  }
}
