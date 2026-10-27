// GET   /api/super-admin/users/{id}/permissions — effective permission set
// PATCH /api/super-admin/users/{id}/permissions — allow / deny / clear overrides
//
// Effective set = (permissions granted by the user's roles) ∪ ALLOW overrides − DENY
// overrides. DENY always wins: a user with `students.view.list` from their role
// and a DENY row on the same key does not have it.
//
// Overrides live in `user_permission_overrides` (one row per key) so each has a
// reason, an author and a timestamp — which is what makes the rollback endpoint
// able to restore a previous state truthfully.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const KEY_PATTERN = /^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$/;

async function loadUser(userId: string) {
  return db.portalUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
      status: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
              permissions: {
                where: { granted: true },
                select: { permission: { select: { module: true, feature: true, action: true } } },
              },
            },
          },
        },
      },
    },
  });
}

async function loadOverrides(userId: string) {
  const rows = await db.userPermissionOverride.findMany({
    where: { userId },
    orderBy: [{ effect: 'asc' }, { permissionKey: 'asc' }],
    select: { permissionKey: true, effect: true, reason: true, createdBy: true, updatedAt: true },
  }).catch(() => [] as Array<{ permissionKey: string; effect: string; reason: string; createdBy: string; updatedAt: Date }>);
  return rows;
}

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const user = await loadUser(id);
    if (!user) return notFound('User not found.');

    const fromRoles = new Set<string>();
    for (const row of user.roles) {
      for (const grant of row.role.permissions) {
        fromRoles.add(`${grant.permission.module}.${grant.permission.feature}.${grant.permission.action}`);
      }
    }

    const overrides = await loadOverrides(id);
    const allow = overrides.filter((row) => row.effect === 'ALLOW');
    const deny = overrides.filter((row) => row.effect === 'DENY');

    const effective = new Set([...fromRoles, ...allow.map((row) => row.permissionKey)]);
    for (const row of deny) effective.delete(row.permissionKey);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, userType: user.userType, status: user.status },
      roles: user.roles.map((row) => row.role.name),
      rolePermissions: [...fromRoles].sort(),
      overrides: {
        allow: allow.map((row) => ({ key: row.permissionKey, reason: row.reason, by: row.createdBy, at: row.updatedAt.toISOString() })),
        deny: deny.map((row) => ({ key: row.permissionKey, reason: row.reason, by: row.createdBy, at: row.updatedAt.toISOString() })),
      },
      effectivePermissions: [...effective].sort(),
      counts: { fromRoles: fromRoles.size, allow: allow.length, deny: deny.length, effective: effective.size },
      rule: 'effective = role grants ∪ ALLOW − DENY (DENY wins).',
    });
  } catch (error) {
    return unavailable('super-admin/users/{id}/permissions GET', error);
  }
}

const Body = z.object({
  action: z.enum(['allow', 'deny', 'clear']),
  permissionKeys: z.array(
    z.string().trim().min(5).max(191).regex(KEY_PATTERN, 'Use module.feature.action'),
  ).min(1).max(200),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { action, permissionKeys, reason } = parsed.data;

  try {
    const user = await db.portalUser.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!user) return notFound('User not found.');

    const before = await loadOverrides(id);
    const beforeSnapshot = {
      allow: before.filter((row) => row.effect === 'ALLOW').map((row) => row.permissionKey),
      deny: before.filter((row) => row.effect === 'DENY').map((row) => row.permissionKey),
    };

    await db.$transaction(async (tx) => {
      if (action === 'clear') {
        await tx.userPermissionOverride.deleteMany({ where: { userId: id, permissionKey: { in: permissionKeys } } });
      } else {
        const effect = action === 'allow' ? 'ALLOW' : 'DENY';
        for (const permissionKey of permissionKeys) {
          await tx.userPermissionOverride.upsert({
            where: { userId_permissionKey: { userId: id, permissionKey } },
            create: { userId: id, permissionKey, effect, reason, createdBy: auth.actorUserId, updatedBy: auth.actorUserId },
            update: { effect, reason, updatedBy: auth.actorUserId },
          });
        }
      }
      const after = await tx.userPermissionOverride.findMany({
        where: { userId: id },
        select: { permissionKey: true, effect: true },
      });
      await writePortalAudit(tx, auth, 'USER_PERMISSION_OVERRIDE', 'PortalUser', id, {
        reason,
        action,
        permissionKeys,
        before: beforeSnapshot,
        after: {
          allow: after.filter((row) => row.effect === 'ALLOW').map((row) => row.permissionKey),
          deny: after.filter((row) => row.effect === 'DENY').map((row) => row.permissionKey),
        },
      }, request);
    });

    return NextResponse.json({
      success: true,
      userId: id,
      action,
      changed: permissionKeys.length,
      note: 'Overrides take effect on the next authorisation check; no re-login is required.',
    });
  } catch (error) {
    return unavailable('super-admin/users/{id}/permissions PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
