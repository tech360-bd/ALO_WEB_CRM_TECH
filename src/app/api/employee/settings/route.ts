import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE SETTINGS API
// GET  — Return user settings (profile, notification preferences, privacy mode)
// PUT  — Update password, notification preferences, privacy mode
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    try {
      const user = await db.portalUser.findUnique({
        where: { id: auth.userId },
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
          firstLoginRequired: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Get employee profile for additional settings
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });

      // Get employee record for privacy mode
      type EmployeeRecord = Awaited<ReturnType<typeof db.employee.findUnique>>;
      let employee: EmployeeRecord = null;
      try {
        employee = await db.employee.findUnique({
          where: { userId: auth.userId },
        });
      } catch {
        // Employee table may not exist
      }

      return NextResponse.json({
        success: true,
        data: {
          user,
          profile,
          privacyModeOn: employee?.privacyModeOn ?? true,
          isOnline: employee?.isOnline ?? false,
        },
      });
    } catch (error) {
      console.error('Employee settings GET error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load settings' },
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
        currentPassword,
        newPassword,
        privacyModeOn,
        isOnline,
        name,
        phone,
        avatar,
        department,
        designation,
        branch,
        emergencyContact,
      } = body;

      const updates: Record<string, unknown> = {};
      const profileUpdates: Record<string, unknown> = {};
      let passwordChanged = false;

      // ---- PASSWORD CHANGE ----
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: 'Current password is required to change password' },
            { status: 400 }
          );
        }

        const user = await db.portalUser.findUnique({
          where: { id: auth.userId },
          select: { passwordHash: true },
        });

        if (!user || !user.passwordHash) {
          return NextResponse.json(
            { success: false, error: 'Account not properly configured' },
            { status: 400 }
          );
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Current password is incorrect' },
            { status: 401 }
          );
        }

        if (newPassword.length < 8) {
          return NextResponse.json(
            { success: false, error: 'New password must be at least 8 characters' },
            { status: 400 }
          );
        }

        updates.passwordHash = await bcrypt.hash(newPassword, 12);
        passwordChanged = true;
      }

      // ---- PROFILE UPDATES ----
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (avatar !== undefined) updates.avatar = avatar;

      if (department !== undefined) profileUpdates.department = department;
      if (designation !== undefined) profileUpdates.designation = designation;
      if (branch !== undefined) profileUpdates.branch = branch;
      if (emergencyContact !== undefined) profileUpdates.emergencyContact = emergencyContact;

      // Apply PortalUser updates if any
      if (Object.keys(updates).length > 0) {
        await db.portalUser.update({
          where: { id: auth.userId },
          data: { ...updates, updatedAt: new Date() },
        });
      }

      // Apply EmployeeProfile updates if any
      if (Object.keys(profileUpdates).length > 0) {
        await db.employeeProfile.update({
          where: { userId: auth.userId },
          data: { ...profileUpdates, updatedAt: new Date() },
        });
      }

      // ---- PRIVACY MODE & ONLINE STATUS ----
      if (privacyModeOn !== undefined || isOnline !== undefined) {
        try {
          const empData: Record<string, unknown> = { updatedAt: new Date() };
          if (privacyModeOn !== undefined) empData.privacyModeOn = privacyModeOn;
          if (isOnline !== undefined) empData.isOnline = isOnline;

          await db.employee.update({
            where: { userId: auth.userId },
            data: empData,
          });
        } catch {
          // Employee table may not exist - try EmployeeProfile as fallback
          // These fields only exist on Employee model, silently skip
        }
      }

      await logAuditAction(auth, 'update_settings', 'PortalUser', auth.userId, {
        passwordChanged,
        privacyModeOn,
        profileFieldsUpdated: Object.keys(updates).length,
      });

      return NextResponse.json({
        success: true,
        message: passwordChanged
          ? 'Password updated successfully. Please log in again.'
          : 'Settings updated successfully',
      });
    } catch (error) {
      console.error('Employee settings PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  })(request);
}
