# YouTube — Provider Research

> **Status: CODE_COMPLETE (planned) / OAUTH_REQUIRED / LIVE_TEST_PENDING.**
> YouTube has **no DM API** — comments are the inbound channel.

## Official sources
- YouTube Data API v3: https://developers.google.com/youtube/v3
- YouTube Analytics API: https://developers.google.com/youtube/reporting
- Google OAuth: https://developers.google.com/identity/protocols/oauth2

## OAuth
- Google OAuth 2.0.
- Scopes: `youtube.readonly`, `youtube.upload`, `youtube`, `youtube.force-ssl` (comments), `yt-analytics.readonly`.
- Refresh tokens issued with `access_type=offline` + `prompt=consent`.

## Webhook
- Pub/Sub push for some resources; otherwise polling.
- Pub/Sub push uses an OIDC JWT — validate signature/audience via Google JWKS (do not fake verification).

## Capabilities
- Receive messages: **NOT SUPPORTED** (no DM surface). Comments are inbound.
- Send messages: **NOT SUPPORTED** (no DM API). Reply to comments instead.
- Publishing: YES — `videos.insert` (resumable upload); scheduled publishing via `publishAt`.
- Attachments: PARTIAL — video upload; thumbnails via `thumbnails.set`.
- Comments: YES — `commentThreads`, `comments` (set/moderate/reply).
- Account management: YES — `channels.list`.
- Advertising: YES — Google Ads API (separate).
- Analytics: YES — YouTube Analytics API.
- Revocation: YES.

## Approval / production
- OAuth consent screen verification.
- Some scopes require the **YouTube API Services Audit** (security/compliance review).

## Rate limits
- Quota units per day per project (default 10,000 units); uploads cost 1,600 units.

## Known limitations
- No DM API. Upload quota is expensive; plan for it.
- Comment moderation requires `youtube.force-ssl`.
