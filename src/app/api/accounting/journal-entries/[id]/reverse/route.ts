import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { reverseJournal } from '@/lib/accounting/ledger';

// ============================================================
// POST /api/accounting/journal-entries/[id]/reverse — reverse a
// posted journal (creates the mirrored entry atomically).
// ============================================================

export const POST = withAuth(async (
  request: Request,
  auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => ({}));
  try {
    const result = await reverseJournal(id, auth.actorUserId, {
      memo: body?.memo,
      date: body?.date,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reversal failed';
    const notFound = /not found/.test(message);
    const conflict = /already reversed|cannot be reversed/.test(message);
    return NextResponse.json({ error: message }, { status: notFound ? 404 : conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });
