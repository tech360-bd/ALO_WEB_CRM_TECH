import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireCatalogAdmin } from '@/lib/course-finder/catalog-admin-auth';
import { applyApprovedCatalogChanges, MAX_APPLY_BATCH, type ApplyClient } from '@/lib/course-finder/apply-approved-changes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const body = z.object({
  requestIds: z.array(z.string().trim().min(1).max(191)).min(1).max(MAX_APPLY_BATCH),
}).strict();

/**
 * POST /api/admin/catalog-changes/apply
 * Super Admin only, same-origin. Applies approved catalogue proposals to the
 * live CRM catalogue in one transaction. Never changes verification or
 * publication status. See src/lib/course-finder/apply-approved-changes.ts.
 */
export async function POST(req: Request) {
  const auth = await requireCatalogAdmin(req, { level: 'superAdmin', mutation: true });
  if (auth instanceof NextResponse) return auth;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: `Send requestIds: 1–${MAX_APPLY_BATCH} proposal IDs` }, { status: 400 });
  }
  try {
    const result = await applyApprovedCatalogChanges(db as unknown as ApplyClient, parsed.data.requestIds, {
      actorUserId: auth.actorUserId,
      effectiveUserId: auth.userId,
      identityDomain: auth.identityDomain || '',
    });
    return NextResponse.json(
      { success: result.ok, code: result.code, message: result.message, results: result.results, verified: false, published: false },
      { status: result.httpStatus, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[admin/catalog-changes/apply] failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, code: 'TRANSACTION_FAILED', error: 'Apply could not be completed; no partial changes were committed.' }, { status: 503 });
  }
}
