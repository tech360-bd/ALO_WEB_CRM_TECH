import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(auth.userType.toUpperCase()) || auth.roles.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role.toUpperCase()));
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const entityType = req.nextUrl.searchParams.get('entityType');
  const entityId = req.nextUrl.searchParams.get('entityId');
  const studentId = req.nextUrl.searchParams.get('studentId');
  const partnerId = req.nextUrl.searchParams.get('partnerId');
  const employeeId = req.nextUrl.searchParams.get('employeeId');
  const storagePool = req.nextUrl.searchParams.get('pool');
  const status = req.nextUrl.searchParams.get('status') || 'ACTIVE';
  const visibility = req.nextUrl.searchParams.get('visibility');
  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, 120);
  const parsePositive = (value: string | null, fallback: number, maximum: number) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
  };
  const limit = parsePositive(req.nextUrl.searchParams.get('limit'), 50, 100);
  const offset = parsePositive(req.nextUrl.searchParams.get('offset'), 0, 100_000);
  const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === 'true';
  const where: Prisma.FileMetadataWhereInput = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (studentId) where.studentId = studentId;
  if (partnerId) where.partnerId = partnerId;
  if (employeeId) where.employeeId = employeeId;
  if (storagePool) where.storagePool = storagePool;
  if (visibility) where.visibility = visibility;
  if (status !== 'ALL') where.status = status;
  if (!includeDeleted) where.isDeleted = false;
  if (q) where.OR = [{ originalName: { contains: q } }, { tags: { contains: q } }];

  try {
    const [files, total] = await Promise.all([
      db.fileMetadata.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true, originalName: true, mimeType: true, extension: true, sizeBytes: true,
          storagePool: true, entityType: true, entityId: true, studentId: true, partnerId: true,
          employeeId: true, applicationId: true, projectId: true, uploadedBy: true,
          uploadedAt: true, source: true, visibility: true, accessPolicy: true, status: true,
          version: true, retentionPolicy: true, tags: true,
        },
      }),
      db.fileMetadata.count({ where }),
    ]);
    return NextResponse.json({ files: files.map((file) => ({ ...file, sizeBytes: Number(file.sizeBytes) })), total, limit, offset });
  } catch {
    return NextResponse.json({ success: false, error: 'Storage metadata is temporarily unavailable.' }, { status: 503 });
  }
}
