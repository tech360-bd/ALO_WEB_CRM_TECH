// GET /api/super-admin/security/sessions
//
// Every session in the register (active, revoked, expired) joined to the user
// so the Super Admin can tell whose session it is before revoking it.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { unavailable, safeRows } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const scope = (url.searchParams.get('scope') || 'active').toLowerCase();
  const userId = url.searchParams.get('userId') || '';

  const where =
    scope === 'all'
      ? {}
      : scope === 'revoked'
        ? { revokedAt: { not: null } }
        : { revokedAt: null, expiresAt: { gt: new Date() } };

  try {
    const sessions = await safeRows<{
      id: string; userId: string; deviceName: string; ipAddress: string; userAgent: string;
      createdAt: Date; expiresAt: Date; revokedAt: Date | null;
    }>(
      () => db.portalSession.findMany({
        where: { ...where, ...(userId ? { userId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: { id: true, userId: true, deviceName: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true, revokedAt: true },
      }),
    );

    // Acting-As sessions are tagged in deviceName by the portal auth layer.
    const actingSessions = sessions.filter((row) => row.deviceName.startsWith('ALO_ACTING_AS:'));
    const userIds = [...new Set(sessions.map((row) => row.userId))];
    const users = userIds.length
      ? await safeRows<{ id: string; name: string; email: string; roles: Array<{ role: { name: string } }> }>(
          () => db.portalUser.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, roles: { select: { role: { select: { name: true } } } } },
          }),
        )
      : [];
    const userMap = new Map(users.map((row) => [row.id, row]));

    return NextResponse.json({
      success: true,
      scope,
      totals: { sessions: sessions.length, actingAs: actingSessions.length },
      sessions: sessions.map((row) => ({
        id: row.id,
        userId: row.userId,
        userName: userMap.get(row.userId)?.name || '',
        userEmail: userMap.get(row.userId)?.email || '',
        userRole: userMap.get(row.userId)?.roles.map((entry) => entry.role.name).join(',') || '',
        deviceName: row.deviceName,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        startedAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        revokedAt: row.revokedAt?.toISOString() || null,
        isActingAs: row.deviceName.startsWith('ALO_ACTING_AS:'),
        actingAsUserId: row.deviceName.startsWith('ALO_ACTING_AS:') ? row.deviceName.split(':')[1] || null : null,
      })),
    });
  } catch (error) {
    return unavailable('super-admin/security/sessions', error);
  }
}

export const GET = withAuth(handleGet);
