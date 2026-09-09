// ============================================================
// /api/crm/ucc/oauth/start
// POST — Initiate official OAuth 2.0 authorization flow
// Supports: Meta (FB/IG/WA), Google, LinkedIn, X/Twitter
// Security: CSRF state + PKCE verifier stored in DB
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { generateOAuthState, generatePKCEVerifier, derivePKCEChallenge } from '@/lib/webhook-validator';
import { db } from '@/lib/db';

const PROVIDER_AUTH_URLS: Record<string, string> = {
  meta_business: 'https://www.facebook.com/v19.0/dialog/oauth',
  facebook_page: 'https://www.facebook.com/v19.0/dialog/oauth',
  instagram: 'https://www.facebook.com/v19.0/dialog/oauth',
  whatsapp: 'https://www.facebook.com/v19.0/dialog/oauth',
  google_analytics: 'https://accounts.google.com/o/oauth2/v2/auth',
  youtube: 'https://accounts.google.com/o/oauth2/v2/auth',
  linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
  x_twitter: 'https://twitter.com/i/oauth2/authorize',
};

const PROVIDER_SCOPES: Record<string, string> = {
  meta_business: 'business_management,pages_manage_metadata,pages_read_engagement,pages_manage_posts',
  facebook_page: 'pages_manage_metadata,pages_read_engagement,pages_manage_posts,pages_messaging,pages_read_user_content',
  instagram: 'instagram_basic,instagram_manage_messages,instagram_manage_comments,instagram_content_publish,pages_show_list',
  whatsapp: 'whatsapp_business_management,whatsapp_business_messaging',
  google_analytics: 'https://www.googleapis.com/auth/analytics.readonly',
  youtube: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
  linkedin: 'r_organization_social,w_organization_social,rw_organization_admin',
  x_twitter: 'tweet.read tweet.write users.read',
};

const CLIENT_ID_ENV: Record<string, string> = {
  meta_business: 'META_APP_ID',
  facebook_page: 'META_APP_ID',
  instagram: 'META_APP_ID',
  whatsapp: 'META_APP_ID',
  google_analytics: 'GOOGLE_CLIENT_ID',
  youtube: 'GOOGLE_CLIENT_ID',
  linkedin: 'LINKEDIN_CLIENT_ID',
  x_twitter: 'TWITTER_CLIENT_ID',
};

const PROVIDER_DISPLAY: Record<string, string> = {
  meta_business: 'Meta Business Manager',
  facebook_page: 'Facebook Pages',
  instagram: 'Instagram Business',
  whatsapp: 'WhatsApp Business Platform',
  google_analytics: 'Google Analytics 4',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x_twitter: 'X (Twitter)',
};

const PKCE_PROVIDERS = ['linkedin', 'x_twitter', 'google_analytics', 'youtube'];

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER'].includes(primaryRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — insufficient role to initiate OAuth.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provider, redirectUri } = body as { provider: string; redirectUri?: string };

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider is required.' }, { status: 400 });
    }

    const authUrl = PROVIDER_AUTH_URLS[provider];
    if (!authUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `Provider "${provider}" does not support automated OAuth. Use manual API key configuration.`,
          requiresManualSetup: true,
          officialDocs: 'https://developers.facebook.com/docs',
        },
        { status: 400 }
      );
    }

    const envVarName = CLIENT_ID_ENV[provider];
    const clientId = process.env[envVarName] || '';
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: `OAuth App ID for "${provider}" is not configured. Add ${envVarName} to your environment variables and restart the server.`,
          missingEnvVar: envVarName,
        },
        { status: 503 }
      );
    }

    // Generate CSRF state and PKCE
    const state = generateOAuthState();
    const codeVerifier = generatePKCEVerifier();
    const codeChallenge = derivePKCEChallenge(codeVerifier);

    // Persist state in DB (valid for 10 minutes)
    await db.uccWebhookEvent.create({
      data: {
        provider: `oauth_state_${provider}`,
        eventId: state,
        eventType: 'oauth_state',
        payload: JSON.stringify({
          codeVerifier,
          actorId: auth.userId,
          actorEmail: auth.email,
          redirectUri: redirectUri || null,
          createdAt: new Date().toISOString(),
        }),
        status: 'pending',
      },
    });

    const callbackUrl =
      redirectUri ||
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/crm/ucc/oauth/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: PROVIDER_SCOPES[provider] || '',
      state,
      response_type: 'code',
    });

    if (PKCE_PROVIDERS.includes(provider)) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    const authorizationUrl = `${authUrl}?${params.toString()}`;

    await logAuditAction(auth, 'OAUTH_START', 'SocialIntegration', provider, {
      provider,
      statePrefix: state.substring(0, 8) + '...',
    });

    return NextResponse.json({
      success: true,
      authorizationUrl,
      provider,
      displayName: PROVIDER_DISPLAY[provider] || provider,
      message: `Redirect user to the ${PROVIDER_DISPLAY[provider] || provider} authorization page to complete OAuth.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
