import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const userType = searchParams.get('userType') || '';
      const status = searchParams.get('status') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { email: { contains: search } },
          { name: { contains: search } },
          { phone: { contains: search } },
        ];
      }
      if (userType) where.userType = userType;
      if (status) where.status = status;

      const [total, users] = await Promise.all([
        db.portalUser.count({ where }),
        db.portalUser.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            roles: {
              include: { role: { select: { name: true, label: true } } },
            },
            studentProfile: { select: { studentId: true, fullName: true } },
            employeeProfile: { select: { employeeId: true, department: true, designation: true } },
            partnerProfile: { select: { partnerId: true, companyName: true } },
          },
        }),
      ]);

      const data = users.map(u => ({
        ...u,
        passwordHash: undefined,
        roles: u.roles.map(ur => ur.role),
      }));

      return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      console.error('Users API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      }
      return NextResponse.json({ success: false, error: 'Failed to load users' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { email, name, phone, password, userType = 'STUDENT', roleIds } = body;

      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
      }

      const existing = await db.portalUser.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await db.portalUser.create({
        data: { email, name: name || '', phone: phone || '', passwordHash, userType },
      });

      if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
        for (const roleId of roleIds) {
          await db.portalUserRole.create({ data: { userId: user.id, roleId, assignedBy: auth.userId } });
        }
      }

      await logAuditAction(auth, 'create_user', 'PortalUser', user.id, { email, userType });

      return NextResponse.json({ success: true, data: { id: user.id, email, name, userType } }, { status: 201 });
    } catch (error) {
      console.error('Users POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { userId, name, phone, status, password } = body;

      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (status !== undefined) updateData.status = status;
      if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

      const user = await db.portalUser.update({
        where: { id: userId },
        data: updateData,
      });

      await logAuditAction(auth, 'update_user', 'PortalUser', userId, updateData);

      return NextResponse.json({ success: true, data: { id: user.id, email: user.email, name: user.name, status: user.status } });
    } catch (error) {
      console.error('Users PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
  })(request);
}
