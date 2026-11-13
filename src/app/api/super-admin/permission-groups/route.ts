// GET  /api/super-admin/permission-groups — catalogue + live grants
// POST /api/super-admin/permission-groups — create/update a group, or
//       assign / revoke a group for a role or an individual employee.
//
// Every mutation is written together with its audit row (single
// transaction) and is refused while Acting-As mode is active, so an
// impersonated employee session can never widen its own access.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { PERMISSION_GROUP_CATALOG, findGroupDefinition } from '@/lib/super-admin/permission-groups';

export const dynamic = 'force-dynamic';

const MAX_TEMPORARY_DAYS = 90;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    type GroupRow = Awaited<ReturnType<typeof db.permissionGroup.findMany>>[number];
    type GrantRow = { id: string; ownerType: string; ownerId: string; expiresAt: Date | null; isActive: boolean; group: { key: string } | null };

    const [groups, grants] = await Promise.all([
      safe<GroupRow[]>(() => db.permissionGroup.findMany({ orderBy: { name: 'asc' } }), []),
      safe<GrantRow[]>(() => db.permissionGroupGrant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { group: { select: { key: true } } },
      }), []),
    ]);

    const persistedByKey = new Map(groups.map((group) => [group.key, group]));
    const now = new Date();

    const catalogue = PERMISSION_GROUP_CATALOG.map((definition) => {
      const persisted = persistedByKey.get(definition.key);
      return {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        department: definition.department,
        riskLevel: definition.riskLevel,
        permissionCount: definition.permissions.length,
        permissions: definition.permissions,
        persisted: Boolean(persisted),
        isActive: persisted?.isActive ?? true,
        grants: grants
          .filter((grant) => grant.group?.key === definition.key)
          .map((grant) => ({
            id: grant.id,
            ownerType: grant.ownerType,
            ownerId: grant.ownerId,
            expiresAt: grant.expiresAt?.toISOString() || null,
            expired: grant.expiresAt ? grant.expiresAt.getTime() <= now.getTime() : false,
            isActive: grant.isActive,
          })),
      };
    });

    // Groups created by an operator that are not in the shipped catalogue.
    const customGroups = groups
      .filter((group) => !findGroupDefinition(group.key))
      .map((group) => ({
        key: group.key,
        name: group.name,
        description: group.description,
        department: group.department,
        riskLevel: group.riskLevel,
        permissionCount: JSON.parse(group.permissions || '[]').length,
        permissions: JSON.parse(group.permissions || '[]') as string[],
        persisted: true,
        isActive: group.isActive,
        grants: [] as Array<{ id: string; ownerType: string; ownerId: string; expiresAt: string | null; expired: boolean; isActive: boolean }>,
      }));

    return NextResponse.json({
      success: true,
      totals: {
        groups: catalogue.length + customGroups.length,
        persistedGroups: groups.length,
        activeGrants: grants.filter((grant) => grant.isActive).length,
      },
      groups: [...catalogue, ...customGroups],
    });
  } catch (error) {
    console.error('[super-admin/permission-groups GET] failed', error);
    return NextResponse.json({ success: false, error: 'Permission groups are temporarily unavailable.' }, { status: 503 });
  }
}

const Base = {
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
};

const UpsertGroup = z.object({
  action: z.literal('upsert_group'),
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9_]+$/, 'Use lower_snake_case keys.'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).default(''),
  department: z.string().trim().max(120).default(''),
  riskLevel: z.enum(['standard', 'sensitive', 'critical']).default('standard'),
  permissions: z.array(z.string().trim().regex(/^[a-z0-9_]+\.[a-z0-9_]+\.[a-z0-9_]+$/)).min(1).max(500),
  ...Base,
}).strict();

const AssignGroup = z.object({
  action: z.literal('assign'),
  groupKey: z.string().trim().min(2).max(80),
  ownerType: z.enum(['ROLE', 'USER']),
  ownerId: z.string().trim().min(1).max(191),
  expiresInDays: z.number().int().min(1).max(MAX_TEMPORARY_DAYS).optional(),
  ...Base,
}).strict();

const RevokeGroup = z.object({
  action: z.literal('revoke'),
  grantId: z.string().trim().min(1).max(191),
  ...Base,
}).strict();

