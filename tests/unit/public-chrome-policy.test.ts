import { describe, expect, it } from 'vitest';
import { isPublicChromeRoute } from '@/components/website/public-chrome-policy';

describe('isPublicChromeRoute', () => {
  it.each(['/', '/book-consultation', '/student-journey', '/universities', '/visa-support'])(
    'keeps public chrome on %s',
    (path) => {
      expect(isPublicChromeRoute(path)).toBe(true);
    },
  );

  it.each([
    '/login',
    '/login/',
    '/portal/login',
    '/student/login',
    '/student/register',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/partner-admin/dashboard',
    '/crm',
    '/admin/marketing-automation',
    '/dashboard',
  ])('suppresses public chrome on %s', (path) => {
    expect(isPublicChromeRoute(path)).toBe(false);
  });

  it('matches by path segment, not by string prefix', () => {
    // Boundary check only. src/proxy.ts does not list /student-journey as a
    // public route, so unauthenticated visits redirect to /login. Whether that
    // page should be public is an open product decision, not a chrome decision.
    expect(isPublicChromeRoute('/student-journey')).toBe(true);
    expect(isPublicChromeRoute('/partners-program')).toBe(true);
  });

  it('defaults to public chrome when the path is unknown', () => {
    expect(isPublicChromeRoute(null)).toBe(true);
  });
});
