// ─── Centralized verified metrics service ────────────────────────────────────
// Single source of truth for public marketing metrics (master specification
// Part 13). Public pages must never hardcode marketing numbers; they read
// through this service (directly or via /api/metrics and /api/website/homepage).
//
// Resolution order per metric:
//   1. Governed `VerifiedMetric` row (status VERIFIED, not expired) wins and
//      is surfaced with its verification metadata.
//   2. A governed row in any other status (UNDER_REVIEW / EXPIRED /
//      UNVERIFIED) is still surfaced, but with that status — it is never
//      presented as verified.
//   3. With no governed row, live counts are aggregated from the database
//      (Country counters) and marked status=UNVERIFIED,
//      source=internal-database-aggregate.
//
// This module deliberately never fabricates numbers and never upgrades a
// metric to VERIFIED automatically: verification is a human, audited action
// (admin API).

import { db } from '@/lib/db';

export type MetricStatus = 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'EXPIRED';

export interface PublicMetric {
  metric: string;
  value: number;
  displayValue: string;
  source: string;
  status: MetricStatus;
  verifiedAt: string | null;
  expiresAt: string | null;
}

export interface PublicMetricsPayload {
  metrics: Record<string, PublicMetric>;
  countryCounts: Record<string, { universityCount: number; courseCount: number; scholarshipCount: number }>;
  generatedAt: string;
}

export const CANONICAL_METRICS = [
  'universities.total',
  'courses.total',
  'scholarships.total',
  'countries.total',
] as const;

export type CanonicalMetric = (typeof CANONICAL_METRICS)[number];

const CACHE_TTL_MS = 60_000;
let cache: { at: number; payload: PublicMetricsPayload } | null = null;

function statusFromRow(status: string, expiresAt: Date | null): MetricStatus {
  if (expiresAt && expiresAt.getTime() < Date.now()) return 'EXPIRED';
  switch (status) {
    case 'VERIFIED':
    case 'UNDER_REVIEW':
    case 'EXPIRED':
      return status;
    default:
      return 'UNVERIFIED';
  }
}

function toPublicMetric(row: {
  metric: string;
  value: number;
  displayValue: string;
  source: string;
  status: string;
  verifiedAt: Date | null;
  expiresAt: Date | null;
}): PublicMetric {
  return {
    metric: row.metric,
    value: row.value,
    displayValue: row.displayValue || formatDisplay(row.value),
    source: row.source,
    status: statusFromRow(row.status, row.expiresAt),
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

function formatDisplay(value: number): string {
  return value >= 100 ? `${value}+` : String(value);
}

/** Live database aggregates (the existing homepage source of truth). */
async function liveAggregates(): Promise<{
  totals: Record<CanonicalMetric, number>;
  countryCounts: PublicMetricsPayload['countryCounts'];
}> {
  const [groups, countries] = await Promise.all([
    db.country.groupBy({
      by: ['id'],
      _sum: { universityCount: true, courseCount: true, scholarshipCount: true },
      where: { status: 'active' },
    }),
    db.country.findMany({
      where: { status: 'active' },
      select: { slug: true, universityCount: true, courseCount: true, scholarshipCount: true },
    }),
  ]);

  const sum = (key: 'universityCount' | 'courseCount' | 'scholarshipCount') =>
    groups.reduce((acc, g) => acc + (g._sum[key] ?? 0), 0);

  return {
    totals: {
      'universities.total': sum('universityCount'),
      'courses.total': sum('courseCount'),
      'scholarships.total': sum('scholarshipCount'),
      'countries.total': countries.length,
    },
    countryCounts: Object.fromEntries(
      countries.map((c) => [
        c.slug,
        { universityCount: c.universityCount, courseCount: c.courseCount, scholarshipCount: c.scholarshipCount },
      ])
    ),
  };
}

/**
 * The single public metrics payload. Governed rows win; live DB aggregates
 * fill the rest (marked UNVERIFIED). Cached for CACHE_TTL_MS.
 */
export async function getPublicMetrics(forceRefresh = false): Promise<PublicMetricsPayload> {
  if (!forceRefresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.payload;
  }

  const [rows, live] = await Promise.all([
    db.verifiedMetric.findMany({ where: { metric: { in: [...CANONICAL_METRICS] } } }),
    liveAggregates(),
  ]);

  const governed = new Map(rows.map((r) => [r.metric, r]));
  const metrics: Record<string, PublicMetric> = {};

  for (const key of CANONICAL_METRICS) {
    const row = governed.get(key);
    if (row) {
      metrics[key] = toPublicMetric(row);
    } else {
      metrics[key] = {
        metric: key,
        value: live.totals[key],
        displayValue: formatDisplay(live.totals[key]),
        source: 'internal-database-aggregate',
        status: 'UNVERIFIED',
        verifiedAt: null,
        expiresAt: null,
      };
    }
  }

  const payload: PublicMetricsPayload = {
    metrics,
    countryCounts: live.countryCounts,
    generatedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), payload };
  return payload;
}

/**
 * Admin operation: refresh governed rows from live database aggregates.
 * Creates or updates rows with status UNVERIFIED — it never marks anything
 * VERIFIED (that requires an explicit human verification call).
 */
export async function syncMetricsFromDatabase(): Promise<number> {
  const live = await liveAggregates();
  let touched = 0;
  for (const key of CANONICAL_METRICS) {
    await db.verifiedMetric.upsert({
      where: { metric: key },
      update: { value: live.totals[key], source: 'internal-database-aggregate' },
      create: {
        metric: key,
        value: live.totals[key],
        source: 'internal-database-aggregate',
        status: 'UNVERIFIED',
      },
    });
    touched += 1;
  }
  cache = null;
  return touched;
}

/** Convenience accessors used by pages/APIs that need one number. */
export async function getMetric(key: CanonicalMetric): Promise<PublicMetric> {
  const payload = await getPublicMetrics();
  return payload.metrics[key];
}
