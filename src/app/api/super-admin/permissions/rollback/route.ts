// GET  /api/super-admin/permissions/rollback — recent reversible RBAC changes
// POST /api/super-admin/permissions/rollback — revert one of them
//
// Every RBAC mutation already records the complete before/after permission set
// in `portal_audit_logs.metadata`. This endpoint reads those rows and can
// restore the previous state, writing a fresh audit row that names the audit
// entry it reverted. Nothing is ever deleted.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable, jsonObject } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const ROLLBACKABLE = [
  'ROLE_UPDATED',
  'ROLE_CREATED',
  'USER_ROLES_CHANGED',
  'USER_PERMISSION_OVERRIDE',
  'PERMISSION_GROUP_ASSIGNED',
  'PERMISSION_GROUP_REVOKED',
] as const;

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const rows = await db.portalAuditLog.findMany({
      where: { action: { in: [...ROLLBACKABLE] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      reversibleActions: [...ROLLBACKABLE],
      changes: rows.map((row) => {
        const metadata = jsonObject(row.metadata);
        return {
          auditId: row.id,
          action: row.action,
          entityType: row.entityType,
          entityId: row.entityId,
          actorUserId: row.actorUserId,
          createdAt: row.createdAt.toISOString(),
          reason: typeof metadata.reason === 'string' ? metadata.reason : '',
          hasSnapshot: Boolean(metadata.before ?? metadata.beforePermissionIds ?? metadata.beforeRoles),
        };
      }),
    });
  } catch (error) {
    return unavailable('super-admin/permissions/rollback GET', error);
  }
}

const Body = z.object({
  auditId: z.string().trim().min(1).max(191),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { auditId, reason } = parsed.data;

  try {
    const entry = await db.portalAuditLog.findUnique({ where: { id: auditId } });
    if (!entry) return notFound('Audit entry not found.');
    if (!ROLLBACKABLE.includes(entry.action as (typeof ROLLBACKABLE)[number])) {
      return badRequest(`Action ${entry.action} is not reversible by this endpoint.`);
    }

    const metadata = jsonObject(entry.metadata);

    const reverted = await db.$transaction(async (tx) => {
      if (entry.action === 'ROLE_UPDATED') {
        const before = Array.isArray(metadata.beforePermissionIds)
          ? (metadata.beforePermissionIds as unknown[]).map(String)
          : null;
        if (!before) return { applied: false as const, detail: 'No permission snapshot stored.' };

        const current = await tx.portalRolePermission.findMany({
          where: { roleId: entry.entityId, granted: true },
          select: { permissionId: true },
        });
        await tx.portalRolePermission.deleteMany({ where: { roleId: entry.entityId } });
        if (before.length) {
          const valid = await tx.portalPermission.findMany({
            where: { id: { in: before } },
            select: { id: true },
          });
          await tx.portalRolePermission.createMany({
            data: valid.map((permission) => ({
              roleId: entry.entityId,
              permissionId: permission.id,
              granted: true,
              assignedBy: auth.actorUserId,
            })),
            skipDuplicates: true,
          });
        }
        await writePortalAudit(tx, auth, 'ROLE_UPDATED_ROLLED_BACK', 'PortalRole', entry.entityId, {
          reason,
          revertedAuditId: auditId,
          restoredPermissionIds: before,
          previousPermissionIds: current.map((row) => row.permissionId),
        }, request);
        return { applied: true as const, detail: `Restored ${before.length} permissions.` };
      }

      if (entry.action === 'USER_ROLES_CHANGED') {
        const before = Array.isArray(metadata.before) ? (metadata.before as unknown[]).map(String) : null;
        if (!before) return { applied: false as const, detail: 'No role snapshot stored.' };

        const roles = await tx.portalRole.findMany({
          where: { name: { in: before } },
          select: { id: true, name: true },
        });
        if (roles.length === 0) return { applied: false as const, detail: 'Previous roles no longer exist.' };

        const current = await tx.portalUserRole.findMany({
          where: { userId: entry.entityId },
          include: { role: { select: { name: true } } },
        });
        await tx.portalUserRole.deleteMany({ where: { userId: entry.entityId } });
        await tx.portalUserRole.createMany({
          data: roles.map((role) => ({ userId: entry.entityId, roleId: role.id, assignedBy: auth.actorUserId })),
          skipDuplicates: true,
        });
        await writePortalAudit(tx, auth, 'USER_ROLES_ROLLED_BACK', 'PortalUser', entry.entityId, {
          reason,
          revertedAuditId: auditId,
          restoredRoles: before,
          previousRoles: current.map((row) => row.role.name),
        }, request);
        return { applied: true as const, detail: `Restored roles: ${before.join(', ')}.` };
      }

      if (entry.action === 'USER_PERMISSION_OVERRIDE') {
        const before = metadata.before;
        if (!before || typeof before !== 'object') {
          return { applied: false as const, detail: 'No override snapshot stored.' };
        }
        const snapshot = before as { allow?: unknown; deny?: unknown };
        const allow = Array.isArray(snapshot.allow) ? snapshot.allow.map(String) : [];
        const deny = Array.isArray(snapshot.deny) ? snapshot.deny.map(String) : [];

        const user = await tx.portalUser.findUnique({ where: { id: entry.entityId }, select: { id: true } });
        if (!user) return { applied: false as const, detail: 'User no longer exists.' };

        const current = await tx.userPermissionOverride.findMany({
          where: { userId: entry.entityId },
          select: { permissionKey: true, effect: true },
        });
        const previous = {
          allow: current.filter((row) => row.effect === 'ALLOW').map((row) => row.permissionKey),
          deny: current.filter((row) => row.effect === 'DENY').map((row) => row.permissionKey),
        };

        // Replace the override set with the snapshot. Rows absent from the
        // snapshot are deleted, so a rollback really restores the prior state
        // instead of layering on top of it.
        await tx.userPermissionOverride.deleteMany({ where: { userId: entry.entityId } });
        for (const permissionKey of allow) {
          await tx.userPermissionOverride.create({
            data: { userId: entry.entityId, permissionKey, effect: 'ALLOW', reason: `Rollback of audit ${auditId}`, createdBy: auth.actorUserId, updatedBy: auth.actorUserId },
          });
        }
        for (const permissionKey of deny) {
          await tx.userPermissionOverride.create({
            data: { userId: entry.entityId, permissionKey, effect: 'DENY', reason: `Rollback of audit ${auditId}`, createdBy: auth.actorUserId, updatedBy: auth.actorUserId },
          });
        }

        await writePortalAudit(tx, auth, 'USER_PERMISSIONS_ROLLED_BACK', 'PortalUser', entry.entityId, {
          reason,
          revertedAuditId: auditId,
          restored: { allow, deny },
          previous,
        }, request);
        return { applied: true as const, detail: `Restored ${allow.length} allow / ${deny.length} deny overrides.` };
      }

      return { applied: false as const, detail: `${entry.action} has no stored snapshot to restore.` };
    });

    if (!reverted.applied) return badRequest(reverted.detail);
    return NextResponse.json({ success: true, revertedAuditId: auditId, detail: reverted.detail });
  } catch (error) {
    return unavailable('super-admin/permissions/rollback POST', error);
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
