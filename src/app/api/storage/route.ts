import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

function isStorageAdmin(userType: string, roles: string[]) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(userType.toUpperCase()) || roles.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role.toUpperCase()));
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!isStorageAdmin(auth.userType, auth.roles)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const limitParam = Number(request.nextUrl.searchParams.get('limit') || '20');
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;
  try {
    const [files, totalFiles, totals] = await Promise.all([
      db.fileMetadata.findMany({
        where: { isDeleted: false },
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        select: { id: true, originalName: true, mimeType: true, sizeBytes: true, entityType: true, entityId: true, status: true, uploadedAt: true },
      }),
      db.fileMetadata.count({ where: { isDeleted: false } }),
      db.fileMetadata.aggregate({ where: { isDeleted: false }, _sum: { sizeBytes: true } }),
    ]);
    return NextResponse.json({ success: true, data: files.map((file) => ({ ...file, sizeBytes: Number(file.sizeBytes) })), stats: { totalFiles, totalSize: Number(totals._sum.sizeBytes || 0) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Storage metadata is temporarily unavailable.' }, { status: 503 });
  }
}
