# SOCIAL-API-CONNECTIONS — ALO Education

Snapshot: **2026-10-18**, branch `arena/ef31f574-alo-web-crm-tech`

> **No live API call was made to any provider.** `graph.facebook.com`,
> `googleapis.com` and `youtube.com` are unreachable from this sandbox and no
> OAuth credentials were supplied. Statements below are derived from source.

---

## 1. Scoreboard

| Platform | Env vars | Server-side OAuth | Webhook | Token storage | Verdict |
|---|---|---|---|---|---|
| **Facebook Pages** | Yes (5) | Yes | Yes | **Encrypted (new)** | **Implemented** |
| **Facebook Lead Ads** | shared | shared | Yes | — | **Implemented** |
| **WhatsApp Cloud API** | Yes (11) | n/a (static token) | Yes | env only | **Implemented** |
| **Instagram** | Yes (3) | **No** | **No** | **No** | **Missing** |
| **Google Ads** | **None** | **No** | n/a | **No** | **Missing** |
| **YouTube** | Yes (2) | **No** | n/a | **No** | **Missing** |
| **LinkedIn** | **None** | **No** | **No** | **No** | **Missing** |
| **Email (SMTP)** | Yes | n/a | n/a | env only | **Implemented** |
| **SMS (httpSMS)** | Yes (3) | n/a | Yes | env only | **Implemented** |
| **3CX telephony** | Yes | n/a | Yes | DB | **Implemented** |

**Declaring an environment variable is not an integration.** Instagram, YouTube
and LinkedIn have variables and channel-registry entries but no code that
exchanges a code for a token, refreshes it, or verifies a webhook.

---

## 2. Facebook — implemented and hardened

### Endpoints

| Method | Path | File |
|---|---|---|
| `GET` | `/api/facebook/auth` | `src/app/api/facebook/auth/route.ts` |
| `GET` | `/api/facebook/callback` | `src/app/api/facebook/callback/route.ts` |
| `GET/POST` | `/api/facebook/webhook` | `src/app/api/facebook/webhook/route.ts` |

### Requested scopes

```
pages_manage_metadata, pages_read_engagement, pages_show_list,
leads_retrieval, pages_messaging
```

Appropriately narrow — no `manage_pages` write scope beyond messaging, no
`user_*` personal scopes.

### OAuth flow

1. `/auth` builds the authorize URL with a signed `state`.
2. `/callback` **verifies the signed state before exchanging the code.**
3. Short-lived user token → long-lived token (`grant_type=fb_exchange_token`).
4. `GET /me/accounts?fields=id,name,access_token` → per-page tokens.
5. Upsert into `FacebookIntegration`, **encrypted at rest**.
6. `AuditLog` row: action `FACEBOOK_CONNECT`, recording page count and page IDs.

### Three defects fixed in this branch

**(1) Unsigned `state` → connection CSRF + open redirect.** Previously the
callback only *decoded* `state` and fed `returnTo` into
`new URL(returnTo, req.url)`, which resolves absolute URLs — so a crafted
callback redirected users off-site after a successful connection. Now:
`src/lib/social/oauth-state.ts` issues an HMAC-SHA256-signed, 10-minute,
provider-bound state; `safeReturnTo()` constrains the target to a same-origin
absolute path, rejecting `//host`, `/\host`, schemes, control characters and
lengths over 512. Invalid state → `403`.

**(2) Plaintext credentials.** `pageAccessToken`, `appSecret` and `verifyToken`
were written to `FacebookIntegration` unencrypted. Now encrypted with AES-256-GCM
before write; the three readers in `src/app/api/facebook/webhook/route.ts`
(lines 27, 112, 246) decrypt on read.

**(3) Duplicate crypto implementations.** The repo shipped two AES-256-GCM
modules; `src/lib/social/token-encryption.ts` was imported by **no source file**.
It is now a thin adapter over the canonical `src/lib/token-encryption.ts`, adding
only `isEncrypted`, `encryptStoredToken` and `decryptStoredToken`.

