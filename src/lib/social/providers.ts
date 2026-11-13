import { db } from '@/lib/db';
import { isGlobalAiPaused, isScopedAiPaused } from '@/lib/ai-safety';
import { SCOPE_YOUTUBE_READONLY, SCOPE_YOUTUBE_UPLOAD } from '@/lib/google/oauth';
import { createOAuthState, safeReturnTo } from '@/lib/social/oauth-state';
import { decryptStoredToken, encryptStoredToken } from '@/lib/social/token-encryption';

export const SOCIAL_OAUTH_PROVIDERS = ['instagram', 'linkedin', 'youtube'] as const;
export type SocialOAuthProvider = (typeof SOCIAL_OAUTH_PROVIDERS)[number];
export type SocialPublishPlatform = SocialOAuthProvider | 'facebook';

export function isSocialOAuthProvider(value: string): value is SocialOAuthProvider {
  return (SOCIAL_OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export interface ProviderEnvCheck {
  configured: boolean;
  missingEnv: string[];
}

function resolveInstagramCreds() {
  const igId = process.env.INSTAGRAM_APP_ID;
  const fbId = process.env.FACEBOOK_APP_ID;
  const igSecret = process.env.INSTAGRAM_APP_SECRET;
  const fbSecret = process.env.FACEBOOK_APP_SECRET;
  return {
    appId: igId || fbId || '',
    appSecret: igSecret || fbSecret || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || '',
  };
}

function resolveYoutubeCreds() {
  const ytId = process.env.YOUTUBE_CLIENT_ID;
  const gId = process.env.GOOGLE_CLIENT_ID;
  const ytSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const gSecret = process.env.GOOGLE_CLIENT_SECRET;
  return {
    clientId: ytId || gId || '',
    clientSecret: ytSecret || gSecret || '',
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || '',
  };
}

export function checkProviderEnv(provider: SocialPublishPlatform | 'whatsapp' | 'opensms'): ProviderEnvCheck {
  const missing: string[] = [];
  if (provider === 'facebook') {
    if (!process.env.FACEBOOK_APP_ID) missing.push('FACEBOOK_APP_ID');
    if (!process.env.FACEBOOK_APP_SECRET) missing.push('FACEBOOK_APP_SECRET');
    if (!process.env.FACEBOOK_REDIRECT_URI) missing.push('FACEBOOK_REDIRECT_URI');
  } else if (provider === 'instagram') {
    const ig = resolveInstagramCreds();
    if (!ig.appId) missing.push('FACEBOOK_APP_ID');
    if (!ig.appSecret) missing.push('FACEBOOK_APP_SECRET');
    if (!ig.redirectUri) missing.push('INSTAGRAM_REDIRECT_URI');
  } else if (provider === 'linkedin') {
    if (!process.env.LINKEDIN_CLIENT_ID) missing.push('LINKEDIN_CLIENT_ID');
    if (!process.env.LINKEDIN_CLIENT_SECRET) missing.push('LINKEDIN_CLIENT_SECRET');
    if (!process.env.LINKEDIN_REDIRECT_URI) missing.push('LINKEDIN_REDIRECT_URI');
  } else if (provider === 'youtube') {
    const yt = resolveYoutubeCreds();
    if (!yt.clientId) missing.push('GOOGLE_CLIENT_ID');
    if (!yt.clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!yt.redirectUri) missing.push('YOUTUBE_REDIRECT_URI');
  } else if (provider === 'whatsapp') {
    if (!process.env.WHATSAPP_TOKEN) missing.push('WHATSAPP_TOKEN');
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  } else if (provider === 'opensms') {
    if (!process.env.OPENSMS_BASE_URL) missing.push('OPENSMS_BASE_URL');
    if (!process.env.OPENSMS_API_KEY) missing.push('OPENSMS_API_KEY');
  }
  return { configured: missing.length === 0, missingEnv: missing };
}

export type AuthorizeUrlResult =
  | { ok: true; authorizeUrl: string; state: string }
  | { ok: false; status: 'NOT_CONFIGURED'; missingEnv: string[] };

export function buildSocialAuthorizeUrl(
  provider: SocialOAuthProvider,
  returnTo?: string | null,
): AuthorizeUrlResult {
  const envCheck = checkProviderEnv(provider);
  if (!envCheck.configured) {
    return { ok: false, status: 'NOT_CONFIGURED', missingEnv: envCheck.missingEnv };
  }

  const state = createOAuthState(provider, safeReturnTo(returnTo, '/admin/marketing'));

  if (provider === 'instagram') {
    const ig = resolveInstagramCreds();
    const clientId = ig.appId;
    const redirectUri = ig.redirectUri;
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');
    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);
    return { ok: true, authorizeUrl: url.toString(), state };
  }

  if (provider === 'linkedin') {
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;
    const scopes = ['openid', 'profile', 'email', 'w_member_social'].join(' ');
    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('state', state);
    return { ok: true, authorizeUrl: url.toString(), state };
  }

  const yt = resolveYoutubeCreds();
  const clientId = yt.clientId;
  const redirectUri = yt.redirectUri;
  const scopes = [SCOPE_YOUTUBE_READONLY, SCOPE_YOUTUBE_UPLOAD].join(' ');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  return { ok: true, authorizeUrl: url.toString(), state };
}

export interface ExchangedSocialAccount {
  assetId: string;
  assetName: string;
  assetType: 'instagram_business' | 'linkedin_member' | 'youtube_channel';
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface ExchangedSocialCredentials {
  provider: SocialOAuthProvider;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  primaryAccountName: string;
  businessAccountId: string;
  accounts: ExchangedSocialAccount[];
}

export class SocialOAuthExchangeError extends Error {
  constructor(
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'SocialOAuthExchangeError';
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function exchangeSocialOAuthCode(
  provider: SocialOAuthProvider,
  code: string,
): Promise<ExchangedSocialCredentials> {
  const envCheck = checkProviderEnv(provider);
  if (!envCheck.configured) {
    throw new SocialOAuthExchangeError(
      503,
      `Missing environment configuration: ${envCheck.missingEnv.join(', ')}`,
    );
  }

  if (provider === 'instagram') {
    const ig = resolveInstagramCreds();
    const appId = ig.appId;
    const appSecret = ig.appSecret;
    const redirectUri = ig.redirectUri;

    const shortBody = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });
    const shortRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: shortBody.toString(),
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const shortJson = asObject(await shortRes.json().catch(() => ({})));
    const shortToken = typeof shortJson.access_token === 'string' ? shortJson.access_token : '';
    if (!shortRes.ok || !shortToken) {
      throw new SocialOAuthExchangeError(502, 'Instagram OAuth code exchange failed.');
    }

    const longBody = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    });
    const longRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: longBody.toString(),
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const longJson = asObject(await longRes.json().catch(() => ({})));
    const accessToken =
      typeof longJson.access_token === 'string' && longJson.access_token
        ? longJson.access_token
        : shortToken;
    const expiresIn = typeof longJson.expires_in === 'number' ? longJson.expires_in : 5_184_000;

    const pagesRes = await fetch(
      'https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,name,profile_picture_url}',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      },
    );
    const pagesJson = asObject(await pagesRes.json().catch(() => ({})));
    const pages = Array.isArray(pagesJson.data) ? pagesJson.data : [];

    const accounts: ExchangedSocialAccount[] = [];
    for (const rawPage of pages) {
      const page = asObject(rawPage);
      const ig = asObject(page.instagram_business_account);
      if (typeof ig.id === 'string' && ig.id) {
        const username = typeof ig.username === 'string' ? ig.username : '';
        const name = typeof ig.name === 'string' ? ig.name : username || String(page.name || ig.id);
        accounts.push({
          assetId: ig.id,
          assetName: username ? `@${username}` : name,
          assetType: 'instagram_business',
          avatar: typeof ig.profile_picture_url === 'string' ? ig.profile_picture_url : '',
          metadata: { facebookPageId: page.id, facebookPageName: page.name },
        });
      }
    }

    if (accounts.length === 0) {
      throw new SocialOAuthExchangeError(
        422,
        'No Instagram Business Account is linked to the authorized Facebook Pages.',
      );
    }

    return {
      provider: 'instagram',
      accessToken,
      refreshToken: null,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      primaryAccountName: accounts[0].assetName,
      businessAccountId: accounts[0].assetId,
      accounts,
    };
  }

  if (provider === 'linkedin') {
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const tokenJson = asObject(await tokenRes.json().catch(() => ({})));
    const accessToken = typeof tokenJson.access_token === 'string' ? tokenJson.access_token : '';
    if (!tokenRes.ok || !accessToken) {
      throw new SocialOAuthExchangeError(502, 'LinkedIn OAuth code exchange failed.');
    }
    const refreshToken = typeof tokenJson.refresh_token === 'string' ? tokenJson.refresh_token : null;
    const expiresIn = typeof tokenJson.expires_in === 'number' ? tokenJson.expires_in : 5_184_000;

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const profileJson = asObject(await profileRes.json().catch(() => ({})));
    const sub = typeof profileJson.sub === 'string' ? profileJson.sub.trim() : '';
    if (!profileRes.ok || !sub) {
      throw new SocialOAuthExchangeError(502, 'LinkedIn userinfo verification failed.');
    }
    const displayName =
      typeof profileJson.name === 'string' && profileJson.name.trim()
        ? profileJson.name.trim()
        : `LinkedIn (${sub})`;
    const urn = `urn:li:person:${sub}`;

    return {
      provider: 'linkedin',
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      primaryAccountName: displayName,
      businessAccountId: urn,
      accounts: [
        {
          assetId: urn,
          assetName: displayName,
          assetType: 'linkedin_member',
          avatar: typeof profileJson.picture === 'string' ? profileJson.picture : '',
        },
      ],
    };
  }

  // YouTube (Google OAuth 2.0 + YouTube Data API v3)
  const yt = resolveYoutubeCreds();
  const clientId = yt.clientId;
  const clientSecret = yt.clientSecret;
  const redirectUri = yt.redirectUri;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  const tokenJson = asObject(await tokenRes.json().catch(() => ({})));
  const accessToken = typeof tokenJson.access_token === 'string' ? tokenJson.access_token : '';
  if (!tokenRes.ok || !accessToken) {
    throw new SocialOAuthExchangeError(502, 'YouTube Google OAuth code exchange failed.');
  }
  const refreshToken = typeof tokenJson.refresh_token === 'string' ? tokenJson.refresh_token : null;
  const expiresIn = typeof tokenJson.expires_in === 'number' ? tokenJson.expires_in : 3600;

  const chanRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    },
  );
  const chanJson = asObject(await chanRes.json().catch(() => ({})));
  const items = Array.isArray(chanJson.items) ? chanJson.items : [];
  if (!chanRes.ok || items.length === 0) {
    throw new SocialOAuthExchangeError(
      422,
      'No YouTube channel was found on the authorized Google account.',
    );
  }

  const accounts: ExchangedSocialAccount[] = [];
  for (const raw of items) {
    const ch = asObject(raw);
    const snippet = asObject(ch.snippet);
    const thumbs = asObject(asObject(snippet.thumbnails).default);
    const id = typeof ch.id === 'string' ? ch.id : '';
    if (!id) continue;
    accounts.push({
      assetId: id,
      assetName: typeof snippet.title === 'string' ? snippet.title : id,
      assetType: 'youtube_channel',
      avatar: typeof thumbs.url === 'string' ? thumbs.url : '',
    });
  }

  if (accounts.length === 0) {
    throw new SocialOAuthExchangeError(422, 'YouTube channel response contained no valid channel ID.');
  }

  return {
    provider: 'youtube',
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    primaryAccountName: accounts[0].assetName,
    businessAccountId: accounts[0].assetId,
    accounts,
  };
}

