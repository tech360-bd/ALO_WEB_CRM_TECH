import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/source-intelligence/changes
// Lists DataChange records (most recent first). Auth: admin only.
// Query params: status?, sourceId?, entityType?, universitySlug?, courseSlug?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const where: any = {};
    if (sp.get("status")) where.status = sp.get("status");
    if (sp.get("sourceId")) where.sourceId = sp.get("sourceId");
    if (sp.get("entityType")) where.entityType = sp.get("entityType");
    if (sp.get("universitySlug")) where.universitySlug = sp.get("universitySlug");
    if (sp.get("courseSlug")) where.courseSlug = sp.get("courseSlug");

    const limit = Math.min(parseInt(sp.get("limit") || "100", 10) || 100, 500);
    const changes = await db.dataChange.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ changes });
  } catch (err: any) {
    console.error("[source-intelligence/changes GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load changes" }, { status: 500 });
  }
}

// POST /api/source-intelligence/changes
// Detect source changes between two snapshots for a given sourceId.
// Auth: admin only.
// Body: { sourceId, beforeSnapshot, afterSnapshot }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { sourceId, beforeSnapshot, afterSnapshot } = body || {};
    if (!sourceId || !beforeSnapshot || !afterSnapshot) {
      return NextResponse.json(
        { error: "sourceId, beforeSnapshot, afterSnapshot are required" },
        { status: 400 }
      );
    }

    const { detectSourceChange } = await import("@/lib/source-intelligence");
    const changes = await detectSourceChange(sourceId, beforeSnapshot, afterSnapshot);
    return NextResponse.json({ changes });
  } catch (err: any) {
    console.error("[source-intelligence/changes POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to detect changes" }, { status: 500 });
  }
}
