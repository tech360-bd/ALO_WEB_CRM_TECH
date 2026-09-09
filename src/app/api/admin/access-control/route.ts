// ============================================================
// /api/admin/access-control
// GET  — List all PortalRoles with their permissions
// POST — Create a new role with permissions
// PUT  — Update role permissions
// DELETE — Remove a custom role (system roles protected)
// Requires: ADMIN or SUPER_ADMIN
// ============================================================

import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

// ------------------------------------------------------------
// GET: All roles with permissions
// ------------------------------------------------------------
async function handleGet(request: Request, auth: any) {
  try {
    const roles = await db.portalRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: {
          select: {
            id: true,
            granted: true,
            permission: {
              select: {
                id: true,
                module: true,
                feature: true,
                action: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    // Also fetch all available permissions for the UI
    const allPermissions = await db.portalPermission.findMany({
      orderBy: [{ module: 'asc' }, { feature: 'asc' }, { action: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: {
        roles,
        allPermissions,
      },
    });
  } catch (error: any) {
    console.error('Access control GET error:', error);
    if (error.message?.includes('Unknown table')) {
      return NextResponse.json({
        success: false,
        error: 'PortalRole or PortalPermission table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch access control data.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// POST: Create new role with permissions
// ------------------------------------------------------------
async function handlePost(request: Request, auth: any) {
  try {
    const body = await request.json();
    const { name, label, description, isSystem, permissionIds } = body;

    if (!name || !label) {
      return NextResponse.json(
        { success: false, error: 'Role name and label are required.' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.portalRole.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A role with this name already exists.' },
        { status: 409 }
      );
    }

    // Validate permission IDs exist
    if (permissionIds && permissionIds.length > 0) {
      const validPerms = await db.portalPermission.findMany({
        where: { id: { in: permissionIds } },
        select: { id: true },
      });
      const validIds = new Set(validPerms.map(p => p.id));
      const invalidIds = permissionIds.filter((id: string) => !validIds.has(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Some permission IDs are invalid.', invalidIds },
          { status: 400 }
        );
      }
    }

    // Create role with permissions
    const role = await db.portalRole.create({
      data: {
        name,
        label,
        description: description || '',
        isSystem: isSystem || false,
        permissions: permissionIds?.length
          ? { connect: permissionIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        permissions: true,
      },
    });

    await logAuditAction(auth, 'create_role', 'PortalRole', role.id, {
      name: role.name,
      label: role.label,
      permissionCount: role.permissions.length,
    });

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role created successfully.',
    });
  } catch (error: any) {
    console.error('Access control POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A role with this name already exists.' },
        { status: 409 }
      );
    }
    if (error.message?.includes('Unknown table')) {
      return NextResponse.json({
        success: false,
        error: 'PortalRole or PortalPermission table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create role.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// PUT: Update role permissions
// ------------------------------------------------------------
async function handlePut(request: Request, auth: any) {
  try {
    const body = await request.json();
    const { roleId, name, label, description, permissionIds } = body;

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'roleId is required.' },
        { status: 400 }
      );
    }

    // Check role exists
    const existingRole = await db.portalRole.findUnique({ where: { id: roleId } });
    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found.' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (label !== undefined) updateData.label = label;
    if (description !== undefined) updateData.description = description;

    // If permissionIds provided, validate and set them
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const validPerms = await db.portalPermission.findMany({
          where: { id: { in: permissionIds } },
          select: { id: true },
        });
        const validIds = new Set(validPerms.map(p => p.id));
        const invalidIds = permissionIds.filter((id: string) => !validIds.has(id));
        if (invalidIds.length > 0) {
          return NextResponse.json(
            { success: false, error: 'Some permission IDs are invalid.', invalidIds },
            { status: 400 }
          );
        }
      }
      updateData.permissions = {
        set: permissionIds.map((id: string) => ({ id })),
      };
    }

    const updatedRole = await db.portalRole.update({
      where: { id: roleId },
      data: updateData,
      include: {
        permissions: true,
      },
    });

    await logAuditAction(auth, 'update_role', 'PortalRole', roleId, {
      changes: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully.',
    });
  } catch (error: any) {
    console.error('Access control PUT error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A role with this name already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update role.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// DELETE: Remove a custom role (not system roles)
// ------------------------------------------------------------
async function handleDelete(request: Request, auth: any) {
  try {
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'roleId is required.' },
        { status: 400 }
      );
    }

    const role = await db.portalRole.findUnique({
      where: { id: roleId },
      include: {
        _count: { select: { userRoles: true } },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found.' },
        { status: 404 }
      );
    }

    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be deleted.' },
        { status: 403 }
      );
    }

    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete role with assigned users. Remove users first.' },
        { status: 409 }
      );
    }

    await db.portalRole.delete({ where: { id: roleId } });

    await logAuditAction(auth, 'delete_role', 'PortalRole', roleId, {
      name: role.name,
      label: role.label,
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully.',
    });
  } catch (error: any) {
    console.error('Access control DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete role.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// Route handlers with auth middleware
// ------------------------------------------------------------
export const GET = withAuth(handleGet, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
export const POST = withAuth(handlePost, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
export const PUT = withAuth(handlePut, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
export const DELETE = withAuth(handleDelete, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
