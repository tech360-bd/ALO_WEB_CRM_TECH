/**
 * Shared Google OAuth 2.0 token acquisition.
 *
 * Every Google API ALO calls (Search Console, Business Profile, YouTube) uses
 * the same two credential shapes and the same token endpoint. Signing a service
 * account JWT correctly is fiddly enough that having three copies would
 * guarantee three divergent bugs, so this module is the only place it happens.
 *
 * Two supported modes — both real, neither mocked:
 *
 *   1. **Service account** (`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON` or
 *      `GOOGLE_SERVICE_ACCOUNT_JSON`, inline or base64). A self-signed RS256 JWT
 *      is exchanged for an access token. The service account must be granted
 *      access on the target Google product; Google never grants it implicitly.
 *   2. **OAuth refresh token** (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` +
 *      `GOOGLE_OAUTH_REFRESH_TOKEN`).
 *
 * Tokens are cached per scope until 60s before expiry.
 *
 * Nothing here logs or returns a secret. Error messages are reduced to a fixed
 * string plus the error *name*, because a fetch failure message includes the
 * request URL — and for the token endpoint that URL carries the credential.
 */

import { createSign, createPrivateKey, randomUUID } from 'node:crypto';

/** Read-only Search Console. */
export const SCOPE_SEARCH_CONSOLE = 'https://www.googleapis.com/auth/webmasters.readonly';
/** Manage Business Profile locations, posts and reviews. */
export const SCOPE_BUSINESS_PROFILE = 'https://www.googleapis.com/auth/business.manage';
/** Read YouTube channel and video metadata. */
export const SCOPE_YOUTUBE_READONLY = 'https://www.googleapis.com/auth/youtube.readonly';
/** Upload to YouTube. Requested only when ALO actually publishes. */
export const SCOPE_YOUTUBE_UPLOAD = 'https://www.googleapis.com/auth/youtube.upload';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_TIMEOUT_MS = 15_000;
const EXPIRY_SKEW_SECONDS = 60;

export type GoogleAuthStatus = 'READY' | 'NOT_CONFIGURED' | 'AUTH_FAILED' | 'API_ERROR' | 'TIMEOUT';

export type GoogleAuthMode = 'service_account' | 'oauth_refresh_token' | 'none';

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
  type?: string;
}

export interface GoogleCredential {
  mode: GoogleAuthMode;
  serviceAccount?: ServiceAccountKey;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export type GoogleApiResult<T> =
  | { status: 'READY'; data: T; fetchedAt: string }
  | { status: Exclude<GoogleAuthStatus, 'READY'>; reason: string; httpStatus?: number; googleErrorReason?: string };

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Parse whichever credential the operator configured. */
export function resolveGoogleCredential(env: NodeJS.ProcessEnv = process.env): GoogleCredential {
  const raw =
    (env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON || '').trim() ||
    (env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
  if (raw) {
    // Accept inline JSON or base64-wrapped JSON, matching .env.example.
    const candidates = [raw];
    try {
      candidates.push(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      /* not base64 */
    }
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as Partial<ServiceAccountKey>;
        if (parsed.client_email && parsed.private_key) {
          return {
            mode: 'service_account',
            serviceAccount: {
              client_email: parsed.client_email,
              private_key: parsed.private_key.replace(/\\n/g, '\n'),
              token_uri: parsed.token_uri,
              type: parsed.type,
            },
          };
        }
      } catch {
        /* try the next candidate */
      }
    }
  }

  const clientId = (env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (env.GOOGLE_CLIENT_SECRET || '').trim();
  const refreshToken =
    (env.GOOGLE_OAUTH_REFRESH_TOKEN || '').trim() ||
    (env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN || '').trim();
  if (clientId && clientSecret && refreshToken) {
    return { mode: 'oauth_refresh_token', clientId, clientSecret, refreshToken };
  }

  return { mode: 'none' };
}

/** Secret-free credential description, safe to return to an admin UI. */
export function describeGoogleCredential(env: NodeJS.ProcessEnv = process.env): {
  mode: GoogleAuthMode;
  configured: boolean;
  serviceAccountEmail?: string;
  reason: string;
} {
  const credential = resolveGoogleCredential(env);
  if (credential.mode === 'none') {
    return {
      mode: 'none',
      configured: false,
      reason:
        'NOT CONFIGURED — supply GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON (service account JSON, inline or base64) or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN.',
    };
  }
  return {
    mode: credential.mode,
    configured: true,
    ...(credential.serviceAccount ? { serviceAccountEmail: credential.serviceAccount.client_email } : {}),
    reason:
      credential.mode === 'service_account'
        ? `Service account ${credential.serviceAccount?.client_email}. It must be granted access on each Google product it is used with — Google does not grant access implicitly.`
        : 'OAuth refresh token. The authorising Google account must have access to the target product.',
  };
}

/** Build and sign the service-account assertion JWT for a given scope. */
function signAssertion(key: ServiceAccountKey, scope: string, nowSeconds: number): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: key.client_email,
    scope,
    aud: key.token_uri || TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    jti: randomUUID(),
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${base64url(signer.sign(createPrivateKey(key.private_key)))}`;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

/** One cache entry per scope — different scopes need different tokens. */
const tokenCache = new Map<string, CachedToken>();

/** Forget cached tokens. Call after a 401 so the next attempt re-authenticates. */
export function clearGoogleTokenCache(scope?: string): void {
  if (scope) tokenCache.delete(scope);
  else tokenCache.clear();
}

/**
 * Obtain an access token for a scope.
 *
 * Returns a discriminated union so a caller cannot accidentally treat a failure
 * as a token.
 */
export async function getGoogleAccessToken(
  scope: string,
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<
  | { accessToken: string }
  // The error arm cannot include 'READY', so a caller that destructures
  // `{ status: token.error }` into GoogleApiResult type-checks without a cast.
  | { error: Exclude<GoogleAuthStatus, 'READY'>; reason: string; httpStatus?: number }
> {
  const credential = resolveGoogleCredential(env);
  if (credential.mode === 'none') {
    return { error: 'NOT_CONFIGURED', reason: describeGoogleCredential(env).reason };
  }

  const cached = tokenCache.get(scope);
  const now = Date.now();
  if (cached && cached.expiresAt - EXPIRY_SKEW_SECONDS * 1000 > now) {
    return { accessToken: cached.accessToken };
  }

  const form = new URLSearchParams();
  if (credential.mode === 'service_account' && credential.serviceAccount) {
    form.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    form.set('assertion', signAssertion(credential.serviceAccount, scope, Math.floor(now / 1000)));
  } else if (credential.clientId && credential.clientSecret && credential.refreshToken) {
    form.set('grant_type', 'refresh_token');
    form.set('client_id', credential.clientId);
    form.set('client_secret', credential.clientSecret);
    form.set('refresh_token', credential.refreshToken);
  } else {
    return { error: 'NOT_CONFIGURED', reason: describeGoogleCredential(env).reason };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(credential.serviceAccount?.token_uri || TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error) {
    const aborted = (error as Error)?.name === 'AbortError';
    return {
      error: aborted ? 'TIMEOUT' : 'AUTH_FAILED',
      reason: aborted
        ? `Google's token endpoint did not respond within ${timeoutMs / 1000}s.`
        : "Could not reach Google's token endpoint. The website and CRM are unaffected.",
    };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let googleReason = '';
    try {
      const parsed = (await response.json()) as { error?: string; error_description?: string };
      googleReason = parsed.error || parsed.error_description || '';
    } catch {
      googleReason = '';
    }
    return {
      error: response.status === 401 || response.status === 403 ? 'AUTH_FAILED' : 'API_ERROR',
      httpStatus: response.status,
      reason: `Google rejected the credential for scope ${scope} (HTTP ${response.status}).${googleReason ? ` Reason: ${googleReason}.` : ''}`,
    };
  }

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) {
    return { error: 'AUTH_FAILED', reason: 'Google returned no access token.' };
  }
  tokenCache.set(scope, {
    accessToken: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600) * 1000,
  });
  return { accessToken: payload.access_token };
}

