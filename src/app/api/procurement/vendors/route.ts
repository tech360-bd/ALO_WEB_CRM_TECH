import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { createVendor } from '@/lib/procurement/service';

// ============================================================
// GET  /api/procurement/vendors — list/filter vendors
// POST /api/procurement/vendors — create a vendor
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('q');
  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(search ? { name: { contains: search } } : {}),
  };
  const [vendors, total] = await Promise.all([
    db.vendor.findMany({ where, orderBy: { name: 'asc' }, take: 200 }),
    db.vendor.count({ where }),
  ]);
  return NextResponse.json({ vendors, total });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
  }
  try {
    const vendor = await createVendor(body, auth.actorUserId);
    return NextResponse.json(vendor, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create vendor' }, { status: 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'PROCUREMENT'] });
