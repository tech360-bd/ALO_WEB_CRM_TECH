// ============================================================
// /api/admin/audit
// GET — PortalAuditLog entries with filters
//   Query params: userId, action, entityType, dateFrom, dateTo,
//                 page, limit
// Requires: ADMIN or SUPER_ADMIN
// ============================================================

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

// ------------------------------------------------------------
// GET: Audit log entries with filters
// ------------------------------------------------------------
async function handleGet(request: Request, auth: any) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (userId) where.actorUserId = userId;
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire end date by adding 1 day
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      db.portalAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          actorUserId: true,
          action: true,
          entityType: true,
          entityId: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
          // Note: user relation removed — actorUserId may be "public" or "system".
          // Join manually if user details are needed.
        },
      }),
      db.portalAuditLog.count({ where }),
    ]);

    // Parse metadata JSON for each log entry
    const formattedLogs = logs.map(log => ({
      ...log,
      metadata: (() => {
        try {
          return JSON.parse(log.metadata);
        } catch {
          return log.metadata;
        }
      })(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin audit GET error:', error);
    if (error.message?.includes('Unknown table') || error.code === 'P2021') {
      return NextResponse.json({
        success: false,
        error: 'PortalAuditLog table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// Route handler with auth middleware
// ------------------------------------------------------------
export const GET = withAuth(handleGet, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
