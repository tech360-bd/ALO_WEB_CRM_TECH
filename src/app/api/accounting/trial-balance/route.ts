import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { trialBalance, verifyLedgerIntegrity, computeARAging } from '@/lib/accounting/ledger';

// ============================================================
// GET /api/accounting/trial-balance — real double-entry trial
// balance from POSTED journal lines, plus the ledger integrity
// audit result. Finance/admin only.
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const asOfParam = url.searchParams.get('asOf');
  const asOf = asOfParam ? new Date(`${asOfParam}T23:59:59.999Z`) : undefined;
  if (asOfParam && (Number.isNaN(asOf?.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(asOfParam))) {
    return NextResponse.json({ error: 'asOf must be YYYY-MM-DD' }, { status: 400 });
  }
  const [rows, integrity, arAging] = await Promise.all([
    trialBalance(asOf),
    verifyLedgerIntegrity(),
    computeARAging(),
  ]);
  const totalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);
  return NextResponse.json({
    asOf: asOfParam ?? null,
    rows,
    totals: { totalDebit, totalCredit, balanced: totalDebit === totalCredit },
    integrity,
    accountsReceivable: arAging,
  });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });
