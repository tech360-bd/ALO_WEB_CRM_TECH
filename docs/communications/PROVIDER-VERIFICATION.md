# Provider Verification — Live Test Procedure

> Mandate §67, §84, §91. A provider may be marked `LIVE_TEST_VERIFIED` ONLY when
> real credentials + real authorization + real webhook + real API request + real
> response + real message test have ALL succeeded. This document is the
> procedure that produces the evidence the status engine requires.

## The 16-step live verification (per provider)

1. Connect account (OAuth or token) → store encrypted.
2. Verify token (`validateConnection()` returns valid).
3. Verify account (provider returns the expected account/asset id).
4. Verify webhook (CRC/challenge round-trip succeeds).
5. Receive a **real** inbound test event from the provider.
6. Normalize the event into `NormalizedMessage`.
7. Create/update the conversation.
8. Match the contact (`ContactIdentity`).
9. Assign an employee.
10. Employee replies in the workspace.
11. Send through the **official provider API**.
12. Verify provider delivery (delivery receipt/status).
13. Store the message.
14. Store the audit event.
15. Verify the employee dashboard reflects it.
16. Verify CRM history.

Only after ALL 16: `LIVE_TEST_VERIFIED`.

## Evidence record (mandate §84 — never store secrets)
Each verification stores: timestamp, account id, endpoint, result, HTTP status,
sanitized response, webhook event id, test message id, tester employee,
provider, environment (`SANDBOX`/`PRODUCTION`).

## Current status — NONE verified

| Provider | OAuth | Webhook | Live receive | Live send | Overall |
|---|---|---|---|---|---|
| Email | OAUTH_REQUIRED | n/a | PENDING | PENDING | CONFIGURATION_REQUIRED |
| WhatsApp | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| Facebook | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| Messenger | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| Instagram | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| LinkedIn | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| TikTok | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| YouTube | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| Google Business | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |
| Telegram | CONFIGURATION_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | CONFIGURATION_REQUIRED |
| X | OAUTH_REQUIRED | WEBHOOK_REQUIRED | PENDING | PENDING | PROVIDER_APPROVAL_REQUIRED |

**No provider is `LIVE_VERIFIED`.** This environment has no provider credentials
and sandbox egress is blocked, so live authorization/webhook/message tests
cannot be performed here. They are `LIVE_TEST_PENDING` — an OWNER ACTION
requiring real credentials on the production VPS.

## Mock vs live (mandate §90, §106)
Unit tests use controlled mocks and prove adapter logic, validation,
normalization, retries, and error handling. A mock test is labelled
`MOCK TEST PASSED` — it can NEVER prove real OAuth, real webhooks, real account
authorization, or real provider message delivery.
