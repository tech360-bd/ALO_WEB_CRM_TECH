import { NextResponse } from 'next/server';
import { requireCatalogAdmin } from '@/lib/course-finder/catalog-admin-auth';

/**
 * Merge is disabled (fail closed).
 *
 * The previous handler accepted any authenticated session (withAuth without
 * role options), re-pointed courses with two separate non-transactional
 * writes, left intakes/requirements/scholarships/campuses/rankings pointing
 * at the archived university, and wrote no audit record. A safe merge needs a
 * reviewed, audited, single-transaction workflow over every dependent model;
 * until that exists no merge is performed.
 */
export async function POST(req: Request) {
  const auth = await requireCatalogAdmin(req, { level: 'superAdmin', mutation: true });
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(
    {
      success: false,
      code: 'MERGE_WORKFLOW_REQUIRED',
      error: 'Merging records is unavailable until an audited, transactional merge workflow is approved. No records were changed.',
    },
    { status: 409 },
  );
}
