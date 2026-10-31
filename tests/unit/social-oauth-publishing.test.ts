import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  socialIntegrationFindFirst: vi.fn(),
  socialIntegrationCreate: vi.fn(),
  socialIntegrationUpdate: vi.fn(),
  socialAccountDeleteMany: vi.fn(),
  socialAccountCreate: vi.fn(),
  socialConnectedFindFirst: vi.fn(),
  socialConnectedCreate: vi.fn(),
  socialConnectedUpdate: vi.fn(),
  facebookIntegrationFindFirst: vi.fn(),
  marketingContentFindUnique: vi.fn(),
  marketingCalendarUpdateMany: vi.fn(),
  auditLogCreate: vi.fn(),
  transaction: vi.fn(),
  isGlobalAiPaused: vi.fn(),
  isScopedAiPaused: vi.fn(),
  authenticateRequest: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    socialIntegration: {
      findFirst: mocks.socialIntegrationFindFirst,
      create: mocks.socialIntegrationCreate,
      update: mocks.socialIntegrationUpdate,
    },
    facebookIntegration: {
      findFirst: mocks.facebookIntegrationFindFirst,
    },
    marketingGeneratedContent: {
      findUnique: mocks.marketingContentFindUnique,
    },
    marketingCalendar: {
      updateMany: mocks.marketingCalendarUpdateMany,
    },
    auditLog: {
      create: mocks.auditLogCreate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock('@/lib/ai-safety', () => ({
  isGlobalAiPaused: mocks.isGlobalAiPaused,
  isScopedAiPaused: mocks.isScopedAiPaused,
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: mocks.authenticateRequest,
  withAuth: (handler: any) => async (req: Request, ctx?: any) => {
    const auth = await mocks.authenticateRequest(req);
    if (auth instanceof Response) return auth;
    return handler(req, auth, ctx);
  },
}));

import { verifyOAuthState } from '@/lib/social/oauth-state';
import { encryptStoredToken, isEncrypted } from '@/lib/social/token-encryption';
import {
  buildSocialAuthorizeUrl,
  exchangeSocialOAuthCode,
  persistSocialCredentials,
  publishToSocialProvider,
} from '@/lib/social/providers';
import { POST as publishRoute } from '@/app/api/marketing/social/publish/route';

function jsonRes(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.fetch.mockReset();
  mocks.isGlobalAiPaused.mockReset().mockResolvedValue(false);
  mocks.isScopedAiPaused.mockReset().mockResolvedValue(false);
  mocks.authenticateRequest.mockReset().mockResolvedValue({
    userId: 'mgr-1',
    actorUserId: 'mgr-1',
    userType: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  });
  mocks.socialIntegrationFindFirst.mockReset().mockResolvedValue(null);
  mocks.socialIntegrationCreate.mockReset().mockResolvedValue({ id: 'int-1' });
  mocks.socialIntegrationUpdate.mockReset().mockResolvedValue({ id: 'int-1' });
  mocks.socialAccountDeleteMany.mockReset().mockResolvedValue({ count: 0 });
  mocks.socialAccountCreate.mockReset().mockResolvedValue({});
  mocks.socialConnectedFindFirst.mockReset().mockResolvedValue(null);
  mocks.socialConnectedCreate.mockReset().mockResolvedValue({});
  mocks.socialConnectedUpdate.mockReset().mockResolvedValue({});
  mocks.facebookIntegrationFindFirst.mockReset().mockResolvedValue(null);
  mocks.marketingContentFindUnique.mockReset().mockResolvedValue(null);
  mocks.marketingCalendarUpdateMany.mockReset().mockResolvedValue({ count: 1 });
  mocks.auditLogCreate.mockReset().mockResolvedValue({});

  mocks.transaction.mockReset().mockImplementation((fn) =>
    fn({
      socialIntegration: {
        findFirst: mocks.socialIntegrationFindFirst,
        create: mocks.socialIntegrationCreate,
        update: mocks.socialIntegrationUpdate,
      },
      socialAccount: {
        deleteMany: mocks.socialAccountDeleteMany,
        create: mocks.socialAccountCreate,
      },
      socialConnectedAccount: {
        findFirst: mocks.socialConnectedFindFirst,
        create: mocks.socialConnectedCreate,
        update: mocks.socialConnectedUpdate,
      },
      marketingCalendar: {
        updateMany: mocks.marketingCalendarUpdateMany,
      },
      auditLog: {
        create: mocks.auditLogCreate,
      },
    }),
  );

  vi.stubEnv('NEXTAUTH_SECRET', 'unit-test-nextauth-secret-32chars-minimum');
  vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
  vi.stubEnv(
    'ENCRYPTION_KEY',
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  );
  vi.stubEnv('FACEBOOK_APP_ID', 'fb-app-1');
  vi.stubEnv('FACEBOOK_APP_SECRET', 'fb-secret-placeholder');
  vi.stubEnv('INSTAGRAM_REDIRECT_URI', 'https://alo.test/api/social/instagram/callback');
  vi.stubEnv('LINKEDIN_CLIENT_ID', 'li-client-1');
  vi.stubEnv('LINKEDIN_CLIENT_SECRET', 'li-secret-placeholder');
  vi.stubEnv('LINKEDIN_REDIRECT_URI', 'https://alo.test/api/social/linkedin/callback');
  vi.stubEnv('GOOGLE_CLIENT_ID', 'yt-client-1');
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'yt-secret-placeholder');
  vi.stubEnv('YOUTUBE_REDIRECT_URI', 'https://alo.test/api/social/youtube/callback');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Instagram, LinkedIn and YouTube OAuth + Encrypted Persistence', () => {
  it('returns NOT_CONFIGURED with missing env vars rather than fabricating URLs', () => {
    vi.stubEnv('LINKEDIN_CLIENT_ID', '');
    const res = buildSocialAuthorizeUrl('linkedin', '/admin/marketing');
    expect(res).toEqual({
      ok: false,
      status: 'NOT_CONFIGURED',
      missingEnv: ['LINKEDIN_CLIENT_ID'],
    });
  });

  it('builds provider-bound signed OAuth URLs that reject cross-provider state replay', () => {
    const ig = buildSocialAuthorizeUrl('instagram', '/admin/marketing');
    const li = buildSocialAuthorizeUrl('linkedin', 'https://evil.example/phish');
    const yt = buildSocialAuthorizeUrl('youtube', '/admin/marketing');

    expect(ig.ok && li.ok && yt.ok).toBe(true);
    if (!ig.ok || !li.ok || !yt.ok) return;

    expect(verifyOAuthState(ig.state, 'instagram').ok).toBe(true);
    expect(verifyOAuthState(ig.state, 'linkedin')).toEqual({
      ok: false,
      reason: 'provider-mismatch',
    });
    const verifiedLi = verifyOAuthState(li.state, 'linkedin');
    expect(verifiedLi.ok && verifiedLi.payload.returnTo).toBe('/admin/marketing');
    expect(yt.authorizeUrl).toContain('youtube.upload');
  });

  it('exchanges LinkedIn code, encrypts tokens at rest, and never writes plaintext tokens to DB', async () => {
    mocks.fetch
      .mockResolvedValueOnce(
        jsonRes({
          access_token: 'raw-linkedin-access-token',
          refresh_token: 'raw-linkedin-refresh-token',
          expires_in: 3600,
        }),
      )
      .mockResolvedValueOnce(
        jsonRes({
          sub: 'member123',
          name: 'ALO Education Official',
          picture: 'https://media.licdn.com/avatar.jpg',
        }),
      );

    const creds = await exchangeSocialOAuthCode('linkedin', 'oauth-code-1');
    expect(creds.businessAccountId).toBe('urn:li:person:member123');

    await persistSocialCredentials(creds, 'mgr-1');

    const createData = mocks.socialIntegrationCreate.mock.calls[0][0].data;
    expect(isEncrypted(createData.accessToken)).toBe(true);
    expect(isEncrypted(createData.refreshToken)).toBe(true);
    expect(JSON.stringify(mocks.socialIntegrationCreate.mock.calls)).not.toContain(
      'raw-linkedin-access-token',
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledOnce();
  });

  it('refuses Instagram OAuth completion when no Instagram Business Account is linked', async () => {
    mocks.fetch
      .mockResolvedValueOnce(jsonRes({ access_token: 'short-tok' }))
      .mockResolvedValueOnce(jsonRes({ access_token: 'long-tok', expires_in: 5000 }))
      .mockResolvedValueOnce(jsonRes({ data: [{ id: 'page-1', name: 'Page Without IG' }] }));

    await expect(exchangeSocialOAuthCode('instagram', 'code-ig')).rejects.toMatchObject({
      httpStatus: 422,
    });
  });
});

