# Unified Communication Center — Troubleshooting

> Mandate §80. Diagnose before acting. No blind restarts (per repo incident
> rules). Classify the failure first.

## Status says CONFIGURATION_REQUIRED
- Cause: server-side env for the provider is missing.
- Fix: set the provider's variables (see `SETUP.md`). Never hardcode secrets.

## Status says CREDENTIALS_REQUIRED
- Cause: no encrypted credentials stored for a connected account.
- Fix: run the setup wizard OAuth/token step.

## Status says OAUTH_REQUIRED / OAUTH_CONFIGURED
- Cause: OAuth not completed, or completed but not verified.
- Fix: complete `/api/crm/ucc/oauth/start → callback`. `OAUTH_VERIFIED` appears
  only after `validateConnection()` succeeds and evidence is recorded.

## Status says WEBHOOK_REQUIRED / WEBHOOK_CONFIGURED
- Cause: webhook not registered with the provider, or registered but the
  challenge round-trip not verified.
- Fix: register the endpoint, then verify (Meta `hub.challenge`, X CRC).

## Status says PROVIDER_APPROVAL_REQUIRED
- Cause: the provider gates production use behind app/business review.
- Fix: submit the provider's app-review/business-verification (see
  provider-research doc). Do NOT show "Connected" while pending.

## Webhook signature mismatch (400)
- Check: are you hashing the **raw** body (not re-serialized JSON)?
- Meta uses **hex** HMAC; X uses **base64** HMAC. Don't mix them.
- Missing secret ⇒ the verifier **fails closed** by design — configure it.

## Duplicate messages/conversations
- Cause: idempotency key not persisted/checked.
- Fix: ensure every event is stored by `idempotencyKey()` before processing.

## X webhooks replaying
- X signatures carry **no timestamp** → no native replay protection. Dedupe on
  event id; this is expected, not a bug.

## 429 from a provider
- Honour `Retry-After` / backoff. The retry system caps attempts and dead-letters
  permanent failures.

## Verification status
This guide documents behaviour that is `CODE_COMPLETE` (status engine, webhook
verification, idempotency — all unit-tested). Live provider failures cannot be
reproduced here (no credentials).
