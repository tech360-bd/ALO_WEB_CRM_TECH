// ============================================================
// /api/admin/faqs — unified FAQ management (spec §45-46: "+ Add FAQ"
// for services, scholarships, resources). SUPER_ADMIN/ADMIN only.
// Every change is audit-logged via contentAuditLog.
// ============================================================

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

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized — SUPER_ADMIN or ADMIN only" }, { status: 401 });

  const targetType = req.nextUrl.searchParams.get("targetType") || "";
  const targetSlug = req.nextUrl.searchParams.get("targetSlug") || "";
  const where: any = {};
  if (targetType) where.targetType = targetType;
  if (targetSlug) where.targetSlug = targetSlug;

  const faqs = await db.unifiedFaq.findMany({ where, orderBy: [{ targetSlug: "asc" }, { sortOrder: "asc" }], take: 500 });
  return NextResponse.json({ faqs, total: faqs.length });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized — SUPER_ADMIN or ADMIN only" }, { status: 401 });

  try {
    const body = await req.json();
    const { question, answer, targetType, targetId = "", targetSlug = "", category = "general", status = "active", sortOrder = 0 } = body as any;
    if (!question || !answer) {
      return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
    }

    const faq = await db.unifiedFaq.create({
      data: {
        question: String(question),
        answer: String(answer),
        targetType: String(targetType || "general"),
        targetId: String(targetId || ""),
        targetSlug: String(targetSlug || ""),
        category: String(category || "general"),
        status: String(status || "active"),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    await contentAuditLog.create({ data: {
      userId: (session.user as any).id,
      action: "FAQ_CREATED",
      resource: "UnifiedFaq",
      resourceId: faq.id,
      details: { targetType: faq.targetType, targetSlug: faq.targetSlug },
    } });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create FAQ" }, { status: 500 });
  }
}
