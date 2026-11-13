/**
 * Route policy for the public marketing chrome (navbar, footer, CMS bars).
 *
 * Signed-out authentication entry points and marketing pages share the brand
 * header/footer. Authenticated portal shells remain standalone. Session-based
 * suppression is handled by PublicLayoutWrapper.
 *
 * Matching is by path segment, so `/student-journey` (public) is not treated
 * as `/student` (portal).
 */
const NON_PUBLIC_PREFIXES = [
  '/portal',
  '/student',
  '/employee',
  '/partner',
  '/partner-admin',
  '/admin',
  '/crm',
  '/counselor',
  '/dashboard',
  '/super-admin',
  '/application-manager',
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicChromeRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  // DreamFrame is a separate, standalone creative experience.
  if (matchesPrefix(path, '/dreamframe')) return false;
  // Portal sign-in / registration screens are pre-login pages too.
  if (/\/(login|register|forgot-password|reset-password|verify-email)$/.test(path)) return true;
  return !NON_PUBLIC_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}
