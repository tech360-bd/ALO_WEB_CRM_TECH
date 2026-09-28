import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { checkPoolHealth, POOLS, type PoolKey } from "@/lib/storage-service";
import { db } from "@/lib/db";

// GET /api/storage/health
// Returns storage pool health status for the Super Admin storage dashboard.
export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const role = (authResult.userType || authResult.roles[0] || "").toUpperCase();
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pools: any[] = [];
  let totalUsed = 0;
  let totalCapacity = 0;
  let totalFiles = 0;

  for (const poolKey of Object.keys(POOLS) as PoolKey[]) {
    const health = await checkPoolHealth(poolKey);
    const pool = POOLS[poolKey];
    const record = await db.storagePool.findUnique({ where: { poolKey } });

    // Get largest files in this pool
    const largestFiles = await db.fileMetadata.findMany({
      where: { storagePool: poolKey, isDeleted: false },
      orderBy: { sizeBytes: "desc" },
      take: 5,
      select: { id: true, originalName: true, sizeBytes: true, entityType: true, uploadedAt: true },
    });

    // Get recent uploads
    const recentUploads = await db.fileMetadata.findMany({
      where: { storagePool: poolKey, isDeleted: false },
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: { id: true, originalName: true, sizeBytes: true, entityType: true, uploadedAt: true, uploadedBy: true },
    });

    pools.push({
      poolKey,
      name: pool.name,
      description: pool.description,
      mountPath: pool.basePath,
      capacityBytes: Number(health.capacityBytes),
      usedBytes: Number(health.usedBytes),
      freeBytes: Number(health.capacityBytes) - Number(health.usedBytes),
      percentage: health.percentage,
      fileCount: health.fileCount,
      status: health.status,
      warningThreshold: record?.warningThreshold || 70,
      highThreshold: record?.highThreshold || 85,
      criticalThreshold: record?.criticalThreshold || 95,
      lastHealthCheck: record?.lastHealthCheck || null,
      largestFiles: largestFiles.map((f) => ({ ...f, sizeBytes: Number(f.sizeBytes) })),
      recentUploads: recentUploads.map((f) => ({ ...f, sizeBytes: Number(f.sizeBytes) })),
    });

    totalUsed += Number(health.usedBytes);
    totalCapacity += Number(health.capacityBytes);
    totalFiles += health.fileCount;
  }

  // Overall stats
  const [totalFileRecords, deletedFiles, quarantinedFiles] = await Promise.all([
    db.fileMetadata.count({ where: { isDeleted: false } }),
    db.fileMetadata.count({ where: { isDeleted: true } }),
    db.fileMetadata.count({ where: { status: "QUARANTINED" } }),
  ]);

  // Files by entity type
  const byEntityType = await db.fileMetadata.groupBy({
    by: ["entityType"],
    where: { isDeleted: false },
    _count: { id: true },
    _sum: { sizeBytes: true },
  });

  // Files by MIME type (top 10)
  const byMimeType = await db.fileMetadata.groupBy({
    by: ["mimeType"],
    where: { isDeleted: false },
    _count: { id: true },
    _sum: { sizeBytes: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Recent file events (audit trail)
  const recentEvents = await db.fileEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      file: { select: { originalName: true, storagePool: true, entityType: true } },
    },
  });

  // Overall health status
  let overallStatus = "HEALTHY";
  for (const p of pools) {
    if (p.status === "CRITICAL") { overallStatus = "CRITICAL"; break; }
    if (p.status === "HIGH") { overallStatus = "HIGH"; }
    if (p.status === "WARNING" && overallStatus === "HEALTHY") { overallStatus = "WARNING"; }
  }

  return NextResponse.json({
    overallStatus,
    pools,
    summary: {
      totalUsed,
      totalCapacity,
      totalFiles,
      totalPercentage: totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0,
      totalFileRecords,
      deletedFiles,
      quarantinedFiles,
    },
    byEntityType: byEntityType.map((e) => ({ type: e.entityType, count: e._count.id, sizeBytes: Number(e._sum.sizeBytes || 0) })),
    byMimeType: byMimeType.map((m) => ({ mimeType: m.mimeType, count: m._count.id, sizeBytes: Number(m._sum.sizeBytes || 0) })),
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      action: e.action,
      result: e.result,
      performedBy: e.performedBy,
      performedAt: e.performedAt,
      fileName: e.file?.originalName,
      pool: e.file?.storagePool,
    })),
  });
}
