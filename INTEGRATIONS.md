# ALO EDUCATION — INTEGRATIONS

Spec s78, s9, s10, s11, s94, s105.

---

## 1. Governing rule

**s94 — no fake external integrations.** If SMS, WhatsApp, a payment provider or a university API is
not connected, the system must show `NOT CONFIGURED` — never `SUCCESS`.

**s78 — no provider hard-coded into core business logic.** Every external service sits behind an
abstraction so a vendor can be replaced without touching workflow code.

Both are implemented, not just asserted. The clearest example is
`src/lib/communications/channel-registry.ts`, whose header comment names the rule it exists to satisfy.

---

## 2. Channel registry — the s94 implementation

`CHANNEL_IDS`: `whatsapp`, `whatsapp_business`, `email`, `sms`, `phone`, `social_facebook`,
`social_instagram`, `social_linkedin`, `website_chat`, `portal_messages`, `internal_crm`.

`evaluateChannels(env)` grades every channel against the environment:

| Status | Condition | Displayed as |
|---|---|---|
| `active` | All `requiredEnv` variables present and non-empty | `ACTIVE` |
| `configuration_required` | Any required variable missing or blank | `CONFIGURATION REQUIRED` |
| `manual` | No required variables and no prerequisites | `INTERNAL — NO SETUP REQUIRED` |

Design details worth preserving:

- **Only variable NAMES are exposed**, never values — so the status endpoint cannot leak a credential
  (s66).
- `env` is passed in explicitly rather than read from `process.env` inside the function. That keeps it
  pure and testable, and prevents an accidental read from landing in a browser bundle.
- The display strings live in the registry so **every screen renders identical wording** instead of each
  inventing its own.
- `internal_crm` and `portal_messages` correctly report `manual` — they need no external setup, and
  claiming `CONFIGURATION REQUIRED` for them would be as dishonest as claiming `ACTIVE` for an
  unconfigured SMS provider.

The same registry pattern is applied by the new webhook layer, which returns
`status: "NOT_CONFIGURED"` when a tenant has no subscription rather than implying delivery works.

---

## 3. SMS (s9)

`src/lib/sms-gateway.ts` implements the provider abstraction. The provider is chosen at runtime:

```ts
const provider = opts.provider || process.env.SMS_PROVIDER || 'generic';
```

| Provider | Transport |
|---|---|
| `httpsms` | `HTTPSMS_BASE_URL` (default `https://api.httpsms.com`) + `SMS_PROVIDER_API_KEY` |
| `domovina` | `DOMOVINA_SMS_URL` |
| `generic` | `SMS_PROVIDER_URL` + `SMS_PROVIDER_API_KEY` |
| `threecx` | **Explicitly refused:** `'3CX outbound SMS transport is not implemented; the journal is not a sending API.'` |

That refusal is s94 in practice — the 3CX journal records messages but cannot send them, and the code
says so instead of pretending.

Supporting modules: `httpsms-client.ts`, `httpsms-receipts.ts`, `httpsms-webhook.ts`,
`marketing-kit/sms-templates.ts`.

Templates, transactional and bulk sending, scheduling, delivery status, failure handling, opt-out,
template variables, country-code handling, logs and usage reporting are served by the `communications`
(21 routes) and `marketing` (34 routes) groups.

---

## 4. WhatsApp (s10)

`src/lib/whatsapp-cloud-api.ts` is the Cloud API client, with `whatsapp-number-pool.ts`,
`whatsapp-webhook-handler.ts`, `whatsapp-followup-engine.ts`, `whatsapp-media.ts`,
`whatsapp-inbound-media.ts`, `whatsapp-media-ingestion.ts` and `ai-whatsapp-engine.ts`.

13 routes under `src/app/api/whatsapp/`, plus `whatsapp-analytics`, `whatsapp-followup` and
`whatsapp-numbers` admin surfaces, and an inbound webhook at `/api/integrations/httpsms/webhook`.

**A WhatsApp message is never reported as sent when the API failed** (s10). Every message carries a
real delivery status, and the `failed-message-retry` cron job retries failures while
`whatsapp-followups` implements stop-on-reply automation (s41).

Inbound webhook security is handled by `src/lib/ucc/providers/webhook-security.ts`.

---

## 5. Email (s11)

Templates, transactional and campaign email, application/offer/visa notifications, document reminders,
appointment confirmations and partner communications. Open tracking where legally and technically
appropriate, plus delivery, bounce, failure, unsubscribe and template versioning.

Queue draining is served by `/api/cron/email-outbox`. The `email-queue` cron definition is **disabled
as superseded** by that implementation — it is not silently absent.

---

## 6. Telephony — 3CX

15 routes under `/api/integrations/3cx/`: `call/journal`, `chat/journal`, `click-to-call`, `config`,
`contact-lookup`, `contact-search`, `dashboard`, `extensions`, `extensions/[id]`, `health`,
`sms/journal`, `sms`, `test-connection`, `webhooks`, `whatsapp/journal`.

`test-connection` and `health` exist so connectivity is **verified** rather than assumed. The journal
endpoints record activity; outbound SMS over 3CX is explicitly not implemented (see §3).

