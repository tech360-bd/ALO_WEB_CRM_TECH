// ============================================================
// ALO EDUCATION — RBAC Auth Middleware for API Routes
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  userType: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  branch?: string;
  
  // Actor info for audit logs (especially when actingAs is used)
  actorUserId: string;
  actorEmail: string;
  actorName: string;
}

// ============================================================
// Extract and validate session from Authorization header
// ============================================================
export async function authenticateRequest(request: Request): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Please login.' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  // Look up session in database
  const session = await db.portalSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired session. Please login again.' },
      { status: 401 }
    );
  }

  // Check if session is revoked
  if (session.revokedAt) {
    return NextResponse.json(
      { success: false, error: 'Session has been revoked. Please login again.' },
      { status: 401 }
    );
  }

  // Check if session is expired
  if (new Date() > session.expiresAt) {
    return NextResponse.json(
      { success: false, error: 'Session has expired. Please login again.' },
      { status: 401 }
    );
  }

  // Check if user is active
  if (session.user.status !== 'active') {
    return NextResponse.json(
      { success: false, error: 'Account is not active.', error_code: `account_${session.user.status}` },
      { status: 403 }
    );
  }

  // Base user (Actor) info
  let actingUserId = session.user.id;
  let actingEmail = session.user.email;
  let actingName = session.user.name;
  let actingUserType = session.user.userType;
  let roles = session.user.roles.map(ur => ur.role.name);
  let permissions = session.user.roles.flatMap(ur =>
    ur.role.permissions
      .filter(rp => rp.granted)
      .map(rp => rp.permission.id)
  );

  // Handle "actingAs" logic if requested and if user is super_admin
  const actingAsUserId = request.headers.get('x-acting-as-user');
  if (actingAsUserId && roles.includes('super_admin')) {
    const actingAsUser = await db.portalUser.findUnique({
      where: { id: actingAsUserId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (actingAsUser && actingAsUser.status === 'active') {
      actingUserId = actingAsUser.id;
      actingEmail = actingAsUser.email;
      actingName = actingAsUser.name;
      actingUserType = actingAsUser.userType;
      roles = actingAsUser.roles.map(ur => ur.role.name);
      permissions = actingAsUser.roles.flatMap(ur =>
        ur.role.permissions
          .filter(rp => rp.granted)
          .map(rp => rp.permission.id)
      );
    }
  }

  return {
    userId: actingUserId,
    email: actingEmail,
    name: actingName,
    userType: actingUserType,
    roles,
    permissions,
    sessionId: session.id,
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
  };
}

// ============================================================
// withAuth — Higher-order wrapper for protected API routes
// ============================================================
type AuthenticatedHandler = (
  request: Request,
  auth: AuthContext,
  context?: any
) => Promise<NextResponse<any>>;

export function withAuth(
  handler: AuthenticatedHandler,
  options?: {
    requireRoles?: string[];
    requirePermissions?: string[];
    requireUserTypes?: string[];
  }
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request);

    // If authenticateRequest returned a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const auth = authResult as AuthContext;

    // Super Admin or Admin userType bypasses all role/permission checks upfront (Fixes Problem 9)
    if (
      auth.userType === 'SUPER_ADMIN' ||
      auth.userType === 'ADMIN' ||
      auth.roles.includes('super_admin') ||
      auth.roles.includes('admin') ||
      auth.roles.includes('SUPER_ADMIN')
    ) {
      return handler(request, auth, context);
    }

    // Check user type restrictions
    if (options?.requireUserTypes?.length) {
      if (!options.requireUserTypes.includes(auth.userType)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient access level.' },
          { status: 403 }
        );
      }
    }

    // Check role restrictions
    if (options?.requireRoles?.length) {
      const hasRole = options.requireRoles.some(r => auth.roles.includes(r));
      if (!hasRole) {
        return NextResponse.json(
          { success: false, error: 'Insufficient role permissions.' },
          { status: 403 }
        );
      }
    }

    // Check permission restrictions
    if (options?.requirePermissions?.length) {
      const hasAllPerms = options.requirePermissions.every(p => auth.permissions.includes(p));
      if (!hasAllPerms) {
        return NextResponse.json(
          { success: false, error: 'Missing required permissions.' },
          { status: 403 }
        );
      }
    }

    return handler(request, auth, context);
  };
}


// ============================================================
// Ownership check — ensure user owns the resource
// ============================================================
export async function checkOwnership(
  auth: AuthContext,
  resourceUserId: string,
  options?: {
    allowRoles?: string[];  // Roles that can access any resource
  }
): Promise<boolean> {
  // User accessing their own resource
  if (auth.userId === resourceUserId) return true;

  // Super admin can access anything
  if (auth.roles.includes('super_admin')) return true;

  // Specific roles can access any resource
  if (options?.allowRoles?.some(r => auth.roles.includes(r))) return true;

  return false;
}

// ============================================================
// Log action to audit trail
// ============================================================
export async function logAuditAction(
  auth: AuthContext,
  action: string,
  entityType: string = '',
  entityId: string = '',
  metadata: Record<string, unknown> = {}
) {
  try {
    // If acting on behalf of someone, log both acting user and actual actor
    const finalMetadata = auth.actorUserId !== auth.userId 
      ? { ...metadata, actingAsUser: auth.userId }
      : metadata;

    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId, // True actor always logged
        action,
        entityType,
        entityId,
        metadata: JSON.stringify(finalMetadata),
        ipAddress: '',
        userAgent: '',
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// ============================================================
// Extract optional AuthContext (returns null if unauthenticated)
// ============================================================
export async function getOptionalAuth(request: Request): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const session = await db.portalSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!session || session.revokedAt || new Date() > session.expiresAt || session.user.status !== 'active') {
      return null;
    }
    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name || '',
      userType: session.user.userType,
      roles: session.user.roles.map((ur) => ur.role.name),
      permissions: session.user.roles.flatMap((ur) =>
        ur.role.permissions.filter((rp) => rp.granted).map((rp) => rp.permission.id)
      ),
      sessionId: session.id,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name || '',
    };
  } catch {
    return null;
  }
}
