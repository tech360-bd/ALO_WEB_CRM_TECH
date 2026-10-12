import type { AuthContext } from '@/lib/auth-middleware';

/** Uses server-resolved authentication method, never the mere presence of a header. */
export function mutationOriginAllowed(req: Request, auth: AuthContext): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) return false;
  if (!origin) return auth.authenticationMethod === 'bearer';
  try {
    return origin === new URL(process.env.NEXTAUTH_URL || req.url).origin;
  } catch { return false; }
}
