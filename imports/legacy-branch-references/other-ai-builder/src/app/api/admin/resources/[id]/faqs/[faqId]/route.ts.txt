import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/resources/[id]/faqs/[faqId] — update a resource FAQ
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
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
    const { id, faqId } = await params;
    const existing = await db.resourceFaq.findUnique({ where: { id: faqId } });
    if (!existing || existing.resourceId !== id) {
      return NextResponse.json({ error: "FAQ not found for this resource" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = {};
    if (typeof body.question === "string") patch.question = body.question;
    if (typeof body.answer === "string") patch.answer = body.answer;
    if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;

    const updated = await db.resourceFaq.update({ where: { id: faqId }, data: patch });

    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_FAQ_UPDATE",
        resource: "ResourceFaq",
        resourceId: faqId,
        details: JSON.stringify({ resourceId: id, changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ faq: updated });
  } catch (err: any) {
    console.error("[admin.resources.faqs.update] error:", err);
    return NextResponse.json({ error: "Failed to update FAQ", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/resources/[id]/faqs/[faqId] — delete a resource FAQ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
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
    const { id, faqId } = await params;
    const existing = await db.resourceFaq.findUnique({ where: { id: faqId } });
    if (!existing || existing.resourceId !== id) {
      return NextResponse.json({ error: "FAQ not found for this resource" }, { status: 404 });
    }

    await db.resourceFaq.delete({ where: { id: faqId } });

    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_FAQ_DELETE",
        resource: "ResourceFaq",
        resourceId: faqId,
        details: JSON.stringify({ resourceId: id, question: existing.question }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, faqId });
  } catch (err: any) {
    console.error("[admin.resources.faqs.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete FAQ", detail: err.message }, { status: 500 });
  }
}
