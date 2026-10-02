import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { ensureDefaultChart } from '@/lib/accounting/ledger';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/lib/accounting/chart';

// ============================================================
// GET  /api/accounting/chart-of-accounts — list the chart
// POST /api/accounting/chart-of-accounts — seed the canonical chart
//      (idempotent; finance/admin only)
// ============================================================

export const GET = withAuth(async () => {
  const accounts = await db.chartOfAccount.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json({ accounts, total: accounts.length });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });

export const POST = withAuth(async () => {
  const result = await ensureDefaultChart();
  const accounts = await db.chartOfAccount.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json({
    seeded: result.created,
    total: accounts.length,
    accounts,
    canonicalCount: DEFAULT_CHART_OF_ACCOUNTS.length,
  });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });
