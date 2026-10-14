import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mutationOriginAllowed } from "@/lib/request-origin";
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
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin conflict resolutions are not allowed' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const resolution = typeof body?.resolution === 'string' ? body.resolution.trim().toUpperCase() : '';
  const resolutionNotes = typeof body?.resolutionNotes === 'string' ? body.resolutionNotes.trim().slice(0, 1_000) : '';
  if (!id || !resolution) return NextResponse.json({ success: false, error: 'id and resolution are required' }, { status: 400 });
  if (!['SUPERSEDED', 'MERGED', 'MANUAL_OVERRIDE'].includes(resolution)) {
    return NextResponse.json({ success: false, error: 'resolution must be SUPERSEDED, MERGED, or MANUAL_OVERRIDE' }, { status: 400 });
  }
  if (!resolutionNotes) return NextResponse.json({ success: false, error: 'resolutionNotes must record the Super Admin decision and evidence reviewed' }, { status: 400 });

  const userId = guard.actor.userId;
  let conflict: any;
  try {
    conflict = await db.$transaction(async (tx) => {
      const current = await tx.dataConflict.findUnique({ where: { id } });
      if (!current) throw Object.assign(new Error('Conflict not found'), { httpStatus: 404 });
      if (current.status !== 'PENDING' && current.status !== 'ESCALATED') {
        throw Object.assign(new Error(`Conflict is already ${current.status.toLowerCase()}.`), { httpStatus: 409 });
      }
      const updated = await tx.dataConflict.update({
        where: { id },
        data: { status: 'RESOLVED', resolution, resolutionNotes, resolvedBy: userId, resolvedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DATA_CONFLICT_RESOLVED',
          resource: 'DataConflict',
          resourceId: id,
          details: JSON.stringify({ resolution, resolutionNotes, entityType: current.entityType, fieldName: current.fieldName }),
        },
      });
      await tx.monitoringLog.create({
        data: {
          level: 'AUDIT',
          message: `Super Admin ${userId} resolved official-source conflict ${id} using ${resolution}.`,
          entityType: current.entityType,
          entitySlug: current.universitySlug || current.courseSlug || current.countrySlug,
          metadata: JSON.stringify({ conflictId: id, resolution, resolutionNotes }),
        },
      });
      return updated;
    });
  } catch (error) {
    const httpStatus = error && typeof error === 'object' && 'httpStatus' in error ? Number((error as { httpStatus: unknown }).httpStatus) : 500;
    if (httpStatus >= 400 && httpStatus < 500) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Conflict could not be resolved' }, { status: httpStatus });
    }
    throw error;
  }

  return NextResponse.json({ success: true, conflict, message: 'Conflict resolution recorded. No source value was selected or published by this action.' });
}
