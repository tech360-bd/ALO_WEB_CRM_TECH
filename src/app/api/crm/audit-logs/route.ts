import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// CRM AUDIT LOGS API — PortalAuditLog with filters, pagination, date range
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const action = searchParams.get('action') || '';
      const entityType = searchParams.get('entityType') || '';
      const actorUserId = searchParams.get('actorUserId') || '';
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { action: { contains: search } },
          { entityType: { contains: search } },
          { entityId: { contains: search } },
          { metadata: { contains: search } },
          { actorUserId: { contains: search } },
          { user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }},
        ];
      }

      if (action) {
        const actions = action.split(',').map(s => s.trim()).filter(Boolean);
        if (actions.length === 1) {
          where.action = actions[0];
        } else if (actions.length > 1) {
          where.action = { in: actions };
        }
      }

      if (entityType) {
        const types = entityType.split(',').map(s => s.trim()).filter(Boolean);
        if (types.length === 1) {
          where.entityType = types[0];
        } else if (types.length > 1) {
          where.entityType = { in: types };
        }
      }

      if (actorUserId) {
        where.actorUserId = actorUserId;
      }

      // Date range filter
      if (startDate || endDate) {
        const createdAt: Record<string, unknown> = {};
        if (startDate) {
          createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          // Set end of day for endDate
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          createdAt.lte = end;
        }
        where.createdAt = createdAt;
      }

      // Build orderBy
      const validSortFields = ['createdAt', 'action', 'entityType'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const orderBy = { [orderField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const };

      const [total, logs] = await Promise.all([
        db.portalAuditLog.count({ where }),
        db.portalAuditLog.findMany({
          where,
          orderBy,
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
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        data: logs,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error('CRM Audit Logs API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load audit logs' },
        { status: 500 }
      );
    }
  })(request);
}
