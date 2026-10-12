import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN only
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(_req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied. Requires SUPER_ADMIN or ADMIN role.' },
      { status: 403 },
    );
  }

  try {
    const [fileTypeCounts, totalStorage, documentTypeCounts, recentUploads] = await Promise.all([
      // File counts by type (FileMetadata)
      db.fileMetadata.groupBy({
        by: ['fileType'],
        _count: true,
      }),

      // Total storage used (FileMetadata)
      db.fileMetadata.aggregate({
        _sum: { fileSize: true },
        _count: true,
      }),

      // Document counts by category (Document model)
      db.document.groupBy({
        by: ['category'],
        _count: true,
      }),

      // Recent 15 uploads (FileMetadata)
      db.fileMetadata.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          uploadedBy: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalFiles: totalStorage._count,
        totalStorageBytes: totalStorage._sum.fileSize || 0,
        fileCountsByType: fileTypeCounts.map((f) => ({ type: f.fileType, count: f._count })),
        documentCountsByCategory: documentTypeCounts.map((d) => ({ category: d.category, count: d._count })),
        recentUploads,
      },
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storage statistics.' },
      { status: 500 },
    );
  }
}
