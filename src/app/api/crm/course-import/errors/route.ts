import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'batchId query parameter is required' }, { status: 400 });
    }

    const errors = await db.crmImportError.findMany({
      where: { batchId },
      orderBy: { rowNumber: 'asc' },
    });

    const result = errors.map((e) => ({
      id: e.id,
      batchId: e.batchId,
      rowNumber: e.rowNumber,
      universityId: e.universityId,
      courseId: e.courseId,
      field: e.field,
      errorMessage: e.errorMessage,
      severity: e.severity,
      rowData: e.rowData ? JSON.parse(e.rowData) : null,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ errors: result, total: result.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}