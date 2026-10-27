// ============================================================
// ALO EDUCATION — SUPER ADMIN ACCESS GUARD
//
// One canonical, server-side authority check for every
// /api/super-admin/* route. Frontend route guards are UX only.
//
// Two distinct authorities exist and must never be conflated:
//
//   requireSuperAdmin()      — the real, non-acting Super Admin.
//                              Required for every MUTATION (RBAC,
//                              suspension, session revocation,
//                              settings, approval decisions), so an
//                              Acting-As session can never escalate.
//
//   requireSuperAdminOrActing() — read access. A Super Admin who is
//                              Acting-As may still READ, because the
//                              acting identity is logged as
//                              "SUPER_ADMIN acting_as ROLE".
// ============================================================

import { NextResponse } from 'next/server';
import type { AuthContext } from '@/lib/auth-middleware';

export function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin')
    || auth.userType.toUpperCase() === 'SUPER_ADMIN';
}

/** True when the request is being served under an Acting-As session. */
export function isActingAs(auth: AuthContext): boolean {
  return Boolean(auth.actingAsSessionId);
}

export type GuardResult = { ok: true } | { ok: false; response: NextResponse };

function deny(message: string, status: 403 | 401): GuardResult {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error: message }, { status }),
  };
}

/**
 * The real, non-acting Super Admin. Required for every privileged mutation.
 * An Acting-As session is explicitly rejected: impersonating an employee must
 * never be a route to RBAC, finance or account-destructive operations.
 */
export function requireSuperAdmin(auth: AuthContext): GuardResult {
  if (!isSuperAdmin(auth)) {
    return deny('SUPER_ADMIN role required.', 403);
  }
  if (isActingAs(auth)) {
    return deny(
      'This operation is blocked while Acting-As mode is active. Exit Acting-As mode and retry as the real Super Admin.',
      403,
    );
  }
  if (auth.actorUserId !== auth.userId) {
    return deny('A non-acting Super Admin session is required.', 403);
  }
  return { ok: true };
}

/** SUPER_ADMIN may read while Acting-As; every other role is denied. */
export function requireSuperAdminOrActing(auth: AuthContext): GuardResult {
  if (!isSuperAdmin(auth)) {
    return deny('SUPER_ADMIN role required.', 403);
  }
  return { ok: true };
}

/**
 * Cross-origin write protection for cookie-authenticated mutations.
 * Same-origin and same-host requests pass; an absent Origin (server-to-server
 * or curl) is allowed because there is no ambient cookie to abuse.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const requestUrl = new URL(request.url);
    const configured = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : null;
    const originUrl = new URL(origin);
    return originUrl.origin === requestUrl.origin || originUrl.origin === configured;
  } catch {
    return false;
  }
}

/** The label written into every audit row produced in Acting-As mode. */
export function actorLabel(auth: AuthContext): string {
  if (isActingAs(auth)) {
    return `SUPER_ADMIN acting_as ${auth.actingAsRole || auth.userType}`;
  }
  return 'SUPER_ADMIN';
}
