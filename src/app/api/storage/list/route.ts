import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

// GET /api/storage/list
// Lists files with filters. Used by the Document Hub and Super Admin storage views.
export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const role = (authResult.userType || authResult.roles[0] || "").toUpperCase();
  if (!["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entityType = req.nextUrl.searchParams.get("entityType");
  const entityId = req.nextUrl.searchParams.get("entityId");
  const studentId = req.nextUrl.searchParams.get("studentId");
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const storagePool = req.nextUrl.searchParams.get("pool");
  const status = req.nextUrl.searchParams.get("status") || "ACTIVE";
  const visibility = req.nextUrl.searchParams.get("visibility");
  const q = req.nextUrl.searchParams.get("q");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 500);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  const includeDeleted = req.nextUrl.searchParams.get("includeDeleted") === "true";

  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (studentId) where.studentId = studentId;
  if (partnerId) where.partnerId = partnerId;
  if (employeeId) where.employeeId = employeeId;
  if (storagePool) where.storagePool = storagePool;
  if (visibility) where.visibility = visibility;
  if (status !== "ALL") where.status = status;
  if (!includeDeleted) where.isDeleted = false;
  if (q) {
    where.OR = [
      { originalName: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const [files, total] = await Promise.all([
    db.fileMetadata.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, uuid: true, originalName: true, mimeType: true, extension: true,
        sizeBytes: true, checksumSha256: true, storagePool: true,
        entityType: true, entityId: true, studentId: true, partnerId: true, employeeId: true,
        applicationId: true, projectId: true,
        uploadedBy: true, uploadedAt: true, source: true,
        visibility: true, accessPolicy: true, status: true, version: true,
        retentionPolicy: true, tags: true,
        _count: { select: { events: true, versions: true } },
      },
    }),
    db.fileMetadata.count({ where }),
  ]);

  // Convert BigInt to Number for JSON serialization
  const serializedFiles = files.map((f) => ({ ...f, sizeBytes: Number(f.sizeBytes) }));

  return NextResponse.json({ files: serializedFiles, total, limit, offset });
}
