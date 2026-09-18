# Webhook Verification

> Mandate §58, §96. Signature/idempotency mechanics in `WEBHOOKS.md`; this file
> records verification status per the §58 chain:
> `Provider → Verification → Signature → Timestamp → Replay → Event ID →
> Idempotency → Queue → Processing → CRM → Audit`.

## Verification status per provider

| Provider | Signature scheme | Verification | Replay protection | Status |
|---|---|---|---|---|
| Meta (WhatsApp/FB/IG/Messenger) | `X-Hub-Signature-256` hex HMAC | MOCK_VERIFIED (unit) | none native — event-id dedup | CODE_COMPLETE / LIVE_TEST_PENDING |
| Telegram | `secret_token` echo | MOCK_VERIFIED (unit) | n/a | CODE_COMPLETE / LIVE_TEST_PENDING |
| X | `x-twitter-webhooks-signature` base64 HMAC + CRC | MOCK_VERIFIED (unit) | **none (no timestamp)** — event-id dedup | CODE_COMPLETE / LIVE_TEST_PENDING |
| YouTube / Google Business | Pub/Sub OIDC JWT | structural only — **JWKS verifier required, not faked** | via JWT | IMPLEMENTED_BUT_UNVERIFIED |
| LinkedIn / TikTok | product-gated | **fails closed** (not wired) | — | CONFIGURATION_REQUIRED |
| Email | transport-specific | configure per transport | — | CONFIGURATION_REQUIRED |

## What MOCK_VERIFIED proves (and does not)
The 24 unit tests in `tests/unit/ucc-webhook-security.test.ts` prove:
- valid signatures verify; tampered bodies are rejected;
- missing secrets **fail closed**;
- idempotency keys are stable and dedupe duplicates.

They use **synthetic payloads**. They do **not** prove a real provider handshake.
A live round-trip (Meta `hub.challenge`, X CRC) is `LIVE_TEST_PENDING`.

## §58 chain status
- Verification/Signature/Idempotency: **MOCK_VERIFIED** (unit-tested crypto).
- Queue/Processing/CRM/Audit: **CODE_COMPLETE** (webhook dispatcher records
  `WebhookEvent`, normalizes, persists) but **IMPLEMENTED_BUT_UNVERIFIED**
  end-to-end (needs a live event).
- Timestamp/Replay: X has **no native replay protection** — documented, mitigated
  by event-id idempotency, not papered over.

## What WEBHOOK_VERIFIED requires
A real provider delivers a real event to the public HTTPS endpoint, the signature
verifies against the real secret, the event is deduped, normalized, persisted to
CRM, and audited — captured as evidence. OWNER action on the production VPS.
