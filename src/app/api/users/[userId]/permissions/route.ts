import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth, { params }: { params: { userId: string } }) => {
  try {
    const { userId } = params;
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    const isSelf = auth.userId === userId;
    if (!isSuper && !isSelf) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });

    const user = await db.user.findUnique({ where: { id: userId } }).catch(() => null);
    const userRoles = await (db as any).userRole.findMany({ where: { userId } }).catch(() => []);
    const roleIds = userRoles.map((r: any) => r.roleId);
    const perms = await (db as any).rolePermission.findMany({ where: { roleId: { in: roleIds } } }).catch(() => []);
    const portalUser = await (db as any).portalUser.findUnique({ where: { id: userId } }).catch(() => null);
    const portalRoles = portalUser ? await (db as any).portalUserRole.findMany({ where: { userId } }).catch(() => []) : [];
    const portalRoleIds = portalRoles.map((r: any) => r.roleId);
    const portalPerms = await (db as any).portalRolePermission.findMany({ where: { roleId: { in: portalRoleIds } } }).catch(() => []);

    return NextResponse.json({ success: true, user: user || portalUser, permissions: [...perms, ...portalPerms], roles: [...userRoles, ...portalRoles] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PUT = withAuth(async (req, auth, { params }: { params: { userId: string } }) => {
  try {
    const { userId } = params;
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

    const body = await req.json();
    const { permissions, roleId } = body;

    for (const perm of permissions || []) {
      try {
        const targetRoleId = roleId || perm.roleId;
        if (!targetRoleId) continue;
        await (db as any).rolePermission.upsert({
          where: { roleId_permissionId: { roleId: targetRoleId, permissionId: perm.permissionId } },
          update: { granted: perm.allowed },
          create: { roleId: targetRoleId, permissionId: perm.permissionId, granted: perm.allowed },
        });
      } catch {
        try {
          const targetRoleId = roleId || perm.roleId;
          if (!targetRoleId) continue;
          await (db as any).portalRolePermission.upsert({
            where: { roleId_permissionId: { roleId: targetRoleId, permissionId: perm.permissionId } },
            update: { granted: perm.allowed },
            create: { roleId: targetRoleId, permissionId: perm.permissionId, granted: perm.allowed },
          });
        } catch {}
      }
    }

    return NextResponse.json({ success: true, message: 'Updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
