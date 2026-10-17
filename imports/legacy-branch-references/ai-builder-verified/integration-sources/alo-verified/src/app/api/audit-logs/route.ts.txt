import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';

/**
 * Audit Logs API
 * Returns immutable AuditLog records for the system audit trail.
 * Restricted to super_admin, admin, and marketing_manager roles (FIX-2 spec).
 *
 * Query params:
 *  - page:    1-based page number (default 1)
 *  - limit:   page size (default 50, capped 200)
 *  - module:  filter by module substring (e.g. "marketing", "whatsapp")
 *  - action:  filter by action substring
 *  - userId:  filter by exact userId
 *  - startDate: ISO date lower bound (inclusive) on createdAt
 *  - endDate:   ISO date upper bound (inclusive) on createdAt
 *
 * Returns:
 *   { logs: AuditLog[], pagination: { page, limit, total, totalPages } }
 */
export async function GET(request: NextRequest) {
  const allowedRoles = ['super_admin', 'admin', 'marketing_manager'];
  const authOrResponse = await requireRole(request, allowedRoles);
  if (authOrResponse instanceof NextResponse) return authOrResponse;

  try {
    const { searchParams } = new URL(request.url);
    const moduleFilter = searchParams.get('module') || '';
    const actionFilter = searchParams.get('action') || '';
    const userIdFilter = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1),
      200
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (moduleFilter) where.module = { contains: moduleFilter };
    if (actionFilter) where.action = { contains: actionFilter };
    if (userIdFilter) where.userId = userIdFilter;

    // Date range (inclusive on both bounds)
    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) createdAtFilter.gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) {
          // Include the entire end day
          d.setHours(23, 59, 59, 999);
          createdAtFilter.lte = d;
        }
      }
      if (Object.keys(createdAtFilter).length > 0) {
        where.createdAt = createdAtFilter;
      }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('AuditLogs GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
