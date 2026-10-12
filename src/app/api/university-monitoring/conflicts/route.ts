import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/conflicts
// Returns data conflicts (when two official sources disagree).
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "PENDING";
  const entityType = req.nextUrl.searchParams.get("entityType");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);

  const where: any = { status };
  if (entityType) where.entityType = entityType;

  const [conflicts, total] = await Promise.all([
    db.dataConflict.findMany({
      where,
      orderBy: [{ detectedAt: "desc" }],
      take: limit,
    }),
    db.dataConflict.count({ where }),
  ]);

  return NextResponse.json({ conflicts, total });
}

// PATCH /api/university-monitoring/conflicts
// Super Admin: resolve a conflict.
// Body: { id, resolution, resolutionNotes, resolvedBy }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, resolution, resolutionNotes, resolvedBy } = body;

  if (!id || !resolution || !resolvedBy) {
    return NextResponse.json({ error: "id, resolution, and resolvedBy are required" }, { status: 400 });
  }

  const conflict = await db.dataConflict.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution,
      resolutionNotes,
      resolvedBy,
      resolvedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: resolvedBy,
      action: "DATA_CONFLICT_RESOLVED",
      resource: "DataConflict",
      resourceId: id,
      details: JSON.stringify({ resolution, resolutionNotes }),
    },
  });

  return NextResponse.json({ conflict, message: "Conflict resolved" });
}
