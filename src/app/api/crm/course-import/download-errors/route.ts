import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { COURSE_COLUMNS, escapeCsvField } from '@/lib/crm/import-constants';
import { withAuth } from '@/lib/auth-middleware';

// Phase 1 (2026-10-12): this route previously had no handler-level check and
// relied on the proxy alone, which also admits APPLICATION_TEAM. It returns
// the raw rows of failed imports, so it now uses the same ADMIN/SUPER_ADMIN
// check as its sibling /api/crm/course-import/errors.
async function downloadErrors(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId || batchId.length > 191 || !/^[A-Za-z0-9_-]+$/.test(batchId)) {
      return NextResponse.json({ error: 'batchId query parameter is required' }, { status: 400 });
    }

    const errors = await db.crmImportError.findMany({
      where: { batchId },
      orderBy: { rowNumber: 'asc' },
    });

    if (errors.length === 0) {
      return NextResponse.json({ error: 'No errors found for this batch' }, { status: 404 });
    }

    // Build CSV
    const allColumns = [...COURSE_COLUMNS, '_error_field', '_error_message', '_error_severity'];
    const csvLines: string[] = [];
    csvLines.push(allColumns.join(','));

    for (const err of errors) {
      let rowData: Record<string, string> = {};
      try {
        rowData = err.rowData ? JSON.parse(err.rowData) : {};
      } catch {
        // ignore parse errors
      }

      const values = allColumns.map((col) => {
        if (col === '_error_field') return escapeCsvField(err.field);
        if (col === '_error_message') return escapeCsvField(err.errorMessage);
        if (col === '_error_severity') return escapeCsvField(err.severity);
        return escapeCsvField(rowData[col] || '');
      });
      csvLines.push(values.join(','));
    }

    const csv = csvLines.join('\n');
    const filename = `import_errors_${batchId}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withAuth(downloadErrors, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
