// GET /api/super-admin/roles — RBAC role inventory with live assignment counts.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      success: true,
      totals: { roles: roles.length, permissions: permissionCount, users: userCount },
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
    console.error('[super-admin/roles] failed', error);
    return NextResponse.json({ success: false, error: 'Role inventory is temporarily unavailable.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
