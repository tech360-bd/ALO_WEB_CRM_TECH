# Unified Communication Center — Webhooks

> Mandate §13, §14, §80. Webhook processing must be:
> `receive → validate → acknowledge → queue/process → normalize → persist`.
> Never do slow work before acknowledging a provider that expects an immediate
> response.

## Signature verification (implemented + unit-tested)

`src/lib/ucc/providers/webhook-security.ts` implements each provider's OFFICIAL
scheme. All checks run over the **raw body**, use **constant-time** comparison,
and **fail closed** when a secret is missing.

| Provider | Scheme | Header | Status |
|---|---|---|---|
| Meta (WhatsApp/FB/IG/Messenger) | HMAC-SHA256 hex of raw body | `X-Hub-Signature-256` | IMPLEMENTED + tested |
| Meta challenge (GET) | echo `hub.challenge` on `hub.verify_token` match | query | IMPLEMENTED + tested |
| Telegram | `secret_token` echo | `X-Telegram-Bot-Api-Secret-Token` | IMPLEMENTED + tested |
| X (Twitter) | HMAC-SHA256 **base64** of raw body | `x-twitter-webhooks-signature` | IMPLEMENTED + tested |
| X CRC | `sha256=base64(HMAC(crc_token, secret))` | query | IMPLEMENTED + tested |
| YouTube / Google Business | Pub/Sub OIDC JWT | `Authorization: Bearer` | structural check only — **JWT signature must be validated by a JWKS verifier; not faked** |
| LinkedIn / TikTok | product-gated | — | NOT implemented — **fails closed** |
| Email | transport-specific | — | configure per transport |

> **X has no replay protection** (signature carries no timestamp). Callers MUST
> rely on event-id idempotency. This is stated, not papered over.

## Idempotency (mandate §14)

`idempotencyKey(provider, providerEventId, rawBody)` produces a stable key:
- `${provider}:${eventId}` when the provider supplies an event id (duplicate
  deliveries collapse even if the body differs slightly), else
- `${provider}:hash:${sha256(rawBody)[:32]}`.

Persist every event in the webhook-event table (`WebhookEvent`/`UccWebhookEvent`)
with: provider, event id, type, received timestamp, payload hash, processing
status, attempts, processed timestamp, error, retry timestamp. **Never** create
duplicate conversations/messages/leads/contacts/attachments/assignments for the
same event id.

## Acknowledgement discipline
- Validate signature → if invalid, reject (4xx) and log sanitized.
- Acknowledge the provider fast (200) → then queue/normalize/persist.
- Meta expects a 200 quickly; X requires a response within 10s.

## Verification status
**WEBHOOK_REQUIRED / LIVE_TEST_PENDING for every provider.** Signature
verification is `CODE_COMPLETE` + unit-tested (46 tests), but no provider has
performed a live webhook verification (CRC/challenge round-trip) in this
environment.
