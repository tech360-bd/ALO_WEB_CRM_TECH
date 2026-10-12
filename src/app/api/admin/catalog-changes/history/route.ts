import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireCatalogAdmin } from '@/lib/course-finder/catalog-admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATALOG_HISTORY_ACTIONS = [
  'CATALOG_PROPOSAL_APPROVE',
  'CATALOG_PROPOSAL_REJECT',
  'CATALOG_PROPOSAL_EDIT',
  'CATALOG_CHANGE_APPLIED',
  'CATALOG_CHANGE_APPLY_FAILED',
  'CATALOG_CHANGE_STALE_REQUEUED',
  'CATALOG_IMPORT_CHANGES_QUEUED',
] as const;

const query = z.object({
  action: z.enum(CATALOG_HISTORY_ACTIONS).optional(),
  requestId: z.string().trim().min(1).max(191).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

/** GET /api/admin/catalog-changes/history — review/apply audit trail (admin, read-only). */
export async function GET(req: Request) {
  const auth = await requireCatalogAdmin(req, { level: 'admin', mutation: false });
  if (auth instanceof NextResponse) return auth;
  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid history filters' }, { status: 400 });
  const { action, requestId, limit } = parsed.data;
  try {
    const rows = await db.portalAuditLog.findMany({
      where: {
        action: action ? action : { in: [...CATALOG_HISTORY_ACTIONS] },
        ...(requestId ? { entityId: requestId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, actorUserId: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true },
    });
    const entries = rows.map((r) => {
      let metadata: unknown = null;
      try { metadata = JSON.parse(r.metadata || 'null'); } catch { metadata = null; }
      return { ...r, metadata };
    });
    return NextResponse.json({ success: true, entries, count: entries.length });
  } catch {
    return NextResponse.json({ success: false, error: 'Audit history is unavailable' }, { status: 503 });
  }
}
