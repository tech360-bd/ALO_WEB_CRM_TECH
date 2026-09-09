// ============================================================
// /api/admin/users
// GET  — All PortalUsers with roles, status. Filters: userType, status, search
// POST — Create a new portal user
// PUT  — Update user (status, roles)
// Requires: ADMIN or SUPER_ADMIN
// ============================================================

import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// ------------------------------------------------------------
// GET: All users with filters
// ------------------------------------------------------------
async function handleGet(request: Request, auth: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (userType) where.userType = userType;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.portalUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          avatar: true,
          userType: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.portalUser.count({ where }),
    ]);

    // Flatten roles
    const formattedUsers = users.map(user => ({
      ...user,
      roles: user.roles.map(ur => ur.role),
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    if (error.message?.includes('Unknown table')) {
      return NextResponse.json({
        success: false,
        error: 'PortalUser table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// POST: Create a new user
// ------------------------------------------------------------
async function handlePost(request: Request, auth: any) {
  try {
    const body = await request.json();
    const { email, phone, name, password, avatar, userType, status, roleIds } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      );
    }

    // Check for existing email
    const existing = await db.portalUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    // Validate role IDs
    if (roleIds && roleIds.length > 0) {
      const validRoles = await db.portalRole.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });
      const validIds = new Set(validRoles.map(r => r.id));
      const invalidIds = roleIds.filter((id: string) => !validIds.has(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Some role IDs are invalid.', invalidIds },
          { status: 400 }
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await db.portalUser.create({
      data: {
        email: email.toLowerCase().trim(),
        phone: phone || '',
        name: name.trim(),
        passwordHash,
        avatar: avatar || '',
        userType: userType || 'STUDENT',
        status: status || 'active',
        roles: roleIds?.length
          ? {
              create: roleIds.map((roleId: string) => ({
                roleId,
                assignedBy: auth.userId,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        userType: true,
        status: true,
        createdAt: true,
        roles: {
          select: {
            role: { select: { id: true, name: true, label: true } },
          },
        },
      },
    });

    await logAuditAction(auth, 'create_user', 'PortalUser', user.id, {
      email: user.email,
      name: user.name,
      userType: user.userType,
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully.',
    });
  } catch (error: any) {
    console.error('Admin users POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 }
      );
    }
    if (error.message?.includes('Unknown table')) {
      return NextResponse.json({
        success: false,
        error: 'PortalUser table not found. Run schema migration.',
      }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create user.' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------
// PUT: Update user (status, roles)
// ------------------------------------------------------------
async function handlePut(request: Request, auth: any) {
  try {
    const body = await request.json();
    const { userId, name, phone, avatar, userType, status, roleIds, password } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required.' },
        { status: 400 }
      );
    }

    // Check user exists
    const existing = await db.portalUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (userType !== undefined) updateData.userType = userType;
    if (status !== undefined) updateData.status = status;

    // Handle password change
    if (password) {
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    // Update user base fields
    const updatedUser = await db.portalUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        userType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Handle role updates if provided
    if (roleIds !== undefined) {
      // Validate role IDs
      if (roleIds.length > 0) {
        const validRoles = await db.portalRole.findMany({
          where: { id: { in: roleIds } },
          select: { id: true },
        });
        const validIds = new Set(validRoles.map(r => r.id));
        const invalidIds = roleIds.filter((id: string) => !validIds.has(id));
        if (invalidIds.length > 0) {
          return NextResponse.json(
            { success: false, error: 'Some role IDs are invalid.', invalidIds },
            { status: 400 }
          );
        }
      }

      // Delete existing role assignments and create new ones
      await db.portalUserRole.deleteMany({ where: { userId } });

      if (roleIds.length > 0) {
        await db.portalUserRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId,
            roleId,
            assignedBy: auth.userId,
          })),
        });
      }
    }

    // Fetch updated user with roles
    const finalUser = await db.portalUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        userType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: { select: { id: true, name: true, label: true } },
          },
        },
      },
    });

    await logAuditAction(auth, 'update_user', 'PortalUser', userId, {
      changes: Object.keys(updateData),
      roleUpdated: roleIds !== undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...finalUser,
        roles: finalUser?.roles.map(ur => ur.role) || [],
      },
      message: 'User updated successfully.',
    });
  } catch (error: any) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user.' },
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
