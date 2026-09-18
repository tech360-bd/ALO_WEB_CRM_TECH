# Unified Communication Center — OAuth

> Mandate §12, §80. Every OAuth flow must support state/CSRF, exact redirect-URI
> validation, PKCE where required, server-side token exchange, encrypted token
> storage, refresh handling, expiry/revocation detection, and audit events.
> Callback failures must never expose codes, secrets, or tokens.

## Canonical flow

```
1. /api/crm/ucc/oauth/start  → build authorization URL with:
     - provider authorization endpoint (from provider research doc)
     - exact registered redirect URI
     - state = random, bound to session (CSRF) [+ PKCE code_challenge]
     - requested scopes (least privilege; provider-specific)
2. Provider consent screen
3. /api/crm/ucc/oauth/callback →
     - validate state EXACTLY (reject mismatch)
     - exchange code server-side (never in browser)
     - encrypt access/refresh tokens via src/lib/token-encryption.ts (AES-256-GCM)
     - store in ConnectedAccount.accessTokenEnc/refreshTokenEnc
     - record audit event (OAuth completed) — NEVER log the code or token
4. validateConnection() → mark OAUTH_VERIFIED only with evidence
```

## Per-provider OAuth specifics (verified — see provider-research/)

| Provider | Method | PKCE | Notes |
|---|---|---|---|
| Meta (FB/IG/Messenger/WhatsApp) | OAuth 2.0 auth-code | supported | long-lived token exchange ~60d |
| LinkedIn | OAuth 2.0 | required | self-serve: openid/profile/email/w_member_social only |
| TikTok | Login Kit OAuth 2.0 | required | partial consent possible |
| YouTube | Google OAuth 2.0 | supported | refresh via access_type=offline |
| Google Business | Google OAuth 2.0 | supported | scope business.manage; API keys rejected |
| X | OAuth 2.0 + PKCE / 1.0a | required (2.0) | refresh via offline.access |
| Telegram | **none** | n/a | static bot token (not OAuth) |
| Email | app-password OR OAuth2 | per transport | Google/M365 use OAuth2 |

## Security rules enforced
- `state` is mandatory and validated exact-match (CSRF).
- Redirect URI must match the registered value exactly (no wildcard).
- Token exchange happens server-side only.
- Tokens are encrypted at rest (AES-256-GCM, `ENCRYPTION_KEY` from env).
- Tokens never appear in API responses, React props, console, logs, or audit.
- Only masked values are displayed (`••••••••1234`).
- Callback errors return a generic message + audit event, never the code/secret.

## Verification status
**OAUTH_REQUIRED for every provider.** No provider has completed a live OAuth
authorization in this environment. The OAuth start/callback routes exist
(`/api/crm/ucc/oauth/*`); live authorization is `LIVE_TEST_PENDING`.
