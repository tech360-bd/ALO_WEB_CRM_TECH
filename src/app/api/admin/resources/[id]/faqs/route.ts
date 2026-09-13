import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/resources/[id]/faqs — list FAQs for a resource
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
    const resource = await db.resource.findUnique({ where: { id }, select: { id: true } });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    const faqs = await db.resourceFaq.findMany({
      where: { resourceId: id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ faqs, total: faqs.length });
  } catch (err: any) {
    console.error("[admin.resources.faqs.list] error:", err);
    return NextResponse.json({ error: "Failed to list FAQs", detail: err.message }, { status: 500 });
  }
}

// POST /api/admin/resources/[id]/faqs — add a FAQ to a resource
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
    const resource = await db.resource.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const body = await req.json();
    const { question, answer, sortOrder } = body as any;
    if (!question || !answer) {
      return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
    }

    let order = typeof sortOrder === "number" ? sortOrder : 0;
    if (typeof sortOrder !== "number") {
      const last = await db.resourceFaq.findFirst({
        where: { resourceId: id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      order = last ? last.sortOrder + 1 : 0;
    }

    const faq = await db.resourceFaq.create({
      data: { resourceId: id, question, answer, sortOrder: order },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_FAQ_CREATE",
        resource: "ResourceFaq",
        resourceId: faq.id,
        details: JSON.stringify({ resourceId: id, resourceTitle: resource.title }),
      },
    }).catch(() => {});

    return NextResponse.json({ faq }, { status: 201 });
  } catch (err: any) {
    console.error("[admin.resources.faqs.create] error:", err);
    return NextResponse.json({ error: "Failed to create FAQ", detail: err.message }, { status: 500 });
  }
}
