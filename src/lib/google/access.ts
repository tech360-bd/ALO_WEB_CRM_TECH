/**
 * Access control for the Google ecosystem surfaces.
 *
 * The specification requires the Google module to integrate with ALO's existing
 * RBAC rather than invent a parallel one, with these permissions:
 *
 *   google.integrations.view   google.integrations.manage
 *   google.analytics.view      google.search_console.view
 *   google.maps.manage         google.youtube.manage
 *   google.billing.view        google.audit.view
 *
 * Those permissions now exist in `src/lib/permissions.ts` (module `google`), and
 * `super_admin` holds all of them by construction. This helper layers them on top
 * of the pre-existing `requireSeoStaff` gate rather than replacing it:
 *
 *   - The set of accounts that could already read these surfaces is unchanged, so
 *     this change cannot lock anyone out of a working dashboard.
 *   - A role that is *not* one of the legacy staff types can now be granted
 *     read access explicitly (for example a branch manager given
 *     `google.analytics.view`) without being given SEO-staff status.
 *   - No permission grants access to a credential. Secrets are never readable
 *     through any endpoint; they exist only in the server environment.
 *
 * A Google reporting surface is read-only, so `view` is sufficient for every GET
 * here. The `manage` permissions are deliberately not consulted by a GET route:
 * nothing about reading a report should require the right to change an
 * integration.
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { requireSeoStaff } from '@/lib/seo/request-access';

export type GooglePermission =
  | 'google.integrations.view'
  | 'google.integrations.manage'
  | 'google.analytics.view'
  | 'google.search_console.view'
  | 'google.maps.manage'
  | 'google.youtube.manage'
  | 'google.billing.view'
  | 'google.audit.view';

/**
 * Authorize a request for a Google surface.
 *
 * Returns the auth context, or a NextResponse describing the refusal — the same
 * shape `requireSeoStaff` uses, so call sites stay uniform.
 */
export interface GoogleAuthContext {
  userId: string;
  roles: string[];
  permissions: string[];
  userType: string;
}

export async function requireGoogleAccess(
  request: Request,
  permission: GooglePermission,
): Promise<GoogleAuthContext | NextResponse> {
  // Existing SEO/staff gate first: it already handles authentication, the
  // same-origin requirement for mutations, and the staff-type allowlist.
  const staff = await requireSeoStaff(request);

  if (!(staff instanceof NextResponse)) {
    // Already authorized by the pre-existing rule. The Google permission is
    // still reported as satisfied for those accounts because every legacy staff
    // type maps to `PERMISSION_CATALOG` grants for super_admin only; marketing
    // and admin staff are admitted by user type, exactly as before.
    return staff as unknown as GoogleAuthContext;
  }

  // Not a legacy SEO staff account. Fall back to the granular permission so an
  // explicitly granted non-staff role can read the surface.
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return staff; // preserve the original refusal
  const permissions = (auth.permissions ?? []) as string[];
  if (!permissions.includes(permission)) {
    return NextResponse.json(
      {
        error: `Google access denied: ${permission} permission required.`,
        requiredPermission: permission,
      },
      { status: 403 },
    );
  }
  if (request.method !== 'GET' && !mutationOriginAllowed(request, auth)) {
    return NextResponse.json({ error: 'Same-origin request required.' }, { status: 403 });
  }
  return {
    userId: auth.userId,
    roles: auth.roles,
    permissions,
    userType: auth.userType,
  };
}
