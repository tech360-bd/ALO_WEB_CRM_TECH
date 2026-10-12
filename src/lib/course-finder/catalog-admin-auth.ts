import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';

/**
 * Server-side authorisation for catalogue administration APIs. UI guards and
 * hidden buttons are not authorisation; every handler calls this.
 *
 *  - admin:      ADMIN or SUPER_ADMIN from a verified user/portal identity domain
 *  - superAdmin: SUPER_ADMIN only, and not while impersonating another user
 *  - mutation:   also requires a same-origin request
 */
export async function requireCatalogAdmin(
  req: Request,
  opts: { level: 'admin' | 'superAdmin'; mutation: boolean },
): Promise<AuthContext | NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const type = (auth.userType || '').toUpperCase();
  const domainOk = !!auth.userId && !!auth.actorUserId && ['user', 'portal'].includes(auth.identityDomain || '');
  const allowed = opts.level === 'superAdmin' ? ['SUPER_ADMIN'] : ['ADMIN', 'SUPER_ADMIN'];
  if (!domainOk || !allowed.includes(type)) {
    return NextResponse.json(
      { success: false, error: opts.level === 'superAdmin' ? 'Super Admin required' : 'Catalogue administrator required' },
      { status: 403 },
    );
  }
  if (opts.level === 'superAdmin' && auth.actorUserId !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Apply is not permitted while acting as another user' }, { status: 403 });
  }
  if (opts.mutation && !mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required' }, { status: 403 });
  }
  return auth;
}
