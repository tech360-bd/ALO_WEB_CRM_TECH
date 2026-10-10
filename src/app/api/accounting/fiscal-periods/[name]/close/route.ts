import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { closeFiscalPeriod } from '@/lib/accounting/ledger';

// ============================================================
// POST /api/accounting/fiscal-periods/[name]/close — close a
// fiscal period. Posting into closed periods is rejected by the
// ledger service afterwards. Requires SUPER_ADMIN (financial
// period close is a sensitive, hard-to-reverse control).
// ============================================================

export const POST = withAuth(async (
  _request: Request,
  auth,
  context?: { params: Promise<{ name: string }> },
) => {
  const { name } = await context!.params;
  try {
    await closeFiscalPeriod(decodeURIComponent(name), auth.actorUserId);
    return NextResponse.json({ closed: decodeURIComponent(name) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to close period';
    const notFound = /not found/.test(message);
    const conflict = /already closed/.test(message);
    return NextResponse.json({ error: message }, { status: notFound ? 404 : conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['SUPER_ADMIN'] });
