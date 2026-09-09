import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/', '/portals', '/login', '/register',
  '/student-login', '/partner-login', '/employee-login',
  '/forgot-password', '/reset-password', '/verify-otp',
  '/account-suspended', '/account-pending', '/unauthorized',
];

const PUBLIC_PREFIXES = [
  '/api/portal-auth/login',
  '/api/portal-auth/register',
  '/api/portal-auth/forgot-password',
  '/api/portal-auth/reset-password',
  '/api/portal-auth/verify-otp',
  '/api/website/',
  '/api/health',
  '/api/course-finder',
  '/api/universities',
  '/api/scholarships',
  '/api/destinations',
  '/api/chat',
  '/api/marketing/webhooks',
  '/_next/static',
  '/_next/image',
  '/favicon',
  '/robots',
  '/sitemap',
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
