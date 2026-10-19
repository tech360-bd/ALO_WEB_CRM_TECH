import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { buildAttentionReport } from '@/lib/intelligence/attention-engine';

// ============================================================
// GET /api/intelligence/attention — "What needs attention?" (spec s108)
//
// Every bucket carries a real count, a severity, a link to the underlying
// records and a sample of real ids, so no number can be presented without
// evidence. Buckets that fail report status ERROR with the reason instead of
// silently showing 0 (spec s91).
// ============================================================

const MANAGEMENT_TYPES = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'EMPLOYEE'];

export const GET = withAuth(async (request: Request, auth) => {
  const url = new URL(request.url);
  const persist = url.searchParams.get('persist') === 'true';
  const scope = (url.searchParams.get('scope') || 'GLOBAL').toUpperCase();

  const report = await buildAttentionReport({
    scope: scope === 'BRANCH' || scope === 'USER' ? scope : 'GLOBAL',
    scopeId: url.searchParams.get('scopeId') || (scope === 'USER' ? auth.userId : ''),
    generatedFor: auth.userId,
    sampleSize: Math.min(Math.max(Number(url.searchParams.get('sampleSize') ?? 5), 1), 25),
    untouchedLeadHours: Number(url.searchParams.get('untouchedLeadHours') ?? 24) || 24,
    // Persisting on every login would write a snapshot per page view; only do
    // it when explicitly requested (dashboard load, daily briefing job).
    persist,
  });

  return NextResponse.json({ success: true, report });
}, { requireUserTypes: MANAGEMENT_TYPES });