/** Extract Google's own error reason from a failed response, without the body. */
async function readGoogleError(response: Response): Promise<string> {
  try {
    const parsed = (await response.json()) as { error?: { reason?: string; message?: string; status?: string } };
    return parsed.error?.reason || parsed.error?.status || parsed.error?.message || '';
  } catch {
    return '';
  }
}

/**
 * Make an authenticated Google API request.
 *
 * Retries once on 401 with a freshly minted token, because a cached token can
 * expire between the cache check and the request. Any other failure is returned
 * as a status, never thrown.
 */
export async function googleApiRequest<T>(
  scope: string,
  url: string,
  init: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {},
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GoogleApiResult<T>> {
  const attempt = async (forceRefresh: boolean): Promise<GoogleApiResult<T>> => {
    if (forceRefresh) clearGoogleTokenCache(scope);
    const token = await getGoogleAccessToken(scope, env, timeoutMs);
    if ('error' in token) {
      return { status: token.error, reason: token.reason, httpStatus: token.httpStatus };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: init.method ?? 'GET',
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(init.body ? { body: JSON.stringify(init.body) } : {}),
        signal: controller.signal,
        cache: 'no-store',
      });

      if (response.status === 401 && !forceRefresh) {
        return attempt(true);
      }
      if (response.status === 401 || response.status === 403) {
        const googleReason = await readGoogleError(response);
        return {
          status: 'AUTH_FAILED',
          httpStatus: response.status,
          googleErrorReason: googleReason || undefined,
          reason:
            response.status === 403
              ? `Google refused this request (403). The credential is valid but lacks access to this resource or the API is not enabled for the project. ${googleReason}`.trim()
              : `Authentication failed (401) even after refreshing the token. ${googleReason}`.trim(),
        };
      }
      if (!response.ok) {
        const googleReason = await readGoogleError(response);
        return {
          status: 'API_ERROR',
          httpStatus: response.status,
          googleErrorReason: googleReason || undefined,
          reason: `Google API error (HTTP ${response.status}). ${googleReason}`.trim(),
        };
      }

      const data = (await response.json()) as T;
      return { status: 'READY', data, fetchedAt: new Date().toISOString() };
    } catch (error) {
      const aborted = (error as Error)?.name === 'AbortError';
      return {
        status: aborted ? 'TIMEOUT' : 'API_ERROR',
        reason: aborted
          ? `Google API did not respond within ${timeoutMs / 1000}s.`
          : 'Google API request failed. The website and CRM are unaffected.',
      };
    } finally {
      clearTimeout(timer);
    }
  };

  return attempt(false);
}
