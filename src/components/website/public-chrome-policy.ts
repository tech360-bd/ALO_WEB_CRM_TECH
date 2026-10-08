/**
 * Route policy for the public marketing chrome (navbar, footer, CMS bars).
 *
 * Authentication entry points and every authenticated shell must render
 * standalone: no public navbar, no public footer, no marketing bars. Public
 * marketing routes keep the single shared navbar and footer.
 *
 * Matching is by path segment, so `/student-journey` (public) is not treated
 * as `/student` (portal).
 */
const NON_PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
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
  return !NON_PUBLIC_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}
