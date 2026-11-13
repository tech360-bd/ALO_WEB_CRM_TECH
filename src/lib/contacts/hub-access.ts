/** Permission gate for the Contact Hub read endpoints. */

import { NextResponse } from 'next/server';
import type { AuthContext } from '@/lib/auth-middleware';

export function contactHubPermissionDenied(
  auth: AuthContext,
  permission: string,
  fallbackRoles: readonly string[] = [],
): NextResponse | null {
  const roles = new Set([auth.userType, ...(auth.roles || [])].map((role) => String(role).toUpperCase()));
  const isSuperAdmin = roles.has('SUPER_ADMIN');
  const hasPermission = (auth.permissions || []).includes(permission);
  const hasFallbackRole = fallbackRoles.some((role) => roles.has(role.toUpperCase()));
  if (isSuperAdmin || hasPermission || hasFallbackRole) return null;
  return NextResponse.json(
    { success: false, error: `Contact Hub permission required: ${permission}.` },
    { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
