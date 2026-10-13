import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission, isErrorResponse, parsePagination } from '@/lib/access-control';

// ─── GET: List audit logs ──────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, 'system.audit');
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 50);

    const where: Record<string, unknown> = {};
    if (sp.get('userId')) where.userId = sp.get('userId');
    if (sp.get('action')) where.action = sp.get('action');
    if (sp.get('resource')) where.resource = sp.get('resource');

    // Date range filter
    const dateFrom = sp.get('dateFrom');
    const dateTo = sp.get('dateTo');
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.createdAt = dateFilter;
    }

    const [data, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing audit logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to list audit logs.' }, { status: 500 });
  }
}