export async function persistSocialCredentials(
  credentials: ExchangedSocialCredentials,
  actorUserId?: string | null,
) {
  const encryptedAccess = encryptStoredToken(credentials.accessToken);
  const encryptedRefresh = credentials.refreshToken
    ? encryptStoredToken(credentials.refreshToken)
    : null;
  const now = new Date();

  return db.$transaction(async (tx) => {
    const existing = await tx.socialIntegration.findFirst({
      where: { provider: credentials.provider },
      orderBy: { updatedAt: 'desc' },
    });

    const integration = existing
      ? await tx.socialIntegration.update({
          where: { id: existing.id },
          data: {
            name: `${credentials.provider.toUpperCase()} (${credentials.primaryAccountName})`,
            status: 'verified_connected',
            connectedAccount: credentials.primaryAccountName,
            businessAccountId: credentials.businessAccountId,
            accessToken: encryptedAccess,
            ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
            tokenExpiresAt: credentials.expiresAt,
            healthStatus: 'healthy',
            lastSyncAt: now,
          },
        })
      : await tx.socialIntegration.create({
          data: {
            provider: credentials.provider,
            name: `${credentials.provider.toUpperCase()} (${credentials.primaryAccountName})`,
            status: 'verified_connected',
            connectedAccount: credentials.primaryAccountName,
            businessAccountId: credentials.businessAccountId,
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiresAt: credentials.expiresAt,
            healthStatus: 'healthy',
            lastSyncAt: now,
          },
        });

    await tx.socialAccount.deleteMany({ where: { integrationId: integration.id } });
    for (let index = 0; index < credentials.accounts.length; index++) {
      const account = credentials.accounts[index];
      await tx.socialAccount.create({
        data: {
          integrationId: integration.id,
          provider: credentials.provider,
          assetId: account.assetId,
          assetName: account.assetName,
          assetType: account.assetType,
          isPrimary: index === 0,
          status: 'active',
          metadata: JSON.stringify(account.metadata || {}),
        },
      });

      const existingSummary = await tx.socialConnectedAccount.findFirst({
        where: { platform: credentials.provider, accountId: account.assetId },
      });
      if (existingSummary) {
        await tx.socialConnectedAccount.update({
          where: { id: existingSummary.id },
          data: {
            accountName: account.assetName,
            avatar: account.avatar || '',
            status: 'verified_connected',
            lastSyncAt: now,
            tokenRef: integration.id,
          },
        });
      } else {
        await tx.socialConnectedAccount.create({
          data: {
            platform: credentials.provider,
            accountName: account.assetName,
            accountId: account.assetId,
            avatar: account.avatar || '',
            status: 'verified_connected',
            lastSyncAt: now,
            tokenRef: integration.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: actorUserId || undefined,
        action: 'SOCIAL_OAUTH_CONNECT',
        resource: 'SocialIntegration',
        resourceId: integration.id,
        details: JSON.stringify({
          provider: credentials.provider,
          accountCount: credentials.accounts.length,
          assetIds: credentials.accounts.map((a) => a.assetId),
        }),
      },
    });

    return integration;
  });
}

export interface SocialHealthReport {
  provider: string;
  status:
    | 'NOT_CONFIGURED'
    | 'TOKEN_MISSING'
    | 'TOKEN_EXPIRED'
    | 'DECRYPTION_FAILED'
    | 'STORED_READY'
    | 'LIVE_VERIFIED'
    | 'UPSTREAM_ERROR';
  envConfigured: boolean;
  missingEnv: string[];
  connectedAccount: string | null;
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  liveChecked: boolean;
  note: string;
}

export async function inspectSocialProviderHealth(
  provider: SocialPublishPlatform,
  liveProbe = false,
): Promise<SocialHealthReport> {
  const envCheck = checkProviderEnv(provider);
  if (!envCheck.configured) {
    return {
      provider,
      status: 'NOT_CONFIGURED',
      envConfigured: false,
      missingEnv: envCheck.missingEnv,
      connectedAccount: null,
      tokenExpiresAt: null,
      lastSyncAt: null,
      liveChecked: false,
      note: `Configure ${envCheck.missingEnv.join(', ')} in server environment settings.`,
    };
  }

  if (provider === 'facebook') {
    const fb = await db.facebookIntegration.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { connectedAt: 'desc' },
    });
    if (!fb || !fb.pageAccessToken) {
      return {
        provider,
        status: 'TOKEN_MISSING',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: null,
        tokenExpiresAt: null,
        lastSyncAt: null,
        liveChecked: false,
        note: 'Credentials configured, but no Facebook Page has completed OAuth yet.',
      };
    }
    const token = decryptStoredToken(fb.pageAccessToken);
    if (!token) {
      return {
        provider,
        status: 'DECRYPTION_FAILED',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: fb.pageName,
        tokenExpiresAt: null,
        lastSyncAt: fb.connectedAt.toISOString(),
        liveChecked: false,
        note: 'Stored Facebook Page token could not be decrypted under current ENCRYPTION_KEY.',
      };
    }
    if (!liveProbe) {
      return {
        provider,
        status: 'STORED_READY',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: fb.pageName,
        tokenExpiresAt: null,
        lastSyncAt: fb.connectedAt.toISOString(),
        liveChecked: false,
        note: 'Encrypted page token present in FacebookIntegration.',
      };
    }
    try {
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(fb.pageId)}?fields=id,name`,
        {
          headers: { Authorization: `Bearer ${token}` },
          redirect: 'error',
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!fbRes.ok) {
        return {
          provider,
          status: 'UPSTREAM_ERROR',
          envConfigured: true,
          missingEnv: [],
          connectedAccount: fb.pageName,
          tokenExpiresAt: null,
          lastSyncAt: fb.connectedAt.toISOString(),
          liveChecked: true,
          note: `Facebook Graph API probe returned HTTP ${fbRes.status}.`,
        };
      }
      return {
        provider,
        status: 'LIVE_VERIFIED',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: fb.pageName,
        tokenExpiresAt: null,
        lastSyncAt: new Date().toISOString(),
        liveChecked: true,
        note: 'Live Facebook Page token probe succeeded against Meta Graph API v19.0.',
      };
    } catch {
      return {
        provider,
        status: 'UPSTREAM_ERROR',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: fb.pageName,
        tokenExpiresAt: null,
        lastSyncAt: fb.connectedAt.toISOString(),
        liveChecked: true,
        note: 'Facebook Graph API endpoint was unreachable from this runtime.',
      };
    }
  }

  const foundIntegration = await db.socialIntegration.findFirst({
    where: { provider },
    orderBy: { updatedAt: 'desc' },
  });

  if (!foundIntegration || !foundIntegration.accessToken) {
    return {
      provider,
      status: 'TOKEN_MISSING',
      envConfigured: true,
      missingEnv: [],
      connectedAccount: null,
      tokenExpiresAt: null,
      lastSyncAt: null,
      liveChecked: false,
      note: 'Environment variables are present, but OAuth connection has not been completed yet.',
    };
  }

  let integration = foundIntegration;
  if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() <= Date.now()) {
    const refreshed = await refreshSocialIntegrationToken(integration);
    if (!refreshed.ok) {
      return {
        provider,
        status: 'TOKEN_EXPIRED',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: integration.connectedAccount,
        tokenExpiresAt: integration.tokenExpiresAt.toISOString(),
        lastSyncAt: integration.lastSyncAt?.toISOString() || null,
        liveChecked: false,
        note: refreshed.reason,
      };
    }
    integration = refreshed.integration;
  }

  const token = decryptStoredToken(integration.accessToken || '');
  if (!token) {
    return {
      provider,
      status: 'DECRYPTION_FAILED',
      envConfigured: true,
      missingEnv: [],
      connectedAccount: integration.connectedAccount,
      tokenExpiresAt: integration.tokenExpiresAt?.toISOString() || null,
      lastSyncAt: integration.lastSyncAt?.toISOString() || null,
      liveChecked: false,
      note: 'Stored token could not be decrypted with ENCRYPTION_KEY.',
    };
  }

  if (!liveProbe) {
    return {
      provider,
      status: 'STORED_READY',
      envConfigured: true,
      missingEnv: [],
      connectedAccount: integration.connectedAccount,
      tokenExpiresAt: integration.tokenExpiresAt?.toISOString() || null,
      lastSyncAt: integration.lastSyncAt?.toISOString() || null,
      liveChecked: false,
      note: 'Encrypted OAuth token is stored and unexpired. Live provider network check was not run.',
    };
  }

  const probeUrl =
    provider === 'instagram'
      ? `https://graph.facebook.com/v19.0/${encodeURIComponent(integration.businessAccountId || 'me')}?fields=id,username`
      : provider === 'linkedin'
        ? 'https://api.linkedin.com/v2/userinfo'
        : 'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true';

  try {
    const res = await fetch(probeUrl, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      await db.socialIntegration.update({
        where: { id: integration.id },
        data: { healthStatus: 'degraded' },
      });
      return {
        provider,
        status: 'UPSTREAM_ERROR',
        envConfigured: true,
        missingEnv: [],
        connectedAccount: integration.connectedAccount,
        tokenExpiresAt: integration.tokenExpiresAt?.toISOString() || null,
        lastSyncAt: integration.lastSyncAt?.toISOString() || null,
        liveChecked: true,
        note: `Provider health endpoint returned HTTP ${res.status}.`,
      };
    }
    const now = new Date();
    await db.socialIntegration.update({
      where: { id: integration.id },
      data: { healthStatus: 'healthy', lastSyncAt: now, status: 'verified_connected' },
    });
    return {
      provider,
      status: 'LIVE_VERIFIED',
      envConfigured: true,
      missingEnv: [],
      connectedAccount: integration.connectedAccount,
      tokenExpiresAt: integration.tokenExpiresAt?.toISOString() || null,
      lastSyncAt: now.toISOString(),
      liveChecked: true,
      note: 'Live token probe succeeded against official provider endpoint.',
    };
  } catch {
    return {
      provider,
      status: 'UPSTREAM_ERROR',
      envConfigured: true,
      missingEnv: [],
      connectedAccount: integration.connectedAccount,
      tokenExpiresAt: integration.tokenExpiresAt?.toISOString() || null,
      lastSyncAt: integration.lastSyncAt?.toISOString() || null,
      liveChecked: true,
      note: 'Provider endpoint was unreachable from this runtime.',
    };
  }
}

export interface PublishSocialInput {
  platform: SocialPublishPlatform;
  text: string;
  mediaUrl?: string;
  title?: string;
  actorUserId: string;
  calendarId?: string;
}

export interface PublishSocialResult {
  published: true;
  platform: SocialPublishPlatform;
  externalPostId: string;
  publishedAt: string;
}

function isBlockedPrivateHost(hostname: string): boolean {
  const lower = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!lower) return true;
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  const v4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    ) {
      return true;
    }
  }
  if (/^(fc|fd|fe80)/i.test(lower)) return true;
  return false;
}

