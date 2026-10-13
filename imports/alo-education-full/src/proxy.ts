import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    // Match all routes — security headers applied universally
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // ─── Security Headers (all responses) ─────────────────────
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // ─── CORS Headers (API routes only) ────────────────────────
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    const origin = request.headers.get('origin') || '';
    // Allow same-origin and development origins
    const allowedOrigins = [
      'http://localhost:3000',
      origin, // Allow the requesting origin for development
    ];

    // In production, only allow the app's own origin
    if (process.env.NODE_ENV === 'production') {
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL || origin;
      response.headers.set('Access-Control-Allow-Origin', appOrigin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle CORS preflight
  if (isApiRoute && request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}
