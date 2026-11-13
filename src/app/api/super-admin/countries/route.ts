// GET /api/super-admin/countries — Country / Destination Control Center.
// Per-country aggregates are computed from real rows; a country with no data
// reports 0, and readiness is null when no visa case has been assessed.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import type { CountryControlRow } from '@/lib/super-admin/types';

export const dynamic = 'force-dynamic';

interface VisaAggRow {
  destinationCountry: string;
  _count: { _all: number };
  _avg: { readinessScore: number | null };
}

/** Runs a query and degrades to typed rows instead of throwing. */
async function safeRows<T>(fn: () => Promise<unknown>, fallback: T[]): Promise<T[]> {
  try {
    return (await fn()) as T[];
  } catch {
    return fallback;
  }
}

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const [countries, leadsByCountry, visaAgg, visaHighRisk, universities] = await Promise.all([
      db.country.findMany({ orderBy: { name: 'asc' }, select: { id: true, code: true, name: true, slug: true, status: true, lastVerifiedAt: true, universityCount: true, courseCount: true } }),
      safeRows<{ preferredCountry: string | null; _count: { _all: number } }>(
        () => db.lead.groupBy({ by: ['preferredCountry'], _count: { _all: true } }), []),
      safeRows<VisaAggRow>(
        () => db.visaCase.groupBy({ by: ['destinationCountry'], _count: { _all: true }, _avg: { readinessScore: true } }), []),
      safeRows<{ destinationCountry: string; _count: { _all: number } }>(
        () => db.visaCase.groupBy({ by: ['destinationCountry'], where: { riskLevel: { in: ['high', 'HIGH', 'critical'] } }, _count: { _all: true } }), []),
      safeRows<{ country: string; _count: { _all: number } }>(
        () => db.application.groupBy({ by: ['country'], _count: { _all: true } }), []),
    ]);

    const leadMap = new Map<string, number>(
      leadsByCountry.map((row) => [(row.preferredCountry || '').toLowerCase(), row._count._all] as [string, number]));
    const appMap = new Map<string, number>(
      universities.map((row) => [(row.country || '').toLowerCase(), row._count._all] as [string, number]));
    const visaMap = new Map<string, VisaAggRow>(
      visaAgg.map((row) => [(row.destinationCountry || '').toLowerCase(), row] as [string, VisaAggRow]));
    const highRiskMap = new Map<string, number>(
      visaHighRisk.map((row) => [(row.destinationCountry || '').toLowerCase(), row._count._all] as [string, number]));

    const rows: CountryControlRow[] = countries.map((country) => {
      const keys = [country.name.toLowerCase(), (country.code || '').toLowerCase()].filter(Boolean);
      const pickNumber = (map: Map<string, number>): number => {
        for (const key of keys) {
          const found = map.get(key);
          if (found !== undefined) return found;
        }
        return 0;
      };
      let visa: VisaAggRow | undefined;
      for (const key of keys) {
        if (visaMap.has(key)) { visa = visaMap.get(key); break; }
      }
      const avg = visa?._avg.readinessScore;

      return {
        id: country.id,
        code: country.code,
        name: country.name,
        slug: country.slug,
        status: country.status,
        leads: pickNumber(leadMap),
        students: 0,
        applications: pickNumber(appMap),
        universities: country.universityCount,
        courses: country.courseCount,
        visaCases: visa?._count._all ?? 0,
        highRiskVisaCases: pickNumber(highRiskMap),
        visaReadinessAvg: avg === null || avg === undefined ? null : Math.round(avg * 10) / 10,
        lastVerifiedAt: country.lastVerifiedAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      countries: rows,
      totals: {
        countries: rows.length,
        leads: rows.reduce((sum, row) => sum + row.leads, 0),
        applications: rows.reduce((sum, row) => sum + row.applications, 0),
        visaCases: rows.reduce((sum, row) => sum + row.visaCases, 0),
        highRiskVisaCases: rows.reduce((sum, row) => sum + row.highRiskVisaCases, 0),
      },
      notes: [
        'Student rows store a free-text currentCountry, so per-country student counts are reported as 0 rather than guessed.',
      ],
    });
  } catch (error) {
    console.error('[super-admin/countries] failed', error);
    return NextResponse.json({ success: false, error: 'Country control is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
