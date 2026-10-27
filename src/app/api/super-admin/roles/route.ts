// GET  /api/super-admin/roles  — RBAC role inventory with live assignment counts
// POST /api/super-admin/roles  — create a custom role, or clone an existing role
//
// Mutations require the real, non-acting Super Admin and are audited in the
// same transaction as the write.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, conflict, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

/** Roles the specification enumerates. Used for the "missing roles" report. */
const SPEC_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'HR_MANAGER', 'COUNSELOR',
  'SENIOR_COUNSELOR', 'APPLICATION_TEAM', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER',
  'FINANCE', 'MARKETING_MANAGER', 'MARKETING', 'FRONT_DESK', 'SUPPORT_STAFF',
  'PARTNER', 'STUDENT', 'ENGLISH_TEST_ONLY_STUDENT',
] as const;

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const [roles, permissionCount, userCount] = await Promise.all([
      db.portalRole.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { permissions: true, userRoles: true } },
          permissions: {
            where: { granted: true },
            select: { permission: { select: { module: true, feature: true, action: true } } },
          },
        },
      }),
      db.portalPermission.count(),
      db.portalUser.count(),
    ]);

    const present = new Set(roles.map((role) => role.name.toLowerCase()));
    const missingSpecRoles = SPEC_ROLES.filter((name) => !present.has(name.toLowerCase()));

    return NextResponse.json({
      success: true,
      totals: { roles: roles.length, permissions: permissionCount, users: userCount },
      missingSpecRoles,
      specRoles: [...SPEC_ROLES],
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        label: role.label,
        description: role.description,
        isSystem: role.isSystem,
        permissionCount: role._count.permissions,
        userCount: role._count.userRoles,
        modules: [...new Set(role.permissions.map((row) => row.permission.module))].sort(),
        createdAt: role.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/roles GET', error);
  }
}

const CreateRole = z.object({
  action: z.literal('create'),
  name: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_]+$/, 'Use letters, digits and underscore.'),
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  permissionIds: z.array(z.string().trim().min(1).max(191)).max(500).default([]),
  reason: z.string().trim().min(8).max(500),
}).strict();

const CloneRole = z.object({
  action: z.literal('clone'),
  sourceRoleId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_]+$/),
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  reason: z.string().trim().min(8).max(500),
}).strict();

const Body = z.discriminatedUnion('action', [CreateRole, CloneRole]);

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const input = parsed.data;

  try {
    const existing = await db.portalRole.findUnique({ where: { name: input.name } });
    if (existing) return conflict(`A role named ${input.name} already exists.`);

    const created = await db.$transaction(async (tx) => {
      const role = await tx.portalRole.create({
        data: {
          name: input.name,
          label: input.label,
          description: input.description,
          isSystem: false,
        },
      });

      let permissionIds: string[] = [];
      if (input.action === 'create') {
        permissionIds = input.permissionIds;
      } else {
        const source = await tx.portalRolePermission.findMany({
          where: { roleId: input.sourceRoleId, granted: true },
          select: { permissionId: true },
        });
        permissionIds = source.map((row) => row.permissionId);
      }

      if (permissionIds.length) {
        // Only grant permissions that actually exist.
        const valid = await tx.portalPermission.findMany({
          where: { id: { in: permissionIds } },
          select: { id: true },
        });
        await tx.portalRolePermission.createMany({
          data: valid.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
            granted: true,
            assignedBy: auth.actorUserId,
          })),
          skipDuplicates: true,
        });
      }

      await writePortalAudit(tx, auth, 'ROLE_CREATED', 'PortalRole', role.id, {
        reason: input.reason,
        name: role.name,
        label: role.label,
        clonedFrom: input.action === 'clone' ? input.sourceRoleId : null,
        permissionCount: permissionIds.length,
      }, request);

      return role;
    });

    return NextResponse.json({
      success: true,
      role: { id: created.id, name: created.name, label: created.label },
    }, { status: 201 });
  } catch (error) {
    return unavailable('super-admin/roles POST', error);
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
