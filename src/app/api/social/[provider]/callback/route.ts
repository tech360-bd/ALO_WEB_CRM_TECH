import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { isMarketingManager } from '@/lib/marketing/access';
import { safeReturnTo, verifyOAuthState } from '@/lib/social/oauth-state';
import {
  exchangeSocialOAuthCode,
  isSocialOAuthProvider,
  persistSocialCredentials,
  SocialOAuthExchangeError,
} from '@/lib/social/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params;
  const provider = (rawProvider || '').trim().toLowerCase();

  if (!isSocialOAuthProvider(provider)) {
    return NextResponse.json(
      { error: 'Unsupported social OAuth callback provider.' },
      { status: 400 },
    );
  }

  // Require an authenticated Marketing Manager / Super Admin session before
  // accepting any OAuth callback.
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isMarketingManager(auth)) {
    return NextResponse.json(
      { error: 'Marketing Manager or Super Admin authorization is required to connect social accounts.' },
      { status: 403 },
    );
  }
  if (auth.actingAsSessionId) {
    return NextResponse.json(
      { error: 'Acting-as sessions cannot connect or overwrite official social credentials.' },
      { status: 403 },
    );
  }

  const upstreamError = req.nextUrl.searchParams.get('error');
  const state = req.nextUrl.searchParams.get('state');
  const code = req.nextUrl.searchParams.get('code');

  // Verify the HMAC-signed state BEFORE inspecting or exchanging the code.
  const verifiedState = verifyOAuthState(state, provider);
  if (!verifiedState.ok) {
    return NextResponse.json(
      {
        error: 'The OAuth state was invalid or expired. Restart the connection from Integrations.',
        reason: verifiedState.reason,
      },
      { status: 403 },
    );
  }
  const returnTo = safeReturnTo(verifiedState.payload.returnTo, '/admin/marketing');

  if (upstreamError) {
    const redirectUrl = new URL(returnTo, req.url);
    redirectUrl.searchParams.set('social_error', upstreamError.slice(0, 120));
    redirectUrl.searchParams.set('provider', provider);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || code.length > 4096) {
    return NextResponse.json({ error: 'Authorization code is missing or invalid.' }, { status: 400 });
  }

  try {
    const credentials = await exchangeSocialOAuthCode(provider, code);
    await persistSocialCredentials(credentials, auth.userId);

    const redirectUrl = new URL(returnTo, req.url);
    redirectUrl.searchParams.set('social_connected', provider);
    redirectUrl.searchParams.set('accounts', String(credentials.accounts.length));
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof SocialOAuthExchangeError) {
      return NextResponse.json({ error: error.message, provider }, { status: error.httpStatus });
    }
    console.error('[social.callback] exchange failed', {
      provider,
      reason: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: 'Failed to complete social OAuth connection.', provider },
      { status: 502 },
    );
  }
}
