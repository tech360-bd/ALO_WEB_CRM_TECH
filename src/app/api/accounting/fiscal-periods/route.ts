import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { openFiscalPeriod } from '@/lib/accounting/ledger';

// ============================================================
// GET  /api/accounting/fiscal-periods — list periods
// POST /api/accounting/fiscal-periods — open a period (YYYY-MM)
// ============================================================

export const GET = withAuth(async () => {
  const periods = await db.fiscalPeriod.findMany({ orderBy: { startDate: 'desc' } });
  return NextResponse.json({
    periods,
    open: periods.filter((p) => p.status === 'OPEN').length,
    closed: periods.filter((p) => p.status === 'CLOSED').length,
  });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });

export const POST = withAuth(async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.startDate || !body?.endDate) {
    return NextResponse.json({ error: 'name, startDate and endDate are required' }, { status: 400 });
  }
  try {
    const period = await openFiscalPeriod(body.name, body.startDate, body.endDate);
    return NextResponse.json(period, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to open period';
    const conflict = /overlaps/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });
