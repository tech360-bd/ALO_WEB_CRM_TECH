import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const roles = await db.portalRole.findMany({
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { userRoles: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const allPermissions = await db.portalPermission.findMany();

      return NextResponse.json({
        success: true,
        data: {
          roles: roles.map(r => ({
            id: r.id,
            name: r.name,
            label: r.label,
            description: r.description,
            isSystem: r.isSystem,
            userCount: r._count.userRoles,
            permissions: r.permissions.map(rp => rp.permission),
          })),
          allPermissions,
        },
      });
    } catch (error) {
      console.error('Roles API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: { roles: [], allPermissions: [] } });
      }
      return NextResponse.json({ success: false, error: 'Failed to load roles' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { name, label, description = '', permissionIds = [] } = body;

      if (!name || !label) {
        return NextResponse.json({ success: false, error: 'Name and label are required' }, { status: 400 });
      }

      const existing = await db.portalRole.findUnique({ where: { name } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Role with this name already exists' }, { status: 409 });
      }

      const role = await db.portalRole.create({
        data: {
          name,
          label,
          description,
          permissions: {
            create: permissionIds.map((pid: string) => ({ permissionId: pid })),
          },
        },
      });

      await logAuditAction(auth, 'create_role', 'PortalRole', role.id, { name, label });

      return NextResponse.json({ success: true, data: role }, { status: 201 });
    } catch (error) {
      console.error('Roles POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { roleId, label, description, permissionIds } = body;

      if (!roleId) {
        return NextResponse.json({ success: false, error: 'Role ID is required' }, { status: 400 });
      }

      const role = await db.portalRole.update({
        where: { id: roleId },
        data: { label, description },
      });

      if (permissionIds && Array.isArray(permissionIds)) {
        await db.portalRolePermission.deleteMany({ where: { roleId } });
        for (const pid of permissionIds) {
          await db.portalRolePermission.create({ data: { roleId, permissionId: pid, granted: true } });
        }
      }

      await logAuditAction(auth, 'update_role', 'PortalRole', roleId, { label, permissionIds });

      return NextResponse.json({ success: true, data: role });
    } catch (error) {
      console.error('Roles PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
    }
  })(request);
}
