import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { vendorPerformanceSummary } from '@/lib/procurement/service';

// ============================================================
// GET   /api/procurement/vendors/[id] — vendor detail + performance
// PATCH /api/procurement/vendors/[id] — update vendor fields
// ============================================================

export const GET = withAuth(async (
  _request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const vendor = await db.vendor.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  const performance = await vendorPerformanceSummary(id);
  return NextResponse.json({ vendor, performance });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT'] });

export const PATCH = withAuth(async (
  request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body required' }, { status: 400 });

  const allowed = ['name', 'legalName', 'taxId', 'category', 'email', 'phone', 'address', 'country', 'paymentTerms', 'rating', 'status', 'notes'] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.status && !['ACTIVE', 'SUSPENDED', 'BLACKLISTED'].includes(String(data.status))) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  if (data.paymentTerms && !['NET-7', 'NET-15', 'NET-30', 'NET-60', 'PREPAID'].includes(String(data.paymentTerms))) {
    return NextResponse.json({ error: 'Invalid payment terms' }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }
  const vendor = await db.vendor.update({ where: { id }, data }).catch(() => null);
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  return NextResponse.json(vendor);
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'PROCUREMENT'] });
