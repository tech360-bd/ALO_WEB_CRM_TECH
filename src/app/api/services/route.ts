import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/services — list published services (public)
// Supports: ?sortOrder=asc|desc, ?limit=50; unpublished records are never public
export async function GET(req: NextRequest) {
  try {
    // The public endpoint must never expose DRAFT or ARCHIVED content.
    const status = "PUBLISHED";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10), 200);

    const services = await db.service.findMany({
      where: { status },
      orderBy: [{ sortOrder }, { title: "asc" }],
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        icon: true,
        heroImage: true,
        ctaLabel: true,
        ctaUrl: true,
        status: true,
        sortOrder: true,
        faqEnabled: true,
        verificationStatus: true,
        lastVerifiedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ services, total: services.length });
  } catch (err: any) {
    console.error("[services.list] error:", err);
    return NextResponse.json({ error: "Failed to list services" }, { status: 500 });
  }
}

// Keep legacy creation URLs on the same authenticated, audited implementation.
export { POST } from "../admin/services/route";
