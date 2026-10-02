import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { CANONICAL_METRICS, getPublicMetrics, syncMetricsFromDatabase } from '@/lib/verified-metrics';

export const dynamic = 'force-dynamic';

const METRIC_STATUSES = ['UNVERIFIED', 'UNDER_REVIEW', 'VERIFIED', 'EXPIRED'] as const;

/**
 * Admin governance for centralized verified metrics (Part 13).
 * GET    — list governed rows + current public payload
 * POST   — actions: "sync" (refresh values from DB aggregates, keeps status)
 *          or "verify" (human verification: sets status, verifier, expiry)
 */
export const GET = withAuth(
  async (request: Request, auth) => {
    const rows = await db.verifiedMetric.findMany({
      orderBy: { metric: 'asc' },
    });
    const payload = await getPublicMetrics();
    return NextResponse.json({
      success: true,
      status: 200,
      data: { rows, publicPayload: payload, canonicalMetrics: CANONICAL_METRICS },
      timestamp: new Date().toISOString(),
    });
  },
  { requirePermissions: ['metrics.read'] }
);

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('sync') }),
  z.object({
    action: z.literal('verify'),
    metric: z.enum(CANONICAL_METRICS),
    value: z.number().int().min(0).optional(),
    displayValue: z.string().max(50).optional(),
    status: z.enum(METRIC_STATUSES),
    source: z.string().max(255).optional(),
    expiresAt: z.string().datetime().optional(),
    notes: z.string().max(2000).optional(),
  }),
]);

export const POST = withAuth(
  async (request: Request, auth) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, status: 400, message: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: 'Invalid request',
          error: { code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'sync') {
      const touched = await syncMetricsFromDatabase();
      await logAuditAction(auth, 'metrics_sync', 'VerifiedMetric', 'all', { touched });
      return NextResponse.json({ success: true, status: 200, data: { touched }, timestamp: new Date().toISOString() });
    }

    const { metric, status, value, displayValue, source, expiresAt, notes } = parsed.data;
    const existing = await db.verifiedMetric.findUnique({ where: { metric } });
    const row = await db.verifiedMetric.upsert({
      where: { metric },
      update: {
        status,
        value: value ?? existing?.value ?? 0,
        displayValue: displayValue ?? existing?.displayValue ?? '',
        source: source ?? existing?.source ?? 'internal-database-aggregate',
        verifiedAt: status === 'VERIFIED' ? new Date() : existing?.verifiedAt ?? null,
        verifiedBy: status === 'VERIFIED' ? auth.email ?? auth.userId ?? 'unknown-admin' : existing?.verifiedBy ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : existing?.expiresAt ?? null,
        notes: notes ?? existing?.notes ?? null,
      },
      create: {
        metric,
        status,
        value: value ?? 0,
        displayValue: displayValue ?? '',
        source: source ?? 'internal-database-aggregate',
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedBy: status === 'VERIFIED' ? auth.email ?? auth.userId ?? 'unknown-admin' : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes ?? null,
      },
    });

    await logAuditAction(auth, 'metric_governance', 'VerifiedMetric', row.id, { metric, status });
    return NextResponse.json({ success: true, status: 200, data: { row }, timestamp: new Date().toISOString() });
  },
  { requirePermissions: ['metrics.manage'] }
);
