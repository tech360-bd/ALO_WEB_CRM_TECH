// GET /api/super-admin/audit-logs
//
// Reads the canonical AuditLog table (the one with beforeValue/afterValue)
// merged with PortalAuditLog rows (which carry the Acting-As context), newest
// first. Read-only by design: there is no delete endpoint for audit rows.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import type { AuditLogRow } from '@/lib/super-admin/types';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const action = (url.searchParams.get('action') || '').trim().slice(0, 80);
  const actor = (url.searchParams.get('actor') || '').trim().slice(0, 120);
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 300);
  const source = (url.searchParams.get('source') || 'both').trim();

  try {
    const [canonical, portal] = await Promise.all([
      source === 'portal' ? Promise.resolve([]) : db.auditLog.findMany({
        where: {
          ...(action ? { action: { contains: action } } : {}),
          ...(actor ? { OR: [{ userId: actor }, { actorRole: { contains: actor } }] } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      source === 'canonical' ? Promise.resolve([]) : db.portalAuditLog.findMany({
        where: action ? { action: { contains: action } } : {},
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const rows: AuditLogRow[] = [
      ...canonical.map((row) => ({
        id: row.id,
        action: row.action,
        actorRole: row.actorRole,
        actorUserId: row.userId,
        resource: row.resource,
        resourceId: row.resourceId,
        createdAt: row.createdAt.toISOString(),
        ipAddress: row.ipAddress,
      })),
      ...portal.map((row) => {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(row.metadata || '{}') as Record<string, unknown>;
        } catch {
          parsed = {};
        }
        return {
          id: row.id,
          action: row.action,
          actorRole: row.metadata?.includes('actingAsRole')
            ? `SUPER_ADMIN acting_as ${String(parsed.actingAsRole ?? '')}`.trim()
            : 'SUPER_ADMIN',
          actorUserId: row.actorUserId,
          resource: row.entityType,
          resourceId: row.entityId,
          createdAt: row.createdAt.toISOString(),
          ipAddress: row.ipAddress,
          actingAsRole: typeof parsed.actingAsRole === 'string' ? parsed.actingAsRole : null,
          actingAsUserId: typeof parsed.actingAsUser === 'string' ? parsed.actingAsUser : null,
        };
      }),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);

    await logAuditAction(auth, 'AUDIT_LOG_VIEWED', 'AuditLog', 'query', { action, actor, limit });

    return NextResponse.json({ success: true, logs: rows, count: rows.length });
  } catch (error) {
    console.error('[super-admin/audit-logs] failed', error);
    return NextResponse.json({ success: false, error: 'Audit log is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
