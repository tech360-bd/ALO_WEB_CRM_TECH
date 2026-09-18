# Final Provider Verification

> Mandate §93, §96. Per-provider verification across the §93 chain:
> `Code → Configuration → Credentials → OAuth → Account → Webhook → API →
> Receive → Send → Media → CRM → Live Test`. Architecture in `ARCHITECTURE.md`;
> capability data in `docs/integrations/CAPABILITY-MATRIX.md`.

## Status legend (§95/§97)
`MOCK_VERIFIED` (mocked) · `LOCAL_VERIFIED` (local service) · `SANDBOX_VERIFIED`
(provider sandbox) · `LIVE_VERIFIED` (real production provider interaction only).

## Per-provider verification — NONE live-verified

| Provider | Code | Config | Credentials | OAuth | Webhook | API | Receive | Send | Live Test |
|---|---|---|---|---|---|---|---|---|---|
| Email | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | n/a | — | — | — | LIVE_TEST_PENDING |
| WhatsApp | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | PARTIAL | — | LIVE_TEST_PENDING |
| Facebook | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | PARTIAL | — | LIVE_TEST_PENDING |
| Messenger | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | PARTIAL | — | LIVE_TEST_PENDING |
| Instagram | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | PARTIAL | — | LIVE_TEST_PENDING |
| LinkedIn | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | NOT_SUPPORTED | NOT_SUPPORTED | LIVE_TEST_PENDING |
| TikTok | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | NOT_SUPPORTED | NOT_SUPPORTED | LIVE_TEST_PENDING |
| YouTube | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | NOT_SUPPORTED | NOT_SUPPORTED | LIVE_TEST_PENDING |
| Google Business | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | NOT_SUPPORTED | NOT_SUPPORTED | LIVE_TEST_PENDING |
| Telegram | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | n/a (token) | WEBHOOK_REQUIRED | — | — | — | LIVE_TEST_PENDING |
| X | CODE_COMPLETE | CONFIGURATION_REQUIRED | MISSING | OAUTH_REQUIRED | WEBHOOK_REQUIRED | — | — | — | LIVE_TEST_PENDING |

## Why nothing is LIVE_VERIFIED (§94)
This sandbox has **no provider credentials** and **egress is blocked**, so no real
OAuth, webhook round-trip, or message delivery can occur. Webhook *signature
verification* is `MOCK_VERIFIED` (24 unit tests with synthetic payloads); that
proves the crypto, **not** a live provider handshake.

## What LIVE_VERIFIED requires (§91)
Real credentials → real authorization → real webhook → real API request → real
response → real message test, captured as evidence (`PROVIDER-VERIFICATION.md`
16-step procedure). Until then every provider is at most `CODE_COMPLETE` /
`CONFIGURATION_REQUIRED` / `OAUTH_REQUIRED` / `WEBHOOK_REQUIRED` /
`PROVIDER_APPROVAL_REQUIRED` / `LIVE_TEST_PENDING`.
