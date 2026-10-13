import { NextRequest, NextResponse } from 'next/server'

// Public API routes that don't require Bearer auth.
// Webhook receivers are public — they verify their own integrity via HMAC signatures.
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/auth/register',
  '/api/otp',
  '/api/otp/verify',
  // Webhook receivers — verified by HMAC signature inside the handler, NOT by Bearer token.
  // Meta/WhatsApp/Stripe/n8n do not send Authorization: Bearer headers.
  '/api/whatsapp/webhook',
  // WhatsApp AI reply is called internally by the HMAC-verified webhook handler (24/7 AI agent).
  // It enforces its own OTP gate before sharing private data.
  '/api/whatsapp/ai-reply',
  // WhatsApp document detection is called internally by the webhook handler.
  '/api/whatsapp/document-detect',
  '/api/webhooks/meta',
  '/api/webhooks/whatsapp',
  '/api/webhooks/n8n',
  '/api/webhooks/email',
  '/api/webhooks/sms',
  // Public website endpoints (consultation form, website chat, course finder) — create leads / list public data, no auth required
  '/api/public/consultation',
  '/api/public/chat',
  '/api/public/contact-buttons',
  '/api/public/courses',
  // Public country / destinations pages — list countries, single country,
  // universities, scholarships, FAQs. No auth required (only public-safe
  // fields projected server-side).
  '/api/public/countries',
  '/api/public/universities',
  '/api/public/scholarships',
  '/api/public/faqs',
  // Public consent/unsubscribe endpoint — called by SMS/WhatsApp reply webhooks (STOP/BLOCK/opt-out)
  '/api/marketing/consent/unsubscribe',
  // Cron endpoints — protected by CRON_SECRET header, not Bearer token
  '/api/cron/sla-sweep',
  '/api/cron/otp-cleanup',
  '/api/cron/session-cleanup',
  // NOTE: /api/seed/* is NOT public. It requires super_admin auth (requireRole) + NODE_ENV check.
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
}

// Basic token format validation (UUID or CUID-like or 10+ alphanumeric)
function isValidTokenFormat(token: string): boolean {
  if (!token || token.length < 10) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const cuidRegex = /^c[a-z0-9]{20,}$/i
  const alphanumericRegex = /^[a-zA-Z0-9_-]{10,}$/
  return uuidRegex.test(token) || cuidRegex.test(token) || alphanumericRegex.test(token)
}

// Next.js 16 uses "proxy" convention instead of "middleware"
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public routes (incl. webhook receivers) through — they self-verify via HMAC
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check for Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)

  // Validate token format (lightweight check).
  // NOTE: Token-to-user verification is enforced inside each route via
  // requireAuth / requireRole / requireMarketingAccess (src/lib/auth-rbac.ts).
  if (!isValidTokenFormat(token)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid token format' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
