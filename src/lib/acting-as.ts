// ============================================================
// ALO EDUCATION — ACTING-AS SESSION RESOLUTION
//
// One implementation of "is this request running under a validated
// Super-Admin Acting-As session?" used by BOTH authentication paths:
//
//   • src/lib/auth-middleware.ts (portal cookie / bearer sessions)
//   • src/lib/auth-middleware.ts (NextAuth cookie — the web app path)
//
// Why this module exists: Acting-As was only resolved on the database
// portal-session path. A Super Admin who signed in through the web app
// (NextAuth cookie) could click "Open dashboard", receive a real, audited
// acting-as session row and cookie — and then keep acting as themselves. The
// banner never showed, no action was labelled "SUPER_ADMIN acting_as ROLE",
// and privileged mutations were not blocked, because the effective identity
// was never switched. That is the exact opposite of the required behaviour,
// so resolution now lives here and both paths call it.
//
// Rules enforced here, in one place:
//   • the cookie is only honoured while the REAL actor is a Super Admin;
//   • the session row must belong to that actor, be unrevoked and unexpired;
//   • the session must carry the ALO_ACTING_AS: device marker;
//   • the target must be an active, verified EMPLOYEE (never ADMIN/SUPER_ADMIN);
//   • the actor's portal identity is resolved across the User/PortalUser
//     identity split by id and then by email.
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const ACTING_AS_COOKIE = 'alo_acting_as_session';
export const ACTING_AS_MARKER = 'ALO_ACTING_AS:';

export function actingAsCookieValue(request: Request): string | null {
  const header = request.headers.get('cookie') || '';
  const pair = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACTING_AS_COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(ACTING_AS_COOKIE.length + 1)) : null;
}

/**
 * The actor's PortalUser id. NextAuth sessions identify the actor in the
 * `users` table; portal sessions and employee records use `portal_users`.
 * Acting-As sessions and employee links are stored against the portal id, so
 * it is resolved by id first and then by verified email.
 */
export async function resolveActorPortalUserId(actorUserId: string, actorEmail: string): Promise<string | null> {
  try {
    const byId = await db.portalUser.findUnique({ where: { id: actorUserId }, select: { id: true } });
    if (byId) return byId.id;
  } catch {
    // fall through to the email lookup
  }
  if (!actorEmail) return null;
  try {
    const byEmail = await db.portalUser.findUnique({ where: { email: actorEmail }, select: { id: true } });
    return byEmail?.id ?? null;
  } catch {
    return null;
  }
}

export interface ActingTarget {
  userId: string;
  email: string;
  name: string;
  userType: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  expiresAt: Date;
  employeeRole: string;
}

export type ActingResolution =
  | { status: 'none' }
  | { status: 'error'; response: NextResponse }
  | { status: 'active'; target: ActingTarget };

const errorResponse = (message: string, code: number) =>
  NextResponse.json({ success: false, error: message }, { status: code });

/**
 * Resolves the Acting-As cookie for a request. Returns:
 *   none    — no cookie, or the caller is not a Super Admin (cookie ignored)
 *   error   — a cookie is present but the session is invalid (caller must stop)
 *   active  — validated effective identity
 */
export async function resolveActingAsSession(
  request: Request,
  actor: { userId: string; email: string; isSuperAdmin: boolean },
): Promise<ActingResolution> {
  const cookieId = actingAsCookieValue(request);
  if (!cookieId || !actor.isSuperAdmin) return { status: 'none' };

  const now = new Date();
  let session;
  try {
    session = await db.portalSession.findUnique({ where: { id: cookieId } });
  } catch {
    return { status: 'error', response: errorResponse('Acting-As session could not be verified.', 403) };
  }

  const actorPortalId = await resolveActorPortalUserId(actor.userId, actor.email);
  const ownsSession = Boolean(session) && Boolean(actorPortalId) && session!.userId === actorPortalId;
  const isBoundActiveSession = Boolean(session)
    && ownsSession
    && !session!.revokedAt
    && session!.expiresAt > now
    && session!.deviceName.startsWith(ACTING_AS_MARKER);

  // Ending an acting session must work even after it expires or is revoked,
  // otherwise the operator is trapped with a dead cookie.
  const isStopRequest = request.method === 'POST'
    && new URL(request.url).pathname === '/api/portal-auth/acting-as/stop';

  if (!isBoundActiveSession && !isStopRequest) {
    return {
      status: 'error',
      response: errorResponse('Acting-As session expired or revoked. Stop Acting-As before continuing.', 403),
    };
  }
  if (!isBoundActiveSession) return { status: 'none' };

  const targetUserId = session!.deviceName.slice(ACTING_AS_MARKER.length);
  const [targetUser, targetEmployee] = await Promise.all([
    db.portalUser.findUnique({
      where: { id: targetUserId },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    }),
    db.employee.findUnique({ where: { userId: targetUserId }, select: { id: true, role: true, status: true } }),
  ]);

  const targetRoles = targetUser?.roles.map((row) => row.role.name) || [];
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
    return {
      status: 'error',
      response: errorResponse('Acting-As employee is unavailable or no longer active.', 403),
    };
  }

  return {
    status: 'active',
    target: {
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      userType: targetUser.userType,
      roles: targetRoles,
      permissions: targetUser.roles.flatMap((row) =>
        row.role.permissions.filter((grant) => grant.granted).map((grant) => grant.permission.id),
      ),
      sessionId: session!.id,
      expiresAt: session!.expiresAt,
      employeeRole: targetEmployee.role,
    },
  };
}
