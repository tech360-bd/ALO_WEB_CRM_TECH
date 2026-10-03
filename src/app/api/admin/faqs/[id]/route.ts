// /api/admin/faqs/[id] — PATCH (edit FAQ / change status) + DELETE
// SUPER_ADMIN/ADMIN only; audit-logged.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentAuditLog } from "@/lib/content-audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "SUPER_ADMIN" && role !== "ADMIN")) return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized — SUPER_ADMIN or ADMIN only" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const before = await db.unifiedFaq.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });

    const { question, answer, category, status, sortOrder, targetType, targetId, targetSlug } = body as any;
    const faq = await db.unifiedFaq.update({
      where: { id },
      data: {
        ...(question !== undefined && { question: String(question) }),
        ...(answer !== undefined && { answer: String(answer) }),
        ...(category !== undefined && { category: String(category) }),
        ...(status !== undefined && { status: String(status) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) || 0 }),
        ...(targetType !== undefined && { targetType: String(targetType) }),
        ...(targetId !== undefined && { targetId: String(targetId) }),
        ...(targetSlug !== undefined && { targetSlug: String(targetSlug) }),
      },
    });

    await contentAuditLog({
      userId: (session.user as any).id,
      action: "FAQ_UPDATED",
      resource: "UnifiedFaq",
      resourceId: id,
      details: { before: { status: before.status }, after: { status: faq.status } },
    });

    return NextResponse.json({ faq });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized — SUPER_ADMIN or ADMIN only" }, { status: 401 });
  const { id } = await params;
  try {
    const before = await db.unifiedFaq.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    await db.unifiedFaq.delete({ where: { id } });

    await contentAuditLog({
      userId: (session.user as any).id,
      action: "FAQ_DELETED",
      resource: "UnifiedFaq",
      resourceId: id,
      details: { question: before.question.slice(0, 80) },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete FAQ" }, { status: 500 });
  }
}
