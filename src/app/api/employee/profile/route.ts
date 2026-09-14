import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE PROFILE API
// GET  — Fetch employee profile (EmployeeProfile + PortalUser)
// PUT  — Update profile fields
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    try {
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              avatar: true,
              userType: true,
              status: true,
            },
          },
        },
      });

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Employee profile not found' },
          { status: 404 }
        );
      }

      // Also fetch the Employee record for enriched data
      type EmployeeRecord = Awaited<ReturnType<typeof db.employee.findUnique>>;
      let employee: EmployeeRecord = null;
      try {
        employee = await db.employee.findUnique({
          where: { userId: auth.userId },
        });
      } catch {
        // Employee table may not exist yet
      }

      return NextResponse.json({
        success: true,
        data: {
          ...profile,
          employee,
        },
      });
    } catch (error) {
      console.error('Employee profile GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: null });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load employee profile' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const {
        department,
        designation,
        branch,
        joinDate,
        emergencyContact,
        name,
        phone,
        avatar,
      } = body;

      // Check profile exists
      const existing = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Employee profile not found' },
          { status: 404 }
        );
      }

      // Update EmployeeProfile fields
      const updatedProfile = await db.employeeProfile.update({
        where: { userId: auth.userId },
        data: {
          ...(department !== undefined && { department }),
          ...(designation !== undefined && { designation }),
          ...(branch !== undefined && { branch }),
          ...(joinDate !== undefined && { joinDate }),
          ...(emergencyContact !== undefined && { emergencyContact }),
          updatedAt: new Date(),
        },
      });

      // Update PortalUser fields if provided
      if (name || phone || avatar) {
        await db.portalUser.update({
          where: { id: auth.userId },
          data: {
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone }),
            ...(avatar !== undefined && { avatar }),
            updatedAt: new Date(),
          },
        });
      }

      await logAuditAction(auth, 'update_profile', 'EmployeeProfile', existing.id, {
        fields: Object.keys(body),
      });

      return NextResponse.json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Employee profile PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update employee profile' },
        { status: 500 }
      );
    }
  })(request);
}