function requireSafeHttpsUrl(raw: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new SocialOAuthExchangeError(400, `A valid HTTPS ${label} is required.`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new SocialOAuthExchangeError(400, `${label} must use HTTPS without embedded credentials.`);
  }
  if (isBlockedPrivateHost(parsed.hostname)) {
    throw new SocialOAuthExchangeError(400, `${label} cannot target private, loopback, or link-local hosts.`);
  }
  return parsed.toString();
}

export async function refreshSocialIntegrationToken<
  T extends {
    id: string;
    provider: string;
    accessToken: string | null;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
  },
>(
  integration: T,
): Promise<{ ok: true; integration: T } | { ok: false; reason: string }> {
  const rawRefresh = integration.refreshToken ? decryptStoredToken(integration.refreshToken) : '';
  if (!rawRefresh) {
    await db.socialIntegration
      .update({
        where: { id: integration.id },
        data: { healthStatus: 'reconnect_required', status: 'reconnect_required' },
      })
      .catch(() => null);
    return {
      ok: false,
      reason: 'Stored OAuth token has expired and no refresh token is available. Reconnect the account.',
    };
  }

  try {
    let tokenEndpoint = '';
    const params = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: rawRefresh });

    if (integration.provider === 'youtube') {
      const yt = resolveYoutubeCreds();
      if (!yt.clientId || !yt.clientSecret) {
        return { ok: false, reason: 'YouTube OAuth client credentials are not configured for token refresh.' };
      }
      tokenEndpoint = 'https://oauth2.googleapis.com/token';
      params.set('client_id', yt.clientId);
      params.set('client_secret', yt.clientSecret);
    } else if (integration.provider === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID || '';
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
      if (!clientId || !clientSecret) {
        return { ok: false, reason: 'LinkedIn OAuth client credentials are not configured for token refresh.' };
      }
      tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
      params.set('client_id', clientId);
      params.set('client_secret', clientSecret);
    } else {
      await db.socialIntegration
        .update({
          where: { id: integration.id },
          data: { healthStatus: 'reconnect_required', status: 'reconnect_required' },
        })
        .catch(() => null);
      return {
        ok: false,
        reason: `${integration.provider} requires interactive OAuth reconnection when long-lived token expires.`,
      };
    }

    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    const json = asObject(await res.json().catch(() => ({})));
    const nextAccess = typeof json.access_token === 'string' ? json.access_token.trim() : '';
    const nextRefresh = typeof json.refresh_token === 'string' ? json.refresh_token.trim() : '';
    const expiresIn =
      typeof json.expires_in === 'number' && Number.isFinite(json.expires_in) && json.expires_in > 0
        ? json.expires_in
        : 3600;

    if (!res.ok || !nextAccess) {
      await db.socialIntegration
        .update({
          where: { id: integration.id },
          data: { healthStatus: 'reconnect_required', status: 'reconnect_required' },
        })
        .catch(() => null);
      return {
        ok: false,
        reason: `OAuth refresh failed (HTTP ${res.status}). Reconnect the ${integration.provider} account.`,
      };
    }

    const encryptedAccess = encryptStoredToken(nextAccess);
    const encryptedRefresh = nextRefresh ? encryptStoredToken(nextRefresh) : integration.refreshToken;
    const nextExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await db.socialIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: nextExpiresAt,
        healthStatus: 'healthy',
        status: 'verified_connected',
      },
    });

    return {
      ok: true,
      integration: {
        ...integration,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: nextExpiresAt,
      },
    };
  } catch {
    return {
      ok: false,
      reason: `Could not reach ${integration.provider} OAuth token endpoint to refresh expired token.`,
    };
  }
}

