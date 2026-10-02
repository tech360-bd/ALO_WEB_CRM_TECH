import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { postJournal } from '@/lib/accounting/ledger';

// ============================================================
// GET  /api/accounting/journal-entries — paginated listing
// POST /api/accounting/journal-entries — post a manual journal
//      (finance/admin only; cents-safe, balanced, period-checked)
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const skip = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);
  const status = url.searchParams.get('status');
  const source = url.searchParams.get('source');

  const where = {
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
  };
  const [entries, total] = await Promise.all([
    db.journalEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      take,
      skip,
      include: { lines: true },
    }),
    db.journalEntry.count({ where }),
  ]);
  return NextResponse.json({ entries, total, limit: take, offset: skip });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body?.memo || !Array.isArray(body.lines) || !body.date) {
    return NextResponse.json({ error: 'date, memo and lines are required' }, { status: 400 });
  }
  try {
    const result = await postJournal({
      date: body.date,
      memo: body.memo,
      source: body.source ?? 'manual',
      sourceRefId: body.sourceRefId,
      actorId: auth.actorUserId,
      currency: body.currency,
      lines: body.lines,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Journal posting failed';
    const conflict = /already posted/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'ACCOUNTING'] });