const Body = z.discriminatedUnion('action', [UpsertGroup, AssignGroup, RevokeGroup]);

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    if (input.action === 'upsert_group') {
      const group = await db.$transaction(async (tx) => {
        const previous = await tx.permissionGroup.findUnique({ where: { key: input.key } });
        const saved = await tx.permissionGroup.upsert({
          where: { key: input.key },
          update: {
            name: input.name,
            description: input.description,
            department: input.department,
            riskLevel: input.riskLevel,
            permissions: JSON.stringify(input.permissions),
          },
          create: {
            key: input.key,
            name: input.name,
            description: input.description,
            department: input.department,
            riskLevel: input.riskLevel,
            permissions: JSON.stringify(input.permissions),
            createdBy: auth.actorUserId,
          },
        });
        await writePortalAudit(tx, auth, 'PERMISSION_GROUP_SAVED', 'PermissionGroup', saved.id, {
          reason: input.reason,
          key: input.key,
          riskLevel: input.riskLevel,
          before: previous ? { name: previous.name, permissions: previous.permissions } : null,
          after: { name: saved.name, permissions: saved.permissions },
        }, request);
        return saved;
      });
      return NextResponse.json({ success: true, group: { id: group.id, key: group.key, name: group.name } });
    }

    if (input.action === 'assign') {
      const definition = findGroupDefinition(input.groupKey);
      const persisted = await db.permissionGroup.findUnique({ where: { key: input.groupKey } });
      if (!definition && !persisted) {
        return NextResponse.json({ success: false, error: 'Permission group not found.' }, { status: 404 });
      }

      // The owner must exist — a grant to a phantom id is not a grant.
      if (input.ownerType === 'ROLE') {
        const role = await db.portalRole.findUnique({ where: { id: input.ownerId } }).catch(() => null);
        if (!role) {
          return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
        }
      } else {
        const user = await db.portalUser.findUnique({ where: { id: input.ownerId } }).catch(() => null);
        if (!user) {
          return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
        }
      }

      // Materialise the catalogue group so the grant has a real parent row.
      const group = persisted ?? await db.permissionGroup.create({
        data: {
          key: definition!.key,
          name: definition!.name,
          description: definition!.description,
          department: definition!.department,
          riskLevel: definition!.riskLevel,
          permissions: JSON.stringify(definition!.permissions),
          isSystem: true,
          createdBy: auth.actorUserId,
        },
      });

      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const grant = await db.$transaction(async (tx) => {
        const saved = await tx.permissionGroupGrant.upsert({
          where: {
            groupId_ownerType_ownerId: {
              groupId: group.id,
              ownerType: input.ownerType,
              ownerId: input.ownerId,
            },
          },
          update: {
            grantedBy: auth.actorUserId,
            reason: input.reason,
            expiresAt,
            isActive: true,
            revokedAt: null,
            revokedBy: '',
          },
          create: {
            groupId: group.id,
            ownerType: input.ownerType,
            ownerId: input.ownerId,
            grantedBy: auth.actorUserId,
            reason: input.reason,
            expiresAt,
          },
        });
        await writePortalAudit(tx, auth, 'PERMISSION_GROUP_ASSIGNED', 'PermissionGroupGrant', saved.id, {
          reason: input.reason,
          groupKey: group.key,
          riskLevel: group.riskLevel,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          expiresAt: expiresAt?.toISOString() || null,
        }, request);
        return saved;
      });

      return NextResponse.json({
        success: true,
        grant: {
          id: grant.id,
          groupKey: group.key,
          ownerType: grant.ownerType,
          ownerId: grant.ownerId,
          expiresAt: grant.expiresAt?.toISOString() || null,
        },
      });
    }

    // revoke
    const existing = await db.permissionGroupGrant.findUnique({ where: { id: input.grantId } })
      .catch(() => null);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Grant not found.' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.permissionGroupGrant.update({
        where: { id: input.grantId },
        data: { isActive: false, revokedAt: new Date(), revokedBy: auth.actorUserId },
      });
      await writePortalAudit(tx, auth, 'PERMISSION_GROUP_REVOKED', 'PermissionGroupGrant', input.grantId, {
        reason: input.reason,
        before: { ownerType: existing.ownerType, ownerId: existing.ownerId, isActive: existing.isActive },
      }, request);
    });

    return NextResponse.json({ success: true, revoked: input.grantId });
  } catch (error) {
    console.error('[super-admin/permission-groups POST] failed', error);
    return NextResponse.json(
      { success: false, error: 'Permission change could not be applied and audited.' },
      { status: 503 },
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
