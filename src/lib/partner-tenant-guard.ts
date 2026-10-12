/**
 * Partner (B2B) tenant guards.
 *
 * Central, fail-closed authorization helpers for every `/api/partner-admin/*`
 * route. These exist because several partner endpoints previously ran with no
 * authentication at all and took `partnerId` straight from the query string or
 * request body, which allowed any anonymous caller to read another partner's
 * quota and to approve their own extra-seat requests.
 *
 * Rules enforced here:
 *   - The caller must be authenticated.
 *   - `partnerId` is ALWAYS derived from the authenticated session, never from
 *     client input. A client-supplied partnerId may only be used to assert that
 *     it matches the session; a mismatch is a hard 403.
 *   - Partner-privileged actions additionally require PARTNER_SUPER_ADMIN.
 *   - ALO-side approval actions require an ALO Super Admin / Chairman and are
 *     explicitly forbidden to partner users (a partner must never approve its
 *     own request).
 *
 * This module does not replace the existing auth middleware or RBAC; it is a
 * thin, reusable wrapper over `authenticateRequest` from `@/lib/auth-middleware`.
 */

import { NextResponse } from 'next/server';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

/** Roles that hold ALO-side master control (not partner-side). */
export const ALO_SUPER_ADMIN_ROLES = [
  'super_admin',
  'SUPER_ADMIN',
  'chairman',
  'CHAIRMAN',
  'superadmin',
  'SUPERADMIN',
];

export const PARTNER_SUPER_ADMIN_ROLE = 'PARTNER_SUPER_ADMIN';

export interface PartnerContext extends AuthContext {
  /** Guaranteed non-null once a guard has returned successfully. */
  partnerId: string;
  partnerRole: string;
}

function jsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, status, error: message, message, ...extra }, { status });
}

/** True when the caller holds ALO master (Super Admin / Chairman) authority. */
export function isAloSuperAdmin(auth: AuthContext): boolean {
  const candidates = [...(auth.roles || []), auth.userType || ''];
  return candidates.some((r) => ALO_SUPER_ADMIN_ROLES.includes(r));
}

/** True when the caller is the Super Admin of their own partner tenant. */
export function isPartnerSuperAdmin(auth: AuthContext): boolean {
  return (auth.partnerRole || '').toUpperCase() === PARTNER_SUPER_ADMIN_ROLE;
}

/**
 * Authenticate and resolve the caller's partner tenant.
 *
 * Returns a `NextResponse` (401/403) on failure so callers can early-return.
 */
export async function requirePartnerContext(
  request: Request,
): Promise<PartnerContext | NextResponse> {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  if (!auth.partnerId) {
    return jsonError(
      'Partner identity required. This account is not linked to a partner organisation.',
      403,
    );
  }

  return {
    ...auth,
    partnerId: auth.partnerId,
    partnerRole: auth.partnerRole || 'PARTNER_VIEWER',
  };
}

/**
 * As `requirePartnerContext`, but the caller must be the Partner Super Admin.
 * Used for user creation, seat requests, marketing approval and social
 * account connection.
 */
export async function requirePartnerSuperAdmin(
  request: Request,
): Promise<PartnerContext | NextResponse> {
  const ctx = await requirePartnerContext(request);
  if (ctx instanceof NextResponse) return ctx;

  if (!isPartnerSuperAdmin(ctx)) {
    return jsonError(
      'Only the Partner Super Admin can perform this action.',
      403,
      { requiredRole: PARTNER_SUPER_ADMIN_ROLE, yourRole: ctx.partnerRole },
    );
  }
  return ctx;
}

/**
 * Require ALO-side master authority. Partner users — including a Partner Super
 * Admin — are explicitly rejected, so a partner can never approve its own
 * extra-seat or extra-quota request.
 */
export async function requireAloSuperAdmin(
  request: Request,
): Promise<AuthContext | NextResponse> {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  if (auth.partnerId) {
    return jsonError(
      'Partner accounts cannot approve or reject their own requests. ALO Education review is required.',
      403,
    );
  }

  if (!isAloSuperAdmin(auth)) {
    return jsonError('ALO Education Super Admin authority is required for this action.', 403);
  }

  return auth;
}

/**
 * Assert that a client-supplied partnerId (if any) matches the session tenant.
 * Never use the supplied value afterwards — always use `ctx.partnerId`.
 */
export function assertSameTenant(
  ctx: PartnerContext,
  suppliedPartnerId: unknown,
): NextResponse | null {
  if (
    typeof suppliedPartnerId === 'string' &&
    suppliedPartnerId.length > 0 &&
    suppliedPartnerId !== ctx.partnerId
  ) {
    return jsonError('Cross-tenant access denied.', 403);
  }
  return null;
}

/**
 * Assert that an already-loaded record belongs to the caller's tenant.
 * Returns a 404 rather than a 403 so tenant membership is not leaked.
 */
export function assertRecordInTenant(
  ctx: PartnerContext,
  record: { partnerId?: string | null } | null | undefined,
  entityLabel = 'Record',
): NextResponse | null {
  if (!record || record.partnerId !== ctx.partnerId) {
    return jsonError(`${entityLabel} not found.`, 404);
  }
  return null;
}
