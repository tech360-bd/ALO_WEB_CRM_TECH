// Official OAuth setup is intentionally gated until a provider code exchange,
// token vault, evidence record, webhook verification, and live test are wired.
// Returning a clickable authorization URL without those pieces was misleading.

import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const KNOWN_PROVIDERS = new Set([
  'meta_business', 'facebook_page', 'instagram', 'whatsapp', 'google_analytics',
  'youtube', 'linkedin', 'x_twitter',
]);

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (![auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()))) {
    return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const provider = typeof body?.provider === 'string' ? body.provider : '';
  if (!KNOWN_PROVIDERS.has(provider)) {
    return NextResponse.json({ success: false, error: 'Unsupported provider.' }, { status: 400 });
  }

  await logAuditAction(auth, 'OAUTH_START_REFUSED', 'SocialIntegration', provider, {
    reason: 'provider_exchange_and_live_verification_not_implemented',
  });
  return NextResponse.json({
    success: false,
    status: 'NOT_VERIFIED',
    provider,
    error: 'OAuth authorization cannot be started until the official token exchange and live verification flow is implemented.',
    verification: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
  }, { status: 501 });
}
