# OAuth Verification

> Mandate §59, §96. Flow mechanics in `OAUTH.md`; this file records verification
> status per the §59 checklist: `state → CSRF → PKCE → redirect URI →
> authorization → token exchange → encryption → refresh → revoke → disconnect →
> audit`.

## Checklist status

| Control | Status | Evidence |
|---|---|---|
| state (CSRF) | CODE_COMPLETE | OAuth start binds random state to session |
| CSRF protection | CODE_COMPLETE | exact state match on callback |
| PKCE where required | CODE_COMPLETE | LinkedIn/TikTok/X require it; supported |
| Exact redirect-URI validation | CODE_COMPLETE | no wildcard |
| Authorization | IMPLEMENTED_BUT_UNVERIFIED | needs live provider consent |
| Server-side token exchange | CODE_COMPLETE | `/api/crm/ucc/oauth/callback` |
| Token encryption | CODE_COMPLETE + tested | AES-256-GCM (`token-encryption.ts`) |
| Refresh handling | CODE_COMPLETE | `refreshToken()` in adapter contract |
| Revoke / disconnect | CODE_COMPLETE | `revokeToken()` in adapter contract |
| Audit event | CODE_COMPLETE | `logAuditAction` on OAuth start/complete/fail |

## Per-provider OAuth status — all OAUTH_REQUIRED

| Provider | Method | Status |
|---|---|---|
| Meta (FB/IG/Messenger/WhatsApp) | OAuth 2.0 auth-code | OAUTH_REQUIRED |
| LinkedIn | OAuth 2.0 + PKCE | OAUTH_REQUIRED + PROVIDER_APPROVAL_REQUIRED |
| TikTok | Login Kit OAuth 2.0 + PKCE | OAUTH_REQUIRED + PROVIDER_APPROVAL_REQUIRED |
| YouTube | Google OAuth 2.0 | OAUTH_REQUIRED |
| Google Business | Google OAuth 2.0 | OAUTH_REQUIRED + PROVIDER_APPROVAL_REQUIRED |
| X | OAuth 2.0 + PKCE / 1.0a | OAUTH_REQUIRED + PROVIDER_APPROVAL_REQUIRED |
| Telegram | static bot token (no OAuth) | CONFIGURATION_REQUIRED |
| Email | app-password or OAuth2 | CONFIGURATION_REQUIRED |

## Why nothing is OAUTH_VERIFIED
OAuth verification requires a real provider consent round-trip. This sandbox has
no credentials and blocked egress, so no live authorization can occur. The routes
exist and typecheck; the live flow is `LIVE_TEST_PENDING`.

## Callback failure safety (§12)
Callback errors return a generic message + audit event and **never** expose the
authorization code, client secret, or tokens. Token encryption is the one control
that is genuinely tested here (unit tests on `token-encryption.ts`).

## What OAUTH_VERIFIED requires
A real authorization completes, a token is exchanged and stored encrypted,
`validateConnection()` succeeds against the real provider, and evidence is
recorded. OWNER action on the production VPS.
