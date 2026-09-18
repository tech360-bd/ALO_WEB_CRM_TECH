# TikTok — Provider Research

> **Status: CODE_COMPLETE (planned) / PROVIDER_APPROVAL_REQUIRED / LIVE_TEST_PENDING.**
> TikTok has **no public DM API** — messaging is NOT SUPPORTED.

## Official sources
- Portal: https://developers.tiktok.com
- Display API: https://developers.tiktok.com/doc/display-api-get-started
- Content Posting API: https://developers.tiktok.com/doc/content-posting-get-started
- Business API: https://business-api.tiktok.com
- API base: `https://open.tiktokapis.com` (**v2**).

## OAuth
- Login Kit, OAuth 2.0 + PKCE.
- Scopes: `user.info.basic`, `video.list` (Display); `video.upload` (inbox), `video.publish` (direct post).
- Access + refresh tokens; users may grant only a subset of scopes (design for partial consent).

## Webhook
- Available per connected product; signature verification required.
- No universal event stream.

## Capabilities
- Receive messages: **NOT SUPPORTED** (no public DM API).
- Send messages: **NOT SUPPORTED** (no public DM API).
- Publishing: YES — Content Posting API: `video.upload` (to creator inbox/drafts) or `video.publish` (direct, audited).
- Attachments: PARTIAL — video/photo via Content Posting API.
- Comments: PARTIAL — Research API only, and only for approved research use.
- Account management: PARTIAL — Display API (`user.info.basic`, `video.list`).
- Advertising: YES — TikTok Business API (separate onboarding at business-api.tiktok.com).
- Analytics: PARTIAL — Display API video metrics; ads via Business API.
- Revocation: YES.

## Approval / production
- Login Kit + product approval required.
- Content Posting requires an **app audit**; Direct Post and Upload are audited separately.
- Development mode: posts forced to `SELF_ONLY` privacy; max 5 authorizing accounts per 24h; cannot onboard real users until audit passes.

## Rate limits
- Per-app QPS limits; honour 429.

## Known limitations
- No DM API. Publishing gated behind audit; dev mode is private-only.
- TikTok Shop is a separate Partner Center product with its own onboarding.
