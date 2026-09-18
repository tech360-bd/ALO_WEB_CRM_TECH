# Marketing Channel Matrix

> Mandate §60. The marketing registry may list a channel even when its API is
> not implemented — the UI MUST distinguish `PLANNED` from `CODE_COMPLETE` from
> configured/verified states (mandate §5). **No channel is `LIVE_VERIFIED`.**

## Status vocabulary (mandate §5, §109)
`PLANNED` · `CODE_COMPLETE` · `CONFIGURATION_REQUIRED` · `OAUTH_REQUIRED` ·
`PROVIDER_APPROVAL_REQUIRED` · `LIVE_TEST_PENDING` · `LIVE_VERIFIED` · `NOT_SUPPORTED`

## Channel registry

| Channel | Category | Organic | Messaging | Publishing | Ads | Analytics | OAuth | Webhook | Approval | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | social | YES | YES | YES | YES | YES | YES | YES | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| Instagram | social | YES | YES | PARTIAL | YES | YES | YES | YES | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| Messenger | messaging | — | YES | — | — | PARTIAL | YES | YES | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| WhatsApp | messaging | — | YES | — | — | PARTIAL | YES | YES | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| TikTok | video | YES | NOT_SUPPORTED | YES | YES | PARTIAL | YES | PARTIAL | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| YouTube | video | YES | NOT_SUPPORTED | YES | YES | YES | YES | PARTIAL | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| LinkedIn | professional | YES | NOT_SUPPORTED | YES | YES | YES | YES | PARTIAL | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| X / Twitter | social | YES | YES | YES | PARTIAL | PARTIAL | YES | YES | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| Telegram | messaging | YES | YES | YES | NOT_SUPPORTED | NOT_SUPPORTED | NO | YES | NOT_REQUIRED | CONFIGURATION_REQUIRED |
| Google Business | local | YES | NOT_SUPPORTED | YES | PARTIAL | YES | YES | PARTIAL | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| Google Ads (Display/YouTube/Shopping/Demand Gen) | ads | — | — | — | YES | YES | YES | NO | REQUIRED | PROVIDER_APPROVAL_REQUIRED |
| Google Analytics | website | — | — | — | — | YES | YES | NO | NOT_REQUIRED | CONFIGURATION_REQUIRED |
| Google Search Console | website | — | — | — | — | YES | YES | NO | NOT_REQUIRED | CONFIGURATION_REQUIRED |
| Pinterest | social | YES | NOT_SUPPORTED | PARTIAL | YES | PARTIAL | YES | PARTIAL | REQUIRED | PLANNED |
| Reddit | social | YES | NOT_SUPPORTED | PARTIAL | YES | PARTIAL | YES | NO | REQUIRED | PLANNED |
| Snapchat | social | YES | NOT_SUPPORTED | PARTIAL | YES | PARTIAL | YES | NO | REQUIRED | PLANNED |
| Quora | ads | — | NOT_SUPPORTED | — | PARTIAL | PARTIAL | YES | NO | REQUIRED | PLANNED |
| Email | email | — | YES | — | — | PARTIAL | PARTIAL | NO | NOT_REQUIRED | CONFIGURATION_REQUIRED |
| Website / SEO | website | YES | — | — | — | YES | NO | NO | NOT_REQUIRED | PLANNED |

## Rules enforced
- A channel appearing in this registry does **not** mean it is integrated.
- `NOT_SUPPORTED` (e.g. TikTok/YouTube/LinkedIn messaging) is the official API's
  stance and must never be shown as "coming soon".
- `PLANNED` channels have no adapter code; the UI must say so, not render a dead
  Connect button (mandate §103).
- Google Shopping is `NOT_APPLICABLE` for an education consultancy unless a
  legitimate product catalog exists (mandate §24).

## Verification status
**None of the above is `LIVE_VERIFIED`.** Provider authorization, webhook
verification, and live message/publish tests have not been performed in this
environment (no credentials, sandbox egress blocked).
