// GET /api/super-admin/acting-as/action-log
//
// Every audited action taken while Acting-As.
//
// writePortalAudit() stamps acting sessions into `portal_audit_logs.metadata`
// with `actingAsSessionId`, `actingAsUser`, `actingAsRole` and
// `realActorUserId`. This endpoint reads those rows back and groups them per
// session, so a Super Admin can review exactly what was done "as" someone else,
// by whom, and when. Only audited mutations appear — a read-only acting session
// legitimately produces nothing.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { unavailable, safeRows, jsonObject } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

interface AuditRow {
  id: string;
  action: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  metadata: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const sessionId = (url.searchParams.get('sessionId') || '').slice(0, 191);
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);

  try {
    const rows = await safeRows<AuditRow>(
      () => db.portalAuditLog.findMany({
        where: sessionId
          ? { metadata: { contains: `"actingAsSessionId":"${sessionId}"` } }
          : { metadata: { contains: '"actingAsSessionId"' } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, action: true, actorUserId: true, entityType: true, entityId: true,
          metadata: true, ipAddress: true, userAgent: true, createdAt: true,
        },
      }),
    );

    const bySession = new Map<string, { sessionId: string; actingAsUser: string | null; actingAsRole: string | null; realActorUserId: string | null; count: number; firstAt: string; lastAt: string }>();
    for (const row of rows) {
      const meta = jsonObject(row.metadata);
      const key = typeof meta.actingAsSessionId === 'string' ? meta.actingAsSessionId : 'unattributed';
      const iso = row.createdAt.toISOString();
      const entry = bySession.get(key);
      if (!entry) {
        bySession.set(key, {
          sessionId: key,
          actingAsUser: typeof meta.actingAsUser === 'string' ? meta.actingAsUser : null,
          actingAsRole: typeof meta.actingAsRole === 'string' ? meta.actingAsRole : null,
          realActorUserId: typeof meta.realActorUserId === 'string' ? meta.realActorUserId : row.actorUserId,
          count: 1,
          firstAt: iso,
          lastAt: iso,
        });
      } else {
        entry.count += 1;
        if (iso < entry.firstAt) entry.firstAt = iso;
        if (iso > entry.lastAt) entry.lastAt = iso;
      }
    }

    return NextResponse.json({
      success: true,
      filter: { sessionId: sessionId || null, limit },
      totals: { actions: rows.length, sessions: bySession.size },
      sessions: [...bySession.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1)),
      actions: rows.map((row) => {
        const meta = jsonObject(row.metadata);
        return {
          id: row.id,
          action: row.action,
          realActorUserId: typeof meta.realActorUserId === 'string' ? meta.realActorUserId : row.actorUserId,
          actingAsUser: typeof meta.actingAsUser === 'string' ? meta.actingAsUser : null,
          actingAsRole: typeof meta.actingAsRole === 'string' ? meta.actingAsRole : null,
          sessionId: typeof meta.actingAsSessionId === 'string' ? meta.actingAsSessionId : null,
          entity: { type: row.entityType, id: row.entityId },
          reason: typeof meta.reason === 'string' ? meta.reason : null,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent,
          when: row.createdAt.toISOString(),
        };
      }),
      note: rows.length
        ? null
        : 'No Acting-As actions recorded yet. Only audited mutations are captured, so a read-only acting session produces no rows.',
    });
  } catch (error) {
    return unavailable('super-admin/acting-as/action-log', error);
  }
}

export const GET = withAuth(handleGet);
