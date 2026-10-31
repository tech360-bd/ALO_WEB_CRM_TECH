import { NextResponse } from 'next/server';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';
import { createOAuthState, safeReturnTo } from '@/lib/social/oauth-state';
import {
  buildSocialAuthorizeUrl,
  checkProviderEnv,
  isSocialOAuthProvider,
} from '@/lib/social/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withMarketingAccess(async (
  request: Request,
  auth: AuthContext,
  context?: { params: Promise<{ provider: string }> },
) => {
  if (auth.actingAsSessionId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Acting-as sessions cannot initiate or modify official social OAuth connections.',
      },
      { status: 403 },
    );
  }

  const { provider: rawProvider } = await context!.params;
  const provider = (rawProvider || '').trim().toLowerCase();
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'), '/admin/marketing');
  const mode = url.searchParams.get('mode');

  if (provider === 'facebook') {
    const envCheck = checkProviderEnv('facebook');
    if (!envCheck.configured) {
      return NextResponse.json(
        {
          success: false,
          status: 'NOT_CONFIGURED',
          provider,
          missingEnv: envCheck.missingEnv,
          error: `Configure ${envCheck.missingEnv.join(', ')} to initiate Facebook OAuth.`,
        },
        { status: 503 },
      );
    }
    const state = createOAuthState('facebook', returnTo);
    const scopes = [
      'pages_manage_posts',
      'pages_manage_metadata',
      'pages_read_engagement',
      'pages_show_list',
      'leads_retrieval',
      'pages_messaging',
    ].join(',');
    const authorize = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authorize.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!);
    authorize.searchParams.set('redirect_uri', process.env.FACEBOOK_REDIRECT_URI!);
    authorize.searchParams.set('scope', scopes);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('state', state);

    if (mode === 'json') {
      return NextResponse.json({ success: true, provider, authorizeUrl: authorize.toString() });
    }
    return NextResponse.redirect(authorize.toString());
  }

  if (!isSocialOAuthProvider(provider)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unsupported social OAuth provider. Supported: facebook, instagram, linkedin, youtube.',
      },
      { status: 400 },
    );
  }

  try {
    const built = buildSocialAuthorizeUrl(provider, returnTo);
    if (!built.ok) {
      return NextResponse.json(
        {
          success: false,
          status: built.status,
          provider,
          missingEnv: built.missingEnv,
          error: `Configure ${built.missingEnv.join(', ')} to initiate ${provider} OAuth.`,
        },
        { status: 503 },
      );
    }

    if (mode === 'json') {
      return NextResponse.json({ success: true, provider, authorizeUrl: built.authorizeUrl });
    }
    return NextResponse.redirect(built.authorizeUrl);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to start social OAuth flow.',
      },
      { status: 500 },
    );
  }
}, 'manager');
