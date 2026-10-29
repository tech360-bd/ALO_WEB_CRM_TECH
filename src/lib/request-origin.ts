import type { AuthContext } from '@/lib/auth-middleware';

/** Uses server-resolved authentication method, never the mere presence of a header. */
export function publicMutationOriginAllowed(req: Request): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  const configuredUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  if (!origin) return process.env.NODE_ENV !== 'production';
  if (!configuredUrl && process.env.NODE_ENV === 'production') return false;
  try {
    // Development/preview origins are derived from the incoming request host;
    // production must use the configured canonical URL, not an untrusted Host.
    const expected = process.env.NODE_ENV === 'production'
      ? new URL(configuredUrl).origin
      : new URL(req.url).origin;
    return origin === expected;
  } catch { return false; }
}

export function mutationOriginAllowed(req: Request, auth: AuthContext): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) return false;
  if (!origin) return auth.authenticationMethod === 'bearer';
  try {
    return origin === new URL(process.env.NEXTAUTH_URL || req.url).origin;
  } catch { return false; }
}
