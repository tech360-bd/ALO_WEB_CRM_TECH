import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMonitoringAdmin, requireMonitoringViewer } from "@/lib/university-monitoring-auth";

// GET /api/university-monitoring/conflicts
// Returns data conflicts (when two official sources disagree).
export async function GET(req: NextRequest) {
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;

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
  // Resolving a conflict decides which official source wins — Super Admin only.
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  const resolvedBy = guard.actor.userId;

  const body = await req.json().catch(() => ({}));
  const { id, resolution, resolutionNotes } = body;

  if (!id || !resolution) {
    return NextResponse.json({ error: "id and resolution are required" }, { status: 400 });
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
