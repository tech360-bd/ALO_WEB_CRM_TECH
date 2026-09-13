import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/services/[id]/faqs — list FAQs for a service
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
    const faqs = await db.serviceFaq.findMany({
      where: { serviceId: id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ faqs, total: faqs.length });
  } catch (err: any) {
    console.error("[admin.services.faqs.list] error:", err);
    return NextResponse.json({ error: "Failed to list FAQs" }, { status: 500 });
  }
}

// POST /api/admin/services/[id]/faqs — add a FAQ to a service
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
    const { question, answer, sortOrder } = body as any;
    if (!question || !answer) {
      return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
    }

    // Auto-calculate sortOrder if not provided
    let order = typeof sortOrder === "number" ? sortOrder : 0;
    if (typeof sortOrder !== "number") {
      const last = await db.serviceFaq.findFirst({
        where: { serviceId: id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      order = last ? last.sortOrder + 1 : 0;
    }

    const faq = await db.serviceFaq.create({
      data: { serviceId: id, question, answer, sortOrder: order },
    });

    await contentAuditLog.create({
      data: {
        userId,
        action: "SERVICE_FAQ_CREATE",
        resource: "ServiceFaq",
        resourceId: faq.id,
        details: JSON.stringify({ serviceId: id, serviceTitle: service.title }),
      },
    }).catch(() => {});

    return NextResponse.json({ faq }, { status: 201 });
  } catch (err: any) {
    console.error("[admin.services.faqs.create] error:", err);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
