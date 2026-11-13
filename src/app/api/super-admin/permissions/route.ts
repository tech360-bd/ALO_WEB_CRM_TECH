// GET /api/super-admin/permissions — the permission matrix source.
//
// Returns every permission with each role's grant state, so the matrix view
// is driven by real role_permission rows rather than a hardcoded grid.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const [permissions, roles, grants] = await Promise.all([
      db.portalPermission.findMany({ orderBy: [{ module: 'asc' }, { feature: 'asc' }, { action: 'asc' }] }),
      db.portalRole.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, label: true } }),
      db.portalRolePermission.findMany({ where: { granted: true }, select: { roleId: true, permissionId: true } }),
    ]);

    const grantedSet = new Set(grants.map((grant) => `${grant.roleId}:${grant.permissionId}`));

    const modules = new Map<string, { module: string; permissions: Array<{ id: string; feature: string; action: string; description: string; roleGrants: Record<string, boolean> }> }>();
    for (const permission of permissions) {
      if (!modules.has(permission.module)) {
        modules.set(permission.module, { module: permission.module, permissions: [] });
      }
      const roleGrants: Record<string, boolean> = {};
      for (const role of roles) {
        roleGrants[role.id] = grantedSet.has(`${role.id}:${permission.id}`);
      }
      modules.get(permission.module)!.permissions.push({
        id: permission.id,
        feature: permission.feature,
        action: permission.action,
        description: permission.description,
        roleGrants,
      });
    }

    return NextResponse.json({
      success: true,
      roles,
      modules: [...modules.values()],
      totals: { permissions: permissions.length, roles: roles.length, grants: grants.length },
    });
  } catch (error) {
    console.error('[super-admin/permissions] failed', error);
    return NextResponse.json({ success: false, error: 'Permission matrix is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
