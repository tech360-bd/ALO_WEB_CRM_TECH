import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getContentAdminSession } from "@/lib/content-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/scholarships/[id]/faqs/[faqId] — update a scholarship FAQ
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
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
    const { id, faqId } = await params;
    const existing = await db.scholarshipFaq.findUnique({ where: { id: faqId } });
    if (!existing || existing.scholarshipId !== id) {
      return NextResponse.json({ error: "FAQ not found for this scholarship" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = {};
    if (typeof body.question === "string") patch.question = body.question;
    if (typeof body.answer === "string") patch.answer = body.answer;
    if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;

    const updated = await db.$transaction(async tx => {
      const updated = await tx.scholarshipFaq.update({ where: { id: faqId }, data: patch });
      await contentAuditLog.create({
      data: {
        userId,
        action: "SCHOLARSHIP_FAQ_UPDATE",
        resource: "ScholarshipFaq",
        resourceId: faqId,
        details: JSON.stringify({ scholarshipId: id, changes: Object.keys(patch) }),
      },
    }, tx);
      return updated;
    });

    return NextResponse.json({ faq: updated });
  } catch (err: any) {
    console.error("[admin.scholarships.faqs.update] error:", err);
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
  }
}

// DELETE /api/admin/scholarships/[id]/faqs/[faqId] — delete a scholarship FAQ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
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
    const { id, faqId } = await params;
    const existing = await db.scholarshipFaq.findUnique({ where: { id: faqId } });
    if (!existing || existing.scholarshipId !== id) {
      return NextResponse.json({ error: "FAQ not found for this scholarship" }, { status: 404 });
    }

    await db.$transaction(async tx => {
    await tx.scholarshipFaq.update({ where: { id: faqId }, data: { status: "archived" } });

    await contentAuditLog.create({
      data: {
        userId,
        action: "SCHOLARSHIP_FAQ_DELETE",
        resource: "ScholarshipFaq",
        resourceId: faqId,
        details: JSON.stringify({ scholarshipId: id, question: existing.question }),
      },
    }, tx);
    });

    return NextResponse.json({ success: true, faqId });
  } catch (err: any) {
    console.error("[admin.scholarships.faqs.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
  }
}
