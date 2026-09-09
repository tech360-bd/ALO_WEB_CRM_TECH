import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const [
      totalUniversities,
      totalCourses,
      activeCourses,
      draftCourses,
      needsReview,
      needsOfficialSource,
      totalIntakes,
      scholarshipsCount,
      lastBatch,
      failedRowsAgg,
      rollbackBatches,
    ] = await Promise.all([
      db.crmUniversity.count(),
      db.crmCourse.count(),
      db.crmCourse.count({ where: { status: 'active' } }),
      db.crmCourse.count({ where: { status: 'draft' } }),
      db.crmCourse.count({ where: { status: 'needs_review' } }),
      db.crmCourse.count({ where: { status: 'needs_official_source' } }),
      db.crmCourseIntakeFee.count(),
      db.crmScholarship.count(),
      db.crmImportBatch.findFirst({ orderBy: { createdAt: 'desc' } }),
      db.crmImportError.count(),
      db.crmImportBatch.count({ where: { rollbackAvailable: true, status: 'completed' } }),
    ]);

    return NextResponse.json({
      totalUniversities,
      totalCourses,
      activeCourses,
      draftCourses,
      needsReview,
      needsOfficialSource,
      totalIntakes,
      scholarshipsAvailable: scholarshipsCount > 0,
      scholarshipCount: scholarshipsCount,
      lastImportBatch: lastBatch
        ? {
            id: lastBatch.id,
            status: lastBatch.status,
            rowsImported: lastBatch.rowsImported,
            rowsFailed: lastBatch.rowsFailed,
          }
        : null,
      lastImportDate: lastBatch ? lastBatch.createdAt.toISOString() : null,
      failedRows: failedRowsAgg || 0,
      rollbackAvailable: rollbackBatches > 0,
      rollbackBatchCount: rollbackBatches,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}