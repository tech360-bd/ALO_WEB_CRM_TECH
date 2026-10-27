// GET   /api/super-admin/roles/{id} — one role with its full permission set
// PATCH /api/super-admin/roles/{id} — rename / edit description / set permissions
//
// Setting permissions replaces the grant set atomically and records the
// complete before/after permission list in the audit row, which is what makes
// the change reversible (see POST /api/super-admin/permissions/rollback).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const role = await db.portalRole.findUnique({
      where: { id },
      include: {
        permissions: { where: { granted: true }, select: { permissionId: true } },
        userRoles: { select: { userId: true } },
      },
    });
    if (!role) return notFound('Role not found.');

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        label: role.label,
        description: role.description,
        isSystem: role.isSystem,
        permissionIds: role.permissions.map((row) => row.permissionId),
        userCount: role.userRoles.length,
      },
    });
  } catch (error) {
    return unavailable('super-admin/roles/{id} GET', error);
  }
}

const Body = z.object({
  label: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.string().trim().min(1).max(191)).max(1000).optional(),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { label, description, permissionIds, reason } = parsed.data;

  try {
    const role = await db.portalRole.findUnique({ where: { id } });
    if (!role) return notFound('Role not found.');

    // A system role may gain/lose permissions but must keep its identity.
    if (role.isSystem && (label !== undefined || description !== undefined)) {
      return badRequest('A system role’s label and description cannot be renamed. Adjust its permissions instead.');
    }

    const result = await db.$transaction(async (tx) => {
      const before = await tx.portalRolePermission.findMany({
        where: { roleId: id, granted: true },
        select: { permissionId: true },
      });

      if (label !== undefined || description !== undefined) {
        await tx.portalRole.update({
          where: { id },
          data: { ...(label !== undefined ? { label } : {}), ...(description !== undefined ? { description } : {}) },
        });
      }

      if (permissionIds) {
        const valid = await tx.portalPermission.findMany({
          where: { id: { in: permissionIds } },
          select: { id: true },
        });
        const validIds = valid.map((permission) => permission.id);
        await tx.portalRolePermission.deleteMany({ where: { roleId: id } });
        if (validIds.length) {
          await tx.portalRolePermission.createMany({
            data: validIds.map((permissionId) => ({
              roleId: id,
              permissionId,
              granted: true,
              assignedBy: auth.actorUserId,
            })),
            skipDuplicates: true,
          });
        }
      }

      const after = permissionIds
        ? permissionIds
        : before.map((row) => row.permissionId);

      await writePortalAudit(tx, auth, 'ROLE_UPDATED', 'PortalRole', id, {
        reason,
        beforePermissionIds: before.map((row) => row.permissionId),
        afterPermissionIds: after,
        ...(label !== undefined ? { label } : {}),
        ...(description !== undefined ? { description } : {}),
      }, request);

      return { beforeCount: before.length, afterCount: after.length };
    });

    return NextResponse.json({ success: true, roleId: id, ...result });
  } catch (error) {
    return unavailable('super-admin/roles/{id} PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
