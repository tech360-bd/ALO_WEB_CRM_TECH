import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS, type RoleName } from "@/lib/permissions";
import { withAuth, logAuditAction } from "@/lib/auth-middleware";

// ============================================================
// PERMISSION MANAGEMENT API — Reads from DB, writes with auth
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (request, auth) => {
    try {
      // Get all portal roles with their permissions from the database
      const roles = await db.portalRole.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Build permission matrix
      const roleNames = roles.map(r => r.name);
      const matrix = PERMISSION_CATALOG.map((p) => {
        const roleGrants: Record<string, boolean> = {};
        for (const role of roles) {
          const perm = role.permissions.find(rp => rp.permission.id === p.id);
          roleGrants[role.name] = perm?.granted ?? false;
        }
        return {
          id: p.id,
          module: p.module,
          feature: p.feature,
          action: p.action,
          description: p.description,
          ...roleGrants,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          permissions: matrix,
          roles: roleNames,
          dbRoles: roles.map(r => ({ id: r.id, name: r.name, label: r.label, description: r.description })),
          permissionCount: PERMISSION_CATALOG.length,
        },
      });
    } catch (error) {
      console.error('Permissions API error:', error);
      return NextResponse.json({ success: false, error: 'Failed to load permissions' }, { status: 500 });
    }
  })(request);
}

export async function PATCH(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      // Only super_admin can modify permissions
      if (!auth.roles.includes('super_admin')) {
        return NextResponse.json({ success: false, error: 'Only Super Admin can modify permissions' }, { status: 403 });
      }

      const body = await req.json();
      if (!body.roleId || !body.permissionId || typeof body.granted !== 'boolean') {
        return NextResponse.json(
          { success: false, error: "Missing required fields: roleId, permissionId, granted" },
          { status: 400 }
        );
      }

      // Upsert the role-permission mapping
      await db.portalRolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: body.roleId, permissionId: body.permissionId },
        },
        create: {
          roleId: body.roleId,
          permissionId: body.permissionId,
          granted: body.granted,
        },
        update: {
          granted: body.granted,
        },
      });

      await logAuditAction(auth, 'update_permission', 'RolePermission', `${body.roleId}:${body.permissionId}`, {
        granted: body.granted,
      });

      return NextResponse.json({
        success: true,
        message: `Permission ${body.permissionId} ${body.granted ? "granted" : "revoked"} for role ${body.roleId}`,
      });
    } catch (error) {
      console.error('Permission update error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update permission' }, { status: 500 });
    }
  })(request);
}
