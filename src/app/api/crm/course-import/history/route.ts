import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const batches = await db.crmImportBatch.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get error counts for each batch
    const errorCounts = await db.crmImportError.groupBy({
      by: ['batchId'],
      _count: { id: true },
    });
    const errorCountMap = new Map(errorCounts.map((e) => [e.batchId, e._count.id]));

    const result = batches.map((b) => ({
      id: b.id,
      importType: b.importType,
      fileName: b.fileName,
      uploadedBy: b.uploadedBy,
      rowsReceived: b.rowsReceived,
      rowsImported: b.rowsImported,
      rowsFailed: b.rowsFailed,
      rowsDuplicate: b.rowsDuplicate,
      rowsWarning: b.rowsWarning,
      rowsBlocked: b.rowsBlocked,
      rollbackAvailable: b.rollbackAvailable,
      status: b.status,
      errorCount: errorCountMap.get(b.id) || 0,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ batches: result, total: result.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}