`decryptStoredToken` passes legacy plaintext rows through, so already-connected
pages keep working, and returns `''` — never the ciphertext — when
`ENCRYPTION_KEY` has rotated.

### Model

```
FacebookIntegration  pageId @unique, pageName, pageAccessToken, appId,
                     appSecret, verifyToken, connectedBy, connectedAt,
                     lastWebhookAt, status
FacebookLeadRaw      raw lead-ad payloads
```

### Webhook

`GET` handles Meta's `hub.mode=subscribe` / `hub.verify_token` / `hub.challenge`
challenge. `POST` ingests page messaging and lead-gen events, writing
`SocialInboxMessage` rows for both directions.

### Tests

`tests/unit/oauth-state.test.ts` — **29 tests**, green. Covers: same-origin paths
accepted; `https://evil.example`, `//evil.example`, `/\evil.example`,
`javascript:`, control characters, empty, whitespace, slash-less relative and
>512-char paths all rejected; round-trip; per-call uniqueness; malicious
`returnTo` sanitised at creation; forged payload rejected; flipped signature
rejected; wrong secret rejected; cross-provider replay rejected; expiry;
future-dated beyond skew rejected; 7 malformed inputs rejected; missing or
short secret throws in **every** environment; `AUTH_SECRET` accepted as alias.

`tests/unit/social-token-encryption.test.ts` — **11 tests**, green. Covers
round-trip, ciphertext ≠ plaintext, random IV, idempotency (no
double-encryption), legacy plaintext passthrough, empty/null handling, rotated-key
behaviour, mask output, and the production key policy.

---

## 3. WhatsApp — see `WHATSAPP-AUTOMATION-REPORT.md`

Token-based (no OAuth). `WHATSAPP_APP_SECRET` HMAC verification, required in
production. 14 endpoints.

---

## 4. What is missing, concretely

### Instagram

`INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` are declared.
`social_instagram` exists in `src/lib/communications/channel-registry.ts` with
provider `"Meta Graph API (Instagram messaging)"`. There is **no** route that
performs Instagram OAuth or Basic Display token exchange, and no Instagram
webhook handler. `INSTAGRAM_ACCESS_TOKEN` appears as a static-token placeholder
only.

To implement: Instagram API with Instagram Login business flow, scopes
`instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`;
long-lived token exchange and 60-day refresh; webhook on `messages`,
`comments`, `mentions`.

### Google Ads

**No environment variables exist.** `GOOGLE_ADS` appears only inside
`src/components/marketing/hub/AdvertisingManagerView.tsx` — a UI component with
no backing API. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are declared but
bound to Search Console
(`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`).

To implement: Google OAuth 2.0 with scope
`https://www.googleapis.com/auth/adwords`, a developer token, a
`login-customer-id` for manager accounts, and the Google Ads API v17+ customer
and campaign services. Conversion upload for lead sources is the piece that
would actually close the marketing loop.

### YouTube

`YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` are declared and referenced only by
`src/app/admin/settings/digital-assets/page.tsx`. No OAuth route, no
`youtube.upload` / `youtube.readonly` scope handling, no comment ingestion.

### LinkedIn

`social_linkedin` is declared in the channel registry with provider
`"LinkedIn Marketing/Share API"`. No variables, no code.

---

## 5. Channel registry (honest by design)

`src/lib/communications/channel-registry.ts` documents itself:

> *"It deliberately contains NO simulated/mock provider."*

| `id` | `provider` |
|---|---|
| `whatsapp` | WhatsApp Cloud API (Meta) |
| `whatsapp_business` | WhatsApp Cloud API — number pool |
| `email` | SMTP submission |
| `sms` | httpSMS gateway |
| `phone` | 3CX telephony |
| `social_facebook` | Meta Graph API (Page messaging) |
| `social_instagram` | Meta Graph API (Instagram messaging) |
| `social_linkedin` | LinkedIn Marketing/Share API |

