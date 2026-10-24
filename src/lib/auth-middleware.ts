// ============================================================
// ALO EDUCATION — RBAC Auth Middleware for API Routes
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export interface AuthContext {
  /** Server-resolved ID namespace. Never infer it from request headers or matching IDs. */
  identityDomain?: 'user' | 'portal';
  authenticationMethod?: 'cookie' | 'bearer';
  userId: string;
  email: string;
  name: string;
  userType: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  branch?: string;

  // B2B tenant scope. Resolved server-side from the user's PartnerProfile and
  // NEVER from a client-supplied value — every partner-scoped query must filter
  // on this. Previously these fields did not exist at all, so routes reading
  // `auth.partnerId` always saw `undefined` and rejected every request with
  // "Partner identity required" (partner user management and voucher
  // generation were therefore entirely non-functional).
  partnerId?: string;
  /** Role WITHIN the partner tenant, e.g. PARTNER_SUPER_ADMIN. */
  partnerRole?: string;

  // Actor info for audit logs (especially when actingAs is used)
  actorUserId: string;
  actorEmail: string;
  actorName: string;
  /** Bound, revocable Acting-As session. Present only for a server-validated employee impersonation. */
  actingAsSessionId?: string;
  actingAsExpiresAt?: Date;
  actingAsRole?: string;
}

// ============================================================
// Extract and validate session from an HttpOnly cookie or legacy Authorization header
// ============================================================
function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') || '';
  const pair = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

