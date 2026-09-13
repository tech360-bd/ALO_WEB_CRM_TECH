import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/content-engine/assets
// Lists ContentAsset records. Auth: admin / marketing.
// Query params: status?, contentType?, campaignId?, limit?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER" && role !== "MARKETING") {
    return NextResponse.json({ error: "Forbidden — admin or marketing only" }, { status: 403 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const where: any = {};
    if (sp.get("status")) where.status = sp.get("status");
    if (sp.get("contentType")) where.contentType = sp.get("contentType");
    if (sp.get("campaignId")) where.campaignId = sp.get("campaignId");
    const limit = Math.min(parseInt(sp.get("limit") || "100", 10) || 100, 500);

    const xdb = db as unknown as {
      contentAsset: {
        findMany: (args: Record<string, unknown>) => Promise<any[]>;
      };
    };
    const assets = await xdb.contentAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ assets });
  } catch (err: any) {
    console.error("[content-engine/assets GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load assets" }, { status: 500 });
  }
}

// POST /api/content-engine/assets
// Create a new content asset. Auth: admin / marketing.
// Body: CreateContentAssetParams
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER" && role !== "MARKETING") {
    return NextResponse.json({ error: "Forbidden — admin or marketing only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.title || !body?.contentType) {
      return NextResponse.json({ error: "title and contentType are required" }, { status: 400 });
    }

    const { createContentAsset } = await import("@/lib/content-engine");
    const result = await createContentAsset(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[content-engine/assets POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create asset" }, { status: 500 });
  }
}