export async function publishToSocialProvider(
  input: PublishSocialInput,
): Promise<PublishSocialResult> {
  if ((await isGlobalAiPaused()) || (await isScopedAiPaused('CHANNEL', input.platform))) {
    throw new SocialOAuthExchangeError(
      503,
      `Publishing is paused by GlobalAiPause for channel "${input.platform}".`,
    );
  }

  const text = input.text.trim();
  if (!text || text.length > 3000) {
    throw new SocialOAuthExchangeError(400, 'Post text must be between 1 and 3000 characters.');
  }

  let externalPostId = '';

  if (input.platform === 'facebook') {
    const page = await db.facebookIntegration.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { connectedAt: 'desc' },
    });
    if (!page || !page.pageAccessToken) {
      throw new SocialOAuthExchangeError(503, 'Facebook Page integration is not connected.');
    }
    const token = decryptStoredToken(page.pageAccessToken);
    if (!token) {
      throw new SocialOAuthExchangeError(503, 'Facebook Page token could not be decrypted.');
    }
    const payload: Record<string, string> = { message: text };
    if (input.mediaUrl) payload.link = requireSafeHttpsUrl(input.mediaUrl, 'mediaUrl');

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(page.pageId)}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      },
    );
    const json = asObject(await res.json().catch(() => ({})));
    if (!res.ok || typeof json.id !== 'string' || !json.id.trim()) {
      throw new SocialOAuthExchangeError(502, `Facebook publish failed (HTTP ${res.status}).`);
    }
    externalPostId = json.id.trim();
  } else {
    const foundIntegration = await db.socialIntegration.findFirst({
      where: { provider: input.platform },
      include: { accounts: { where: { status: 'active' }, orderBy: { isPrimary: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!foundIntegration || !foundIntegration.accessToken) {
      throw new SocialOAuthExchangeError(
        503,
        `${input.platform} integration is not connected. Connect via OAuth first.`,
      );
    }
    let integration = foundIntegration;
    if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() <= Date.now()) {
      const refreshed = await refreshSocialIntegrationToken(integration);
      if (!refreshed.ok) {
        throw new SocialOAuthExchangeError(503, refreshed.reason);
      }
      integration = refreshed.integration;
    }
    const token = decryptStoredToken(integration.accessToken || '');
    if (!token) {
      throw new SocialOAuthExchangeError(
        503,
        `${input.platform} access token could not be decrypted.`,
      );
    }
    const targetAssetId = integration.accounts[0]?.assetId || integration.businessAccountId || '';
    if (!targetAssetId) {
      throw new SocialOAuthExchangeError(503, `No target ${input.platform} account assetId is stored.`);
    }

    if (input.platform === 'instagram') {
      if (!input.mediaUrl) {
        throw new SocialOAuthExchangeError(
          400,
          'Instagram Content Publishing API requires an HTTPS mediaUrl (image); text-only posts are not supported by Instagram.',
        );
      }
      const imageUrl = requireSafeHttpsUrl(input.mediaUrl, 'Instagram image_url');
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(targetAssetId)}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ image_url: imageUrl, caption: text }),
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
        },
      );
      const containerJson = asObject(await containerRes.json().catch(() => ({})));
      const creationId = typeof containerJson.id === 'string' ? containerJson.id.trim() : '';
      if (!containerRes.ok || !creationId) {
        throw new SocialOAuthExchangeError(
          502,
          `Instagram media container creation failed (HTTP ${containerRes.status}).`,
        );
      }

      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(targetAssetId)}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ creation_id: creationId }),
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
        },
      );
      const publishJson = asObject(await publishRes.json().catch(() => ({})));
      if (!publishRes.ok || typeof publishJson.id !== 'string' || !publishJson.id.trim()) {
        throw new SocialOAuthExchangeError(
          502,
          `Instagram media publish failed (HTTP ${publishRes.status}).`,
        );
      }
      externalPostId = publishJson.id.trim();
    } else if (input.platform === 'linkedin') {
      const author = targetAssetId.startsWith('urn:li:')
        ? targetAssetId
        : `urn:li:person:${targetAssetId}`;
      const postBody: Record<string, unknown> = {
        author,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      };
      if (input.mediaUrl) {
        const articleSource = requireSafeHttpsUrl(input.mediaUrl, 'LinkedIn article URL');
        postBody.content = {
          article: {
            source: articleSource,
            title: (input.title || text.slice(0, 80)).slice(0, 200),
          },
        };
      }

      const linkedinVersion = (process.env.LINKEDIN_API_VERSION || '202604').trim();
      const res = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'LinkedIn-Version': linkedinVersion,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      });
      const restliId = res.headers.get('x-restli-id')?.trim() || '';
      const json = asObject(await res.json().catch(() => ({})));
      const bodyId = typeof json.id === 'string' ? json.id.trim() : '';
      const postId = restliId || bodyId;
      if (!res.ok || !postId) {
        throw new SocialOAuthExchangeError(502, `LinkedIn publish failed (HTTP ${res.status}).`);
      }
      externalPostId = postId;
    } else {
      // YouTube Data API v3: requires an HTTPS video mediaUrl; text-only posts are refused honestly.
      if (!input.mediaUrl) {
        throw new SocialOAuthExchangeError(
          422,
          'YouTube Data API v3 requires a binary video stream upload (videos.insert); text or link posts cannot be published as YouTube videos.',
        );
      }
      const videoSourceUrl = requireSafeHttpsUrl(input.mediaUrl, 'YouTube video mediaUrl');
      const mediaRes = await fetch(videoSourceUrl, {
        method: 'GET',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });
      const contentType = (mediaRes.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!mediaRes.ok || !contentType.startsWith('video/')) {
        throw new SocialOAuthExchangeError(
          422,
          'YouTube Data API v3 requires a reachable HTTPS video/* stream; non-video links cannot be uploaded as YouTube videos.',
        );
      }
      const MAX_YT_BYTES = 50 * 1024 * 1024;
      const declaredLen = Number(mediaRes.headers.get('content-length') || '0');
      if (declaredLen > MAX_YT_BYTES) {
        throw new SocialOAuthExchangeError(413, 'Video asset exceeds 50 MB inline upload ceiling.');
      }
      const videoBuffer = new Uint8Array(await mediaRes.arrayBuffer());
      if (videoBuffer.byteLength === 0 || videoBuffer.byteLength > MAX_YT_BYTES) {
        throw new SocialOAuthExchangeError(
          422,
          'Video stream must be non-empty and at most 50 MB.',
        );
      }

      const initRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Length': String(videoBuffer.byteLength),
            'X-Upload-Content-Type': contentType,
          },
          body: JSON.stringify({
            snippet: {
              title: (input.title || text.slice(0, 95)).slice(0, 100),
              description: text,
            },
            status: {
              privacyStatus: 'unlisted',
              selfDeclaredMadeForKids: false,
            },
          }),
          redirect: 'error',
          signal: AbortSignal.timeout(20_000),
        },
      );
      const uploadLocation = initRes.headers.get('location')?.trim() || '';
      if (!initRes.ok || !uploadLocation.startsWith('https://www.googleapis.com/')) {
        throw new SocialOAuthExchangeError(
          502,
          `YouTube resumable upload session failed (HTTP ${initRes.status}).`,
        );
      }

      const putRes = await fetch(uploadLocation, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType,
          'Content-Length': String(videoBuffer.byteLength),
        },
        body: videoBuffer,
        redirect: 'error',
        signal: AbortSignal.timeout(60_000),
      });
      const ytJson = asObject(await putRes.json().catch(() => ({})));
      const videoId = typeof ytJson.id === 'string' ? ytJson.id.trim() : '';
      if (!putRes.ok || !videoId) {
        throw new SocialOAuthExchangeError(
          502,
          `YouTube video upload failed (HTTP ${putRes.status}).`,
        );
      }
      externalPostId = videoId;
    }
  }

  const publishedAt = new Date();
  await db.$transaction(async (tx) => {
    if (input.calendarId) {
      await tx.marketingCalendar.updateMany({
        where: { id: input.calendarId },
        data: {
          status: 'published',
          publishedAt,
          failedAt: null,
          failReason: '',
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorUserId,
        action: 'SOCIAL_POST_PUBLISHED',
        resource: 'MarketingCalendar',
        resourceId: input.calendarId || externalPostId,
        details: JSON.stringify({
          platform: input.platform,
          externalPostId,
          publishedAt: publishedAt.toISOString(),
        }),
      },
    });
  });

  return {
    published: true,
    platform: input.platform,
    externalPostId,
    publishedAt: publishedAt.toISOString(),
  };
}