describe('Approved Social Publishing Engine & Safety Gates', () => {
  it('blocks publishing unapproved MarketingGeneratedContent at the route boundary', async () => {
    mocks.marketingContentFindUnique.mockResolvedValue({ id: 'cnt-1', status: 'draft' });

    const req = new Request('https://alo.test/api/marketing/social/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://alo.test' },
      body: JSON.stringify({
        platform: 'linkedin',
        text: 'Study in the UK — January 2027 intake open.',
        contentId: 'cnt-1',
      }),
    });

    const res = await publishRoute(req);
    expect(res.status).toBe(409);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('executes 2-step Instagram Graph publishing (media container -> media_publish) and rejects text-only IG posts', async () => {
    const encrypted = encryptStoredToken('ig-real-token');
    mocks.socialIntegrationFindFirst.mockResolvedValue({
      id: 'int-ig',
      provider: 'instagram',
      accessToken: encrypted,
      tokenExpiresAt: new Date(Date.now() + 86_400_000),
      businessAccountId: 'ig-biz-99',
      accounts: [{ assetId: 'ig-biz-99', isPrimary: true, status: 'active' }],
    });

    await expect(
      publishToSocialProvider({
        platform: 'instagram',
        text: 'Text without image',
        actorUserId: 'mgr-1',
      }),
    ).rejects.toMatchObject({ httpStatus: 400 });

    mocks.fetch
      .mockResolvedValueOnce(jsonRes({ id: 'container-77' }))
      .mockResolvedValueOnce(jsonRes({ id: 'ig-post-88' }));

    const published = await publishToSocialProvider({
      platform: 'instagram',
      text: 'Apply early for September intake.',
      mediaUrl: 'https://aloeducation.com/images/banner.jpg',
      actorUserId: 'mgr-1',
      calendarId: 'cal-1',
    });

    expect(published.externalPostId).toBe('ig-post-88');
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.marketingCalendarUpdateMany).toHaveBeenCalledOnce();
  });

  it('respects GlobalAiPause and refuses fake text-as-video YouTube publishing', async () => {
    const encrypted = encryptStoredToken('yt-real-token');
    mocks.socialIntegrationFindFirst.mockResolvedValue({
      id: 'int-yt',
      provider: 'youtube',
      accessToken: encrypted,
      tokenExpiresAt: new Date(Date.now() + 86_400_000),
      businessAccountId: 'UC12345',
      accounts: [{ assetId: 'UC12345', isPrimary: true, status: 'active' }],
    });

    await expect(
      publishToSocialProvider({
        platform: 'youtube',
        text: 'Text post is not a video',
        actorUserId: 'mgr-1',
      }),
    ).rejects.toMatchObject({ httpStatus: 422 });

    mocks.isGlobalAiPaused.mockResolvedValueOnce(true);
    await expect(
      publishToSocialProvider({
        platform: 'linkedin',
        text: 'Paused post',
        actorUserId: 'mgr-1',
      }),
    ).rejects.toMatchObject({ httpStatus: 503 });
  });

  it('refreshes expired YouTube OAuth token via refresh_token and completes 2-step resumable video upload', async () => {
    const expiredAccess = encryptStoredToken('yt-expired-token');
    const storedRefresh = encryptStoredToken('yt-refresh-token');
    mocks.socialIntegrationFindFirst.mockResolvedValue({
      id: 'int-yt-exp',
      provider: 'youtube',
      accessToken: expiredAccess,
      refreshToken: storedRefresh,
      tokenExpiresAt: new Date(Date.now() - 60_000),
      connectedAccount: 'ALO YouTube',
      businessAccountId: 'UC12345',
      lastSyncAt: null,
      accounts: [{ assetId: 'UC12345', isPrimary: true, status: 'active' }],
    });

    const videoBytes = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
    mocks.fetch
      // 1. OAuth refresh_token exchange
      .mockResolvedValueOnce(jsonRes({ access_token: 'yt-fresh-token', expires_in: 3600 }))
      // 2. Fetch public HTTPS video asset
      .mockResolvedValueOnce(
        new Response(videoBytes, {
          status: 200,
          headers: { 'content-type': 'video/mp4', 'content-length': String(videoBytes.byteLength) },
        }),
      )
      // 3. YouTube resumable session initiation
      .mockResolvedValueOnce(
        new Response('', {
          status: 200,
          headers: { location: 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=abc123' },
        }),
      )
      // 4. YouTube PUT video bytes
      .mockResolvedValueOnce(jsonRes({ id: 'yt-video-id-900' }));

    const result = await publishToSocialProvider({
      platform: 'youtube',
      title: 'Study in UK Guide',
      text: 'Official source-linked UK admission guide.',
      mediaUrl: 'https://aloeducation.com/videos/uk-guide.mp4',
      actorUserId: 'mgr-1',
      calendarId: 'cal-yt',
    });

    expect(result.externalPostId).toBe('yt-video-id-900');
    expect(mocks.socialIntegrationUpdate).toHaveBeenCalledOnce();
    const refreshWrite = mocks.socialIntegrationUpdate.mock.calls[0][0].data;
    expect(isEncrypted(refreshWrite.accessToken)).toBe(true);
    expect(JSON.stringify(mocks.socialIntegrationUpdate.mock.calls)).not.toContain('yt-fresh-token');
  });

  it('uses active LinkedIn-Version 202604 header, blocks SSRF mediaUrl, and aborts if audit write fails', async () => {
    const encrypted = encryptStoredToken('li-token');
    mocks.socialIntegrationFindFirst.mockResolvedValue({
      id: 'int-li',
      provider: 'linkedin',
      accessToken: encrypted,
      refreshToken: '',
      tokenExpiresAt: new Date(Date.now() + 86_400_000),
      connectedAccount: 'ALO LinkedIn',
      businessAccountId: 'urn:li:person:abc',
      lastSyncAt: null,
      accounts: [{ assetId: 'urn:li:person:abc', isPrimary: true, status: 'active' }],
    });

    // Block loopback SSRF mediaUrl
    await expect(
      publishToSocialProvider({
        platform: 'linkedin',
        text: 'Internal host test',
        mediaUrl: 'https://127.0.0.1/internal.pdf',
        actorUserId: 'mgr-1',
      }),
    ).rejects.toMatchObject({ httpStatus: 400 });

    // LinkedIn-Version 202604 check
    mocks.fetch.mockResolvedValueOnce(
      new Response('{}', { status: 201, headers: { 'x-restli-id': 'urn:li:share:555' } }),
    );
    const ok = await publishToSocialProvider({
      platform: 'linkedin',
      text: 'Australia scholarships update.',
      actorUserId: 'mgr-1',
    });
    expect(ok.externalPostId).toBe('urn:li:share:555');
    const liHeaders = mocks.fetch.mock.calls[0][1].headers;
    expect(liHeaders['LinkedIn-Version']).toBe('202604');

    // Audit failure aborts transaction
    mocks.fetch.mockResolvedValueOnce(
      new Response('{}', { status: 201, headers: { 'x-restli-id': 'urn:li:share:556' } }),
    );
    mocks.auditLogCreate.mockRejectedValueOnce(new Error('audit write failed'));
    await expect(
      publishToSocialProvider({
        platform: 'linkedin',
        text: 'Audit rollback test',
        actorUserId: 'mgr-1',
      }),
    ).rejects.toThrow('audit write failed');
  });
});
