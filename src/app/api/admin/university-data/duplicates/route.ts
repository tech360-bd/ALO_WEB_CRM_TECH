import { NextResponse } from 'next/server';

/**
 * Legacy duplicate list. It previously always returned an empty list, which
 * read as "no duplicates". Real analysis now lives at
 * GET /api/admin/catalog-review?view=duplicates (admin-only, read-only).
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      code: 'MOVED_TO_CATALOG_REVIEW',
      data: [],
      error: 'Duplicate analysis moved to /admin/data-review/duplicates (GET /api/admin/catalog-review?view=duplicates). This legacy endpoint does not compute duplicates.',
    },
    { status: 410 },
  );
}
