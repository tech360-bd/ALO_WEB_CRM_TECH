// GET   /api/super-admin/users/{id}/roles — current role set for a user
// PATCH /api/super-admin/users/{id}/roles — replace the role set
//
// This is the endpoint that lets a Super Admin add "Marketing Manager" to a
// Counselor, or "Visa Officer" to an Application Team member: roles are the
// coarse-grained lever, permission groups are the fine-grained one.
//
// Safety: a SUPER_ADMIN cannot remove its own SUPER_ADMIN role through this
// endpoint (that would be a self-lockout), and the actor's real user id must
// differ from the target when demoting a super admin.

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
    const user = await db.portalUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        status: true,
        roles: { select: { roleId: true, assignedAt: true, assignedBy: true, role: { select: { name: true, label: true } } } },
      },
    });
    if (!user) return notFound('User not found.');

    const [allRoles, groupGrants] = await Promise.all([
      db.portalRole.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, label: true } }),
      db.permissionGroupGrant.findMany({
        where: { ownerType: 'USER', ownerId: id },
        include: { group: { select: { key: true, name: true, riskLevel: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        status: user.status,
        roles: user.roles.map((row) => ({
          roleId: row.roleId,
          name: row.role.name,
          label: row.role.label,
          assignedAt: row.assignedAt.toISOString(),
          assignedBy: row.assignedBy,
        })),
      },
      availableRoles: allRoles,
      permissionGroupGrants: groupGrants.map((grant) => ({
        id: grant.id,
        groupKey: grant.group?.key || '',
        groupName: grant.group?.name || '',
        riskLevel: grant.group?.riskLevel || 'standard',
        expiresAt: grant.expiresAt?.toISOString() || null,
        isActive: grant.isActive,
      })),
    });
  } catch (error) {
    return unavailable('super-admin/users/{id}/roles GET', error);
  }
}

const Body = z.object({
  roleIds: z.array(z.string().trim().min(1).max(191)).max(20),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { roleIds, reason } = parsed.data;

  try {
    const user = await db.portalUser.findUnique({
      where: { id },
      include: { roles: { include: { role: { select: { name: true } } } } },
    });
    if (!user) return notFound('User not found.');

    const beforeNames = user.roles.map((row) => row.role.name);
    const targetRoles = await db.portalRole.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });
    if (targetRoles.length !== roleIds.length) {
      return badRequest('One or more role ids do not exist.');
    }
    const targetNames = targetRoles.map((role) => role.name);

    const isSelf = user.id === auth.actorUserId;
    const losesSuperAdmin = beforeNames.some((name) => name.toLowerCase() === 'super_admin')
      && !targetNames.some((name) => name.toLowerCase() === 'super_admin');
    if (isSelf && losesSuperAdmin) {
      return badRequest('You cannot remove the SUPER_ADMIN role from your own account.');
    }

    if (targetNames.length === 0) {
      return badRequest('A user must keep at least one role.');
    }

    await db.$transaction(async (tx) => {
      await tx.portalUserRole.deleteMany({ where: { userId: id } });
      await tx.portalUserRole.createMany({
        data: targetRoles.map((role) => ({
          userId: id,
          roleId: role.id,
          assignedBy: auth.actorUserId,
        })),
        skipDuplicates: true,
      });
      await writePortalAudit(tx, auth, 'USER_ROLES_CHANGED', 'PortalUser', id, {
        reason,
        before: beforeNames,
        after: targetNames,
        targetEmail: user.email,
      }, request);
    });

    return NextResponse.json({ success: true, userId: id, roles: targetNames });
  } catch (error) {
    return unavailable('super-admin/users/{id}/roles PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