async function authenticateSession(request: Request): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  // New portal logins use an HttpOnly cookie. Bearer remains supported for
  // legacy clients, but fabricated empty/null values must not shadow the cookie.
  const token = bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined'
    ? bearerToken
    : cookieValue(request, 'alo_portal_session');

  // The web app uses NextAuth cookies while older portal clients use a
  // database-backed Bearer session. Support both without accepting fabricated
  // tokens or bypassing the database checks.
  if (!token) {
    // `getServerSession` reads `next/headers`, which throws outside a request
    // scope instead of simply reporting "no session". An unauthenticated call
    // must produce a clean 401, never an unhandled exception that surfaces as
    // a 500 and leaks a stack trace, so this fails closed to "no session".
    const nextAuthSession = await (async () => {
      try {
        const { getServerSession } = await import('next-auth');
        const { authOptions } = await import('@/lib/auth');
        return await getServerSession(authOptions);
      } catch {
        return null;
      }
    })();
    const nextAuthUser = nextAuthSession?.user as {
      identityDomain?: string;
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: string;
      status?: string;
    } | undefined;

    if (!nextAuthUser?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please login.' },
        { status: 401 }
      );
    }

    if (nextAuthUser.identityDomain !== 'user') return NextResponse.json({success:false,error:'Canonical User session required. Please sign in again.'},{status:403});

    const user = await db.user.findUnique({ where: { id: nextAuthUser.id } });
    if (!user || user.status !== 'ACTIVE' || !user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Account is not active or email is not verified.' },
        { status: 403 }
      );
    }

    const role = user.role || nextAuthUser.role || 'STUDENT';
    const naPartner = await resolvePartnerScope(user.email);
    return {
      identityDomain: 'user',
      authenticationMethod: 'cookie',
      userId: user.id,
      email: user.email,
      name: user.name || user.email,
      userType: role,
      roles: [role, role.toLowerCase()],
      permissions: JSON.parse(user.permissions || '[]'),
      sessionId: `nextauth:${user.id}`,
      partnerId: naPartner?.partnerId,
      partnerRole: naPartner?.partnerRole,
      actorUserId: user.id,
      actorEmail: user.email,
      actorName: user.name || user.email,
    };
  }

  // Look up the cookie or bearer session in the database
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
          partnerProfile: { select: { id: true, partnerId: true, partnerRole: true, approvalStatus: true } },
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

  // Every database-backed session is revalidated against current account and
  // email-verification state; revocation/status changes take effect immediately.
  if (session.user.status.toLowerCase() !== 'active' || !session.user.emailVerified) {
    return NextResponse.json(
      { success: false, error: 'Account is not active or email is not verified.', error_code: `account_${session.user.status}` },
      { status: 403 }
    );
  }
  if (session.user.userType === 'PARTNER' && !['approved', 'active'].includes((session.user.partnerProfile?.approvalStatus || '').toLowerCase())) {
    return NextResponse.json({ success: false, error: 'Partner account approval is required.' }, { status: 403 });
  }

  // The effective identity can only come from a short-lived database session
  // bound to the authenticated Super Admin's base session. Client-supplied role
  // and target headers are deliberately not an identity source.
  if (request.headers.has('x-acting-as-user')) {
    return NextResponse.json(
      { success: false, error: 'Client-supplied Acting-As identity headers are not supported.' },
      { status: 403 },
    );
  }

  let effectiveUserId = session.user.id;
  let effectiveEmail = session.user.email;
  let effectiveName = session.user.name;
  let effectiveUserType = session.user.userType;
  let roles = session.user.roles.map((ur) => ur.role.name);
  let permissions = session.user.roles.flatMap((ur) =>
    ur.role.permissions
      .filter((rp) => rp.granted)
      .map((rp) => rp.permission.id)
  );
  let actingAsSessionId: string | undefined;
  let actingAsExpiresAt: Date | undefined;
  let actingAsRole: string | undefined;

  const actingCookieId = cookieValue(request, 'alo_acting_as_session');
  const realActorIsSuperAdmin = roles.some((role) => role.toLowerCase() === 'super_admin');
  if (actingCookieId && realActorIsSuperAdmin) {
    const actingSession = await db.portalSession.findUnique({ where: { id: actingCookieId } });
    const now = new Date();
    const marker = 'ALO_ACTING_AS:';
    const isBoundActiveSession = actingSession
      && actingSession.userId === session.user.id
      && !actingSession.revokedAt
      && actingSession.expiresAt > now
      && actingSession.deviceName.startsWith(marker);

    const isStopRequest = request.method === 'POST' && new URL(request.url).pathname === '/api/portal-auth/acting-as/stop';
    if (!isBoundActiveSession && !isStopRequest) {
      return NextResponse.json({ success: false, error: 'Acting-As session expired or revoked. Stop Acting-As before continuing.' }, { status: 403 });
    }

    if (isBoundActiveSession) {
      const targetUserId = actingSession.deviceName.slice(marker.length);
      const [targetUser, targetEmployee] = await Promise.all([
        db.portalUser.findUnique({
          where: { id: targetUserId },
          include: {
            partnerProfile: { select: { id: true, partnerId: true, partnerRole: true, approvalStatus: true } },
            roles: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
          },
        }),
        db.employee.findUnique({
          where: { userId: targetUserId },
          select: { id: true, role: true, status: true },
        }),
      ]);

      const targetRoles = targetUser?.roles.map((ur) => ur.role.name) || [];
      const targetHasAdminRole = targetRoles.some((role) => ['admin', 'super_admin'].includes(role.toLowerCase()));
      if (
        !targetUser
        || targetUser.userType !== 'EMPLOYEE'
        || targetUser.status.toLowerCase() !== 'active'
        || !targetUser.emailVerified
        || !targetEmployee
        || targetEmployee.status.toLowerCase() !== 'active'
        || targetHasAdminRole
      ) {
        return NextResponse.json(
          { success: false, error: 'Acting-As employee is unavailable or no longer active.' },
          { status: 403 },
        );
      }

      effectiveUserId = targetUser.id;
      effectiveEmail = targetUser.email;
      effectiveName = targetUser.name;
      effectiveUserType = targetUser.userType;
      roles = targetRoles;
      permissions = targetUser.roles.flatMap((ur) =>
        ur.role.permissions.filter((rp) => rp.granted).map((rp) => rp.permission.id)
      );
      actingAsSessionId = actingSession.id;
      actingAsExpiresAt = actingSession.expiresAt;
      actingAsRole = targetEmployee.role;
    }
  }

  // Tenant scope follows the EFFECTIVE user (so Super-Admin "acting as" a
  // partner is correctly confined to that partner's tenant), while the audit
  // fields below still record the real actor.
  const partnerScope = await resolvePartnerScopeByUserId(effectiveUserId);

  return {
    identityDomain: 'portal',
    authenticationMethod: bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined' ? 'bearer' : 'cookie',
    userId: effectiveUserId,
    email: effectiveEmail,
    name: effectiveName,
    userType: effectiveUserType,
    roles,
    permissions,
    sessionId: session.id,
    partnerId: partnerScope?.partnerId,
    partnerRole: partnerScope?.partnerRole,
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    actingAsSessionId,
    actingAsExpiresAt,
    actingAsRole,
  };
}

