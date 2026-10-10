import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { recordVendorInvoice, matchVendorInvoice, payVendorInvoice } from '@/lib/procurement/service';

// ============================================================
// GET  /api/procurement/vendor-invoices — list with filters
// POST /api/procurement/vendor-invoices — record an invoice
// PATCH /api/procurement/vendor-invoices — { action: 'match' | 'pay',
//      invoiceId, amount? } — 3-way match or register a payment
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const vendorId = url.searchParams.get('vendorId');
  const poId = url.searchParams.get('poId');
  const where = {
    ...(status ? { status } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(poId ? { poId } : {}),
  };
  const [invoices, total] = await Promise.all([
    db.vendorInvoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      take: 200,
      include: { vendor: { select: { id: true, code: true, name: true } }, po: { select: { id: true, poNumber: true, status: true } } },
    }),
    db.vendorInvoice.count({ where }),
  ]);
  return NextResponse.json({ invoices, total });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT'] });

export const POST = withAuth(async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body?.vendorId || !body?.invoiceNumber || !body?.invoiceDate || body?.subtotal === undefined) {
    return NextResponse.json({ error: 'vendorId, invoiceNumber, invoiceDate and subtotal are required' }, { status: 400 });
  }
  try {
    const invoice = await recordVendorInvoice(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record invoice';
    const conflict = /Unique constraint/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'PROCUREMENT'] });

export const PATCH = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (!body?.invoiceId || !['match', 'pay'].includes(action)) {
    return NextResponse.json({ error: 'invoiceId and action (match|pay) are required' }, { status: 400 });
  }
  try {
    if (action === 'match') {
      return NextResponse.json(await matchVendorInvoice(body.invoiceId, auth.actorUserId));
    }
    if (body.amount === undefined || !Number.isFinite(Number(body.amount))) {
      return NextResponse.json({ error: 'pay requires an amount' }, { status: 400 });
    }
    return NextResponse.json(await payVendorInvoice(body.invoiceId, Number(body.amount), auth.actorUserId));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transition failed';
    const conflict = /exceeds invoice total|must be MATCHED|does not match|not fully received|only RECEIVED/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT'] });
