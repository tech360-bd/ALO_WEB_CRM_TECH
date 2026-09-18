# Provider Matrix — Unified Communication Center

> Generated from `src/lib/ucc/providers/registry.ts` on 2026-09-18. Do not edit by hand.
>
> **Status legend (mandate §109):** every provider below is at most
> `CODE_COMPLETE` / `CONFIGURATION_REQUIRED` / `PROVIDER_APPROVAL_REQUIRED` /
> `LIVE_TEST_PENDING`. **None are `LIVE_VERIFIED`** — no provider has completed
> live authorization + webhook + message verification in this environment.

| Provider | Code | Credentials | OAuth | Webhook | Approval | Live Test | Overall Status |
|---|---|---|---|---|---|---|---|
| Email (SMTP / IMAP) | `email` | CONFIGURATION_REQUIRED | PARTIAL | NO | NOT_REQUIRED | LIVE_TEST_PENDING | CONFIGURATION_REQUIRED |
| WhatsApp Business Cloud API | `whatsapp` | CONFIGURATION_REQUIRED | YES | YES | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| Facebook Pages / Messenger Platform | `facebook` | CONFIGURATION_REQUIRED | YES | YES | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| Facebook Messenger | `messenger` | CONFIGURATION_REQUIRED | YES | YES | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| Instagram Business / Messenger API | `instagram` | CONFIGURATION_REQUIRED | YES | YES | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| LinkedIn (Community Management API) | `linkedin` | CONFIGURATION_REQUIRED | YES | PARTIAL | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| TikTok for Developers | `tiktok` | CONFIGURATION_REQUIRED | YES | PARTIAL | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| YouTube Data API v3 | `youtube` | CONFIGURATION_REQUIRED | YES | PARTIAL | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| Google Business Profile APIs | `google_business` | CONFIGURATION_REQUIRED | YES | PARTIAL | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |
| Telegram Bot API | `telegram` | CONFIGURATION_REQUIRED | NO | YES | NOT_REQUIRED | LIVE_TEST_PENDING | CONFIGURATION_REQUIRED |
| X (Twitter) API v2 | `x` | CONFIGURATION_REQUIRED | YES | YES | REQUIRED | LIVE_TEST_PENDING | PROVIDER_APPROVAL_REQUIRED |

## What "Overall Status" means here

It is the **computed** status (mandate §83), not a manual label. The full
chain is `configuration → credentials → provider approval → OAuth → webhook →
live message test`. A provider only reaches `LIVE_TEST_VERIFIED` when a real
provider interaction has been recorded as evidence. See
`src/lib/ucc/providers/status.ts`.