A channel entry describes **capability**, not connection state. `social_instagram`
and `social_linkedin` are declared capabilities with no implementation behind
them — which is exactly how a "connected" badge could end up lying. Any UI that
renders connection status must read `SocialIntegration.status` /
`healthStatus`, never the registry.

---

## 6. Credential handling

### Where secrets live

| Kind | Location | Encryption |
|---|---|---|
| WhatsApp, SMTP, SMS, AI keys | Environment | n/a (never in DB) |
| Facebook page token, app secret, verify token | `FacebookIntegration` | **AES-256-GCM (new)** |
| Other `SocialIntegration` tokens | `SocialIntegration.accessToken/refreshToken/webhookSecret` | **Not encrypted — GAP** |
| 3CX | `ThreeCxIntegration` | **Not verified — GAP** |
| Vault-backed option | `src/lib/vaultwarden-client.ts` | Reuses AES-256-GCM as a local fallback |

`SocialIntegration` still declares plaintext `accessToken`, `refreshToken` and
`webhookSecret` columns. The encryption applied to Facebook in this branch is
**not** applied there. Extending `encryptStoredToken` to `SocialIntegration` is
the obvious next step and does not require a schema change — the columns already
exist and are `String?`.

### Encryption primitive

`src/lib/token-encryption.ts` — AES-256-GCM, 12-byte random IV, format
`iv:authTag:ciphertext` (hex), keyed by `ENCRYPTION_KEY` (64-hex = 32 bytes).
**Throws in production** if the key is missing or short. `maskToken()` produces
`abc123...wxyz` for logs; anything under 12 characters becomes `***`.

`ENCRYPTION_KEY` is in the `productionRequired` list in
`docs/environment-classification.json` and remains `productionRequired: true`
after this branch.

### Rule enforced

**No secret value appears in any deliverable, log line, error message or test
fixture.** Tests use synthetic values only. The CI secret scanner
(`.github/workflows/ci.yml`) scans every tracked file **including markdown** —
a comment in that file records that a real production password once survived in a
deployment guide precisely because docs were excluded from an earlier version of
the scan.

---

## 7. Connection health and webhook logs

| Concern | State |
|---|---|
| `SocialIntegration.healthStatus` | Stored string: `healthy` / `warning` / `degraded` |
| `SocialIntegration.webhookStatus` | Stored string: `active` / `inactive` / `error` |
| Active health probing | **Not found** — `GET /api/crm/ucc/integrations` returns `'unknown'` when unset |
| `SocialIntegration.lastSyncAt` | Recorded |
| Webhook event log | `WebhookEvent` (`@@unique([provider, eventId])`, `verified`, `processed`, `errorMessage`), plus `SocialWebhookEvent`, `UccWebhookEvent` |
| Integration audit | `IntegrationAuditLog` — actor, action, `previousState`, `newState`, `ipAddress`, `userAgent`, `requestId`, `approvalRef`, `result`, `errorMessage` |

The audit and event-log models are solid. What is missing is **active
verification** — nothing currently asks a provider "is this token still valid?"
and updates `healthStatus`. Token expiry (`tokenExpiresAt`) is stored but no
refresh job was found.

---

## 8. Recommended order of work

1. Extend `encryptStoredToken` to `SocialIntegration.accessToken`,
   `refreshToken`, `webhookSecret`. No schema change needed.
2. Add a token-expiry refresh job to `src/lib/cron/job-registry.ts` (disposition
   `job`) that probes each connected integration and writes a real
   `healthStatus`.
3. Instagram — highest marketing value per unit of effort, since the Meta app and
   webhook plumbing already exist for Facebook.
4. Google Ads — needs a developer token approval cycle, so start the application
   early.
5. YouTube, then LinkedIn.

---

## 9. Deployment status

**NOT DEPLOYED.** No OAuth credentials were configured, no provider app was
registered, no webhook was subscribed, and no live connection was established or
verified. Facebook's hardened flow is code-complete and unit-tested; it has never
completed a real handshake with Meta.
