import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectSourceChange, evaluateSourceChangeWithAI } from "@/lib/source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/source-intelligence/changes
// List source change events with filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "PENDING";
  const changeType = req.nextUrl.searchParams.get("changeType");
  const entityType = req.nextUrl.searchParams.get("entityType");
  const universitySlug = req.nextUrl.searchParams.get("university");
  const materiality = req.nextUrl.searchParams.get("materiality");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (changeType) where.changeType = changeType;
  if (entityType) where.entityType = entityType;
  if (universitySlug) where.universitySlug = universitySlug;
  if (materiality) where.materiality = materiality;

  const [changes, total] = await Promise.all([
    db.sourceChangeEvent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    db.sourceChangeEvent.count({ where }),
  ]);

  return NextResponse.json({ changes, total, limit, offset });
}

// POST /api/source-intelligence/changes
// Detect a new source change OR trigger AI evaluation on existing changes
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    // Trigger AI evaluation on a single changeEventId OR all PENDING
    const { changeEventId } = body;
    if (changeEventId) {
      const result = await evaluateSourceChangeWithAI(changeEventId);
      return NextResponse.json({ result });
    }
    // Evaluate all pending — limit 20 to keep response small
    const pending = await db.sourceChangeEvent.findMany({
      where: { status: "PENDING" },
      take: 20,
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const results: any[] = [];
    for (const c of pending) {
      try {
        results.push(await evaluateSourceChangeWithAI(c.id));
      } catch (e: any) {
        results.push({ error: e?.message, changeEventId: c.id });
      }
    }
    return NextResponse.json({ evaluated: results.length, results });
  }

  // Default: detect a new change from before/after snapshots
  const { sourceId, beforeSnapshot, afterSnapshot } = body;
  if (!sourceId || !beforeSnapshot || !afterSnapshot) {
    return NextResponse.json(
      { error: "sourceId, beforeSnapshot, afterSnapshot are required" },
      { status: 400 }
    );
  }
  const result = await detectSourceChange(sourceId, beforeSnapshot, afterSnapshot);
  return NextResponse.json({ result });
}