/** Revalidate employee lifecycle for every employee/HR request. */
export async function authenticateRequest(request: Request): Promise<AuthContext | NextResponse> {
  const result = await authenticateSession(request);
  if (result instanceof NextResponse) return result;
  const pathname = new URL(request.url).pathname;
  const employeeRoute = pathname.startsWith('/api/employee-access/') || pathname.startsWith('/api/admin/employees') || pathname.startsWith('/api/admin/payroll') || pathname === '/api/finance' || pathname.startsWith('/api/finance/') || pathname.startsWith('/api/crm/finance');
  // Employee deactivation applies across every CRM/communication/AI route,
  // not only HR endpoints. Revalidate the effective employee on every request.
  const employee = await db.employee.findFirst({ where: { userId: result.userId }, select: { status: true } });
  if (employee && employee.status.toLowerCase() !== 'active') {
    return NextResponse.json({ success: false, error: 'Employee account is not active.' }, { status: 403 });
  }
  if (employeeRoute || pathname === '/api/employee' || pathname.startsWith('/api/employee/')) {
    if (['STUDENT', 'PARTNER'].includes(result.userType.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Employee access required.' }, { status: 403 });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(process.env.NEXTAUTH_URL || request.url).origin) {
        return NextResponse.json({ success: false, error: 'Cross-origin employee mutation denied.' }, { status: 403 });
      }
    }
  }
  return result;
}

// ============================================================
// Partner tenant scope resolution (server-side only)
// ============================================================

/** Look up the B2B tenant a PortalUser belongs to. */
async function resolvePartnerScopeByUserId(
  userId: string,
): Promise<{ partnerId: string; partnerRole: string } | null> {
  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId },
      select: { partnerId: true, partnerRole: true },
    });
    if (!profile?.partnerId) return null;
    return { partnerId: profile.partnerId, partnerRole: profile.partnerRole || 'PARTNER_SUPER_ADMIN' };
  } catch {
    return null;
  }
}

/**
 * NextAuth sessions authenticate against `User`, while partner tenancy hangs
 * off `PortalUser`. Bridge the two by email so a partner signing in through
 * either path gets the same tenant scope.
 */
async function resolvePartnerScope(
  email: string,
): Promise<{ partnerId: string; partnerRole: string } | null> {
  try {
    const portalUser = await db.portalUser.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!portalUser) return null;
    return resolvePartnerScopeByUserId(portalUser.id);
  } catch {
    return null;
  }
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

    // Only the exact Super Admin authority bypasses configured permissions.
    // ADMIN remains subject to the same explicit permission checks as staff.
    if (
      auth.userType === 'SUPER_ADMIN' ||
      auth.roles.includes('super_admin') ||
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
    // Preserve the real actor, effective employee, short-lived session and
    // effective role in every action event written through this helper.
    const finalMetadata = auth.actingAsSessionId
      ? {
        ...metadata,
        realActorUserId: auth.actorUserId,
        actingAsUser: auth.userId,
        actingAsRole: auth.actingAsRole || auth.roles[0] || auth.userType,
        actingAsSessionId: auth.actingAsSessionId,
        actingAsExpiresAt: auth.actingAsExpiresAt?.toISOString(),
      }
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
            partnerProfile: { select: { id: true, partnerId: true, partnerRole: true, approvalStatus: true } },
          },
        },
      },
    });
    if (!session || session.revokedAt || new Date() > session.expiresAt || session.user.status.toLowerCase() !== 'active' || !session.user.emailVerified) {
      return null;
    }
    if (session.user.userType === 'PARTNER' && !['approved', 'active'].includes((session.user.partnerProfile?.approvalStatus || '').toLowerCase())) return null;
    return {
      identityDomain: 'portal',
      authenticationMethod: 'bearer',
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name || '',
      userType: session.user.userType,
      roles: session.user.roles.map((ur) => ur.role.name),
      permissions: session.user.roles.flatMap((ur) =>
        ur.role.permissions.filter((rp) => rp.granted).map((rp) => rp.permission.id)
      ),
      sessionId: session.id,
      partnerId: session.user.partnerProfile?.partnerId,
      partnerRole: session.user.partnerProfile?.partnerRole,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name || '',
    };
  } catch {
    return null;
  }
}
