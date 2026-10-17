import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth';
import { db } from './db';

// AuthResult type — matches the success branch of verifyAuth's return union
export type AuthResult = Awaited<ReturnType<typeof verifyAuth>> extends
  | { user: infer U; session: infer S }
  | { error: string; status: number }
  ? { user: U; session: S }
  : never;

export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthResult;
}

/**
 * Roles that may access marketing features.
 * - super_admin / admin: full access to everything
 * - marketing_manager: full company marketing control
 * - marketing_executive: limited shared access (one of the 3 approved users)
 */
const MARKETING_ROLES = new Set([
  'super_admin',
  'admin',
  'marketing_manager',
  'marketing_executive',
]);

const MARKETING_MANAGER_ROLES = new Set([
  'super_admin',
  'admin',
  'marketing_manager',
]);

/**
 * Type guard: did verifyAuth return the error branch?
 * verifyAuth returns `{ error, status }` on failure or `{ user, session }` on success.
 */
function isAuthError(auth: Awaited<ReturnType<typeof verifyAuth>>): auth is { error: string; status: number } {
  return 'error' in auth;
}

/**
 * Require a valid authenticated session. Returns the auth result or a 401 NextResponse.
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const auth = await verifyAuth(request);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHENTICATED' }, { status: 401 });
  }
  return auth;
}

/**
 * Require the authenticated user to hold one of the allowed roles.
 * Unauthorized → 403 (per spec: "Unauthorized access returns 403 or safe redirect").
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthResult | NextResponse> {
  const authOrResponse = await requireAuth(request);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  // super_admin always passes
  const userRoles = auth.user.roles?.map((r: { name: string }) => r.name) ?? [];
  if (userRoles.includes('super_admin')) return auth;

  const hasRole = userRoles.some((r: string) => allowedRoles.includes(r));
  if (!hasRole) {
    return NextResponse.json(
      { error: 'Forbidden — insufficient role', code: 'FORBIDDEN', requiredRoles: allowedRoles },
      { status: 403 }
    );
  }
  return auth;
}

/**
 * Require marketing access (any marketing role). Checks MarketingUserAccess for marketing_executive.
 */
export async function requireMarketingAccess(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authOrResponse = await requireRole(request, [...MARKETING_ROLES]);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  const userRoles = auth.user.roles?.map((r: { name: string }) => r.name) ?? [];

  // marketing_executive must also be in the approved MarketingUserAccess list (the 3 approved users)
  if (userRoles.includes('marketing_executive') && !userRoles.includes('marketing_manager')) {
    const access = await db.marketingUserAccess.findFirst({
      where: { userId: auth.user.id, status: 'active' },
    });
    if (!access) {
      return NextResponse.json(
        {
          error: 'Forbidden — not an approved marketing user',
          code: 'NOT_APPROVED_MARKETING_USER',
        },
        { status: 403 }
      );
    }
  }
  return auth;
}

/**
 * Require marketing manager (or super_admin). Used for approval + brand asset + official social login.
 */
export async function requireMarketingManager(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  return requireRole(request, [...MARKETING_MANAGER_ROLES]);
}

/**
 * Scope a query to the counselor's assigned students/leads only.
 * Returns a Prisma where clause fragment, or null for roles that see all.
 */
export function counselorScope(auth: AuthResult): { assignedCounselor?: string } | null {
  const userRoles = auth.user.roles?.map((r: { name: string }) => r.name) ?? [];
  // super_admin / admin / marketing_manager / branch_manager see all
  if (
    userRoles.includes('super_admin') ||
    userRoles.includes('admin') ||
    userRoles.includes('marketing_manager') ||
    userRoles.includes('branch_manager')
  ) {
    return null;
  }
  // counselor / junior_counselor see only assigned
  if (userRoles.includes('counselor') || userRoles.includes('junior_counselor')) {
    return { assignedCounselor: auth.user.id };
  }
  // marketing_executive sees only assigned conversations
  if (userRoles.includes('marketing_executive')) {
    return { assignedCounselor: auth.user.id };
  }
  // default: scope to self (most restrictive)
  return { assignedCounselor: auth.user.id };
}

export { MARKETING_ROLES, MARKETING_MANAGER_ROLES };
