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
}

// ============================================================
// Extract and validate session from an HttpOnly cookie or legacy Authorization header
// ============================================================
function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') || '';
  const pair = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

export async function authenticateRequest(request: Request): Promise<AuthContext | NextResponse> {
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

    const user = await db.user.findUnique({ where: { id: nextAuthUser.id } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Account is not active.' },
        { status: 403 }
      );
    }

    const role = user.role || nextAuthUser.role || 'STUDENT';
    const naPartner = await resolvePartnerScope(user.email);
    return {
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

  // Handle "actingAs" — only super_admin, strict equality, audited, no escalation beyond original actor (SEC-03)
  const actingAsUserId = request.headers.get('x-acting-as-user');
  if (actingAsUserId) {
    // Must be exact super_admin (not admin) — fail closed if not
    if (!roles.includes('super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only super_admin may act as another user' },
        { status: 403 }
      ) as any;
    }
    // Prevent acting-as loop: cannot act as self (no-op, but audit)
    if (actingAsUserId === session.user.id) {
      // no impersonation needed — continue as self but audit
    } else {
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

      if (!actingAsUser || actingAsUser.status !== 'active') {
        return NextResponse.json(
          { success: false, error: 'Acting-as target not found or inactive' },
          { status: 404 }
        ) as any;
      }

      // Audit every impersonation — never silent
      try {
        await db.portalAuditLog.create({
          data: {
            actorUserId: session.user.id,
            action: 'IMPERSONATION_START',
            entityType: 'PortalUser',
            entityId: actingAsUser.id,
            metadata: JSON.stringify({ actor: session.user.email, target: actingAsUser.email, sessionId: session.id }),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
          },
        }).catch(() => {});
      } catch {}

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

  // Tenant scope follows the EFFECTIVE user (so Super-Admin "acting as" a
  // partner is correctly confined to that partner's tenant), while the audit
  // fields below still record the real actor.
  const partnerScope = await resolvePartnerScopeByUserId(actingUserId);

  return {
    userId: actingUserId,
    email: actingEmail,
    name: actingName,
    userType: actingUserType,
    roles,
    permissions,
    sessionId: session.id,
    partnerId: partnerScope?.partnerId,
    partnerRole: partnerScope?.partnerRole,
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
  };
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