---

## 7. Unified Communication Center

`src/lib/ucc/providers/` provides `base-adapter.ts`, `registry.ts`, `status.ts`, `types.ts`,
`webhook-security.ts` and `adapters/` (currently `telegram-adapter.ts`). `channel-registry.ts` and
`contact-identity.ts` normalise contacts across channels, including `phone_normalized` matching for
WhatsApp.

Inbound webhook tables already exist and must not be confused with the new outbound layer:
`WebhookEvent` (6631), `SocialWebhookEvent` (454), `UccWebhookEvent` (4146) are all **inbound**.
Outbound webhooks (s77) are `WebhookSubscription` + `WebhookDelivery`.

---

## 8. Outbound webhooks (s77) — built in this work

Signing: `HMAC-SHA256` over `<x-alo-timestamp>.<raw json body>`. Headers: `x-alo-event`,
`x-alo-delivery`, `x-alo-timestamp`, `x-alo-signature`. Receivers are told to compare in constant time
and reject timestamps outside their tolerance window.

Retries: exponential backoff 30s, 2m, 8m, 32m, 2h, capped at 6h, then dead-letter. Idempotency via
`UNIQUE(subscriptionId, eventId)`. Drained by the `webhook-dispatch` cron job every 5 minutes.

Secrets: AES-256-GCM encrypted at rest (`src/lib/token-encryption.ts`, requires `ENCRYPTION_KEY`),
returned in plaintext **exactly once**. `redactSubscription` replaces the secret with a
`secretConfigured` boolean everywhere else.

SSRF guard: `validateWebhookUrl` rejects private and link-local hosts unless an administrator
explicitly passes `allowPrivateHost`.

---

## 9. AI providers

`src/lib/ai-gateway.ts` (`aiGateway`, `generateStructured`, `classify`, `summarize`, `chat`, `stream`)
and `src/lib/ai-workforce/gateway.ts` (`aiGatewayExecute`, `planRoute`, `ensureGatewayReady`,
`deterministicOnly`, `requestFingerprint`). Requests omit `provider`/`endpoint`, which the gateway
resolves, so no caller hard-codes a vendor (s78).

`src/lib/ai-providers/catalog.ts` applies s105 to the AI layer itself:

```ts
FREE_TIER_CLAIMS_SOURCE = 'owner-supplied provider list, 2026-10-18 — not verified against official documentation';
VERIFIED_FREE_TIERS = [];   // empty — nothing has been verified
```

`EXCLUDED_PROVIDERS` records each exclusion **with a reason**.

---

## 10. Payment gateways — GAP

**No payment gateway integration exists in `src/lib`.** A search for `stripe`, `sslcommerz` and
`paypal` across `src/lib/**/*.ts` returns nothing. Payments are recorded (`Payment` model, schema 9223;
`Application.paymentStatus` / `depositStatus`) but not processed through a gateway abstraction.

s78 names payment gateways as a required connector and s26 requires payment tracking, which does exist.
Charging cards does not. This is recorded as a gap rather than worked around: any UI that appears to
take a payment must report `NOT CONFIGURED` (s94) until a gateway is implemented behind an abstraction.

---

## 11. Other named connectors (s78)

| Connector | Status |
|---|---|
| WhatsApp | Implemented (Cloud API) |
| SMS | Implemented (3 providers + explicit refusal) |
| Email | Implemented |
| **Payment gateways** | **NOT IMPLEMENTED** — see §10 |
| Google / Calendar | Not found as a dedicated connector; appointments are first-party |
| Google Drive / cloud storage | `DOCUMENT-STORAGE-ARCHITECTURE.md` describes storage; signed URLs per s66 |
| Accounting | Double-entry ledger is first-party; export provided, no external accounting connector |
| University APIs | Not connected. University data is entered and verified manually, with `university-monitoring` (11 routes) tracking sources and `ranking-update` **disabled** for want of provider credentials |
| Application platforms | Not connected |
| Analytics / marketing platforms | `marketing` (34 routes), `seo` (9), UTM capture on leads |

---

## 12. Verification status

| Item | Status |
|---|---|
| Channel registry honesty logic | **PASS** — pure function, unit testable, only variable names exposed |
| Webhook signing, backoff, retryability | **PASS** — 35 unit tests with an injected `fetchImpl` |
| Secret encryption and single reveal | **PASS** — unit tested |
| SSRF guard | **PASS** — unit tested |
| Any real outbound SMS / WhatsApp / email delivery | **NOT CONFIGURED** — no provider credentials |
| 3CX connectivity | **NOT CONFIGURED** — `test-connection` and `health` exist but were not run against a live system |
| Payment gateway | **NOT IMPLEMENTED** |
| University API | **NOT CONFIGURED** |

**No external delivery was verified.** Per s98, where providers are unavailable the abstraction should
be tested with a controlled test adapter and external delivery marked `NOT VERIFIED` — which is exactly
how the webhook layer is tested (`fetchImpl` injection). The equivalent adapters for SMS, WhatsApp and
email were not exercised in this environment.
