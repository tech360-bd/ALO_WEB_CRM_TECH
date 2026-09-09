// ============================================================
// GET /api/portal-auth/session
// Return current session info: user details, roles, permissions
// Uses authenticateRequest directly to validate token.
// ============================================================

import { authenticateRequest } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Validate the session token from Authorization header
    const authResult = await authenticateRequest(request);

    // If authenticateRequest returned a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const auth = authResult;

    // Fetch full user profile with roles and permissions
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
        firstLoginRequired: true,
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
                description: true,
                isSystem: true,
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
              },
            },
          },
        },
        studentProfile: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            profileCompletion: true,
            journeyStage: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            designation: true,
            branch: true,
          },
        },
        partnerProfile: {
          select: {
            id: true,
            partnerId: true,
            companyName: true,
            approvalStatus: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    // Flatten roles and permissions for easy consumption
    const roles = user.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      label: ur.role.label,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
    }));

    const allPermissions = user.roles.flatMap(ur =>
      ur.role.permissions
        .filter(rp => rp.granted)
        .map(rp => rp.permission)
    );

    // Also count active sessions for the user
    const activeSessionCount = await db.portalSession.count({
      where: {
        userId: auth.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          userType: user.userType,
          status: user.status,
          firstLoginRequired: user.firstLoginRequired,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          studentProfile: user.studentProfile || null,
          employeeProfile: user.employeeProfile || null,
          partnerProfile: user.partnerProfile || null,
        },
        roles,
        permissions: allPermissions,
        sessionId: auth.sessionId,
        activeSessionCount,
      },
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
