# LinkedIn — Provider Research

> **Status: CODE_COMPLETE (planned) / PROVIDER_APPROVAL_REQUIRED / LIVE_TEST_PENDING.**
> LinkedIn messaging is **NOT SUPPORTED** by the official API — do not claim it.

## Official sources
- Portal: https://developer.linkedin.com / https://learn.microsoft.com/en-us/linkedin/
- Community Management API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/
- **Marketing Developer Platform was sunset April 2024** and replaced by the Community Management API (verified).

## OAuth
- OAuth 2.0 + PKCE.
- Self-serve (no review) scopes: `openid`, `profile`, `email` (Sign In with LinkedIn) and `w_member_social` (Share on LinkedIn — member's own feed only).
- Organization scopes: `r_organization_social`, `rw_organization_admin`, `r_organization_admin` — **partner-gated** (Community Management API).
- Ads scopes: `r_ads`, `rw_ads`, `r_ads_reporting` — Marketing Developer Platform (partner-gated).
- `r_member_social` is currently a **closed permission** (not accepting requests).
- Refresh tokens issued with `offline_access`.

## Webhook
- Organization social-action notifications only (Community Management API).
- The Webhooks tab is hidden until LinkedIn enables it for the app.
- No general-purpose event stream.

## Capabilities
- Receive messages: **NOT SUPPORTED** — LinkedIn Messaging API is closed; DMs are not available to partner apps.
- Send messages: **NOT SUPPORTED** — no member-to-member messaging API.
- Publishing: YES — organization posts (requires `r_organization_social` + `rw_organization_admin`).
- Comments: YES — organization post comments (Community Management API).
- Attachments: PARTIAL — media via Images API for organization posts.
- Account management: PARTIAL — organization pages the member administers.
- Advertising: YES — Marketing Developer Platform (partner-gated).
- Analytics: YES — organization social analytics.
- Revocation: YES.

## Approval / production
- Community Management API requires partner approval and **must be the only product on the app** (LinkedIn enforces this for legal/security reasons).
- Organization access requires a verified Company Page association.

## Rate limits
- Daily application-level throttles; per-endpoint limits.

## Known limitations
- No DM/messaging API. Only organization (Company Page) posting + comment moderation.
- Partner approval timeline is weeks-to-months and not guaranteed.
