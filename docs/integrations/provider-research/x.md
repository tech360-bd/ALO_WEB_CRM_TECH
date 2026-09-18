# X (Twitter) — Provider Research

> **Status: CODE_COMPLETE (planned) / PROVIDER_APPROVAL_REQUIRED / LIVE_TEST_PENDING.**

## Official sources
- Portal: https://developer.x.com (developer.twitter.com redirects here)
- API docs: https://docs.x.com/x-api
- Account Activity API: https://docs.x.com/x-api/account-activity/introduction
- Webhooks: V2 Webhooks API (`/2/webhooks`)

## Pricing / access (verified, current)
- As of **Feb 2026** the default tier is **pay-per-use** (credits purchased upfront); there is **no free tier for new developers**.
- Legacy Basic/Pro are grandfathered only; Enterprise for high volume.
- Account Activity API webhooks: **Pay-Per-Use = 1 webhook / 3 subscriptions; Enterprise = 5+ / 5000+**.

## OAuth
- OAuth 2.0 with PKCE (user context) or OAuth 1.0a; App-Only bearer for app context.
- Scopes: `tweet.read`, `tweet.write`, `users.read`, `dm.read`, `dm.write`, `offline.access` (refresh).
- Refresh tokens via `offline.access`.

## Webhook
- V2 Webhooks API + Account Activity API.
- Registration: Challenge-Response Check (CRC) — reply with `sha256=<base64 HMAC-SHA256(crc_token, consumer_secret)>`.
- Signature (POST): `x-twitter-webhooks-signature: sha256=<base64 HMAC-SHA256 of raw body with consumer secret>`.
- **No timestamp in the signature → no native replay protection.** Dedupe on event id.
- Events: `tweet_create_events`, `direct_message_events`, `favorite_events`, `follow_events`, `user_event` (deauthorization).

## Capabilities
- Receive messages: YES (`direct_message_events` via Account Activity API).
- Send messages: YES (DM endpoints + post creation).
- Attachments: YES (media upload, v2).
- Conversation: YES (DM conversations + reply threads).
- Comments: YES (replies/mentions via `tweet_create_events`).
- Publishing: YES (`POST /2/tweets`).
- Account management: YES (`users/me`).
- Advertising: PARTIAL (X Ads API is a separate product/contract).
- Analytics: PARTIAL (public metrics on tweets; deeper metrics tier-gated).
- Revocation: YES (`user_event` on deauthorization).

## Approval / production
- Approved developer account + Project + App.
- Account Activity API requires Pay-Per-Use or Enterprise access.
- Public HTTPS endpoint, no port in URL, respond within 10s.

## Rate limits
- Per-tier and per-endpoint; pay-per-use charges per call. Honour 429.

## Known limitations
- No replay protection on webhooks.
- Webhook/subscription counts are tier-capped.
- No free tier for new developers.
