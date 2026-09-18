# Instagram Business — Provider Research

> **Status: CODE_COMPLETE (webhook receive partially implemented) / OAUTH_REQUIRED / LIVE_TEST_PENDING.**

## Official sources
- Instagram Platform: https://developers.facebook.com/docs/instagram-api
- Instagram Messaging: https://developers.facebook.com/docs/messenger-platform/instagram
- Content Publishing: https://developers.facebook.com/docs/instagram-api/content-publishing
- Graph API **v21.0**.

## OAuth
- Facebook Login; account must be Business/Creator linked to a Facebook Page.
- Scopes: `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, `instagram_content_publish`.

## Webhook
- Graph Webhooks; `X-Hub-Signature-256` signature.
- Events: `messages` (DMs), `comments`, `mentions`.

## Capabilities
- Receive messages: YES (Instagram Messaging API / DMs).
- Send messages: YES (DMs within 24h window).
- Attachments: YES. Conversation: YES.
- Comments: YES (comment moderation `/{ig-comment-id}`).
- Publishing: PARTIAL — Content Publishing API supports feed/reels/stories for Business accounts; some formats and features are restricted.
- Account management: YES. Revocation: YES.
- Analytics: YES (Instagram Insights).

## Approval / production
- App Review for `instagram_basic`, `instagram_manage_messages`, `instagram_content_publish`.
- Business/Creator account required.

## Rate limits
- Content Publishing: 25 API calls per IG user per 24h for publishing.
- Graph rate limits apply.

## Known limitations
- Not all organic features (e.g. some story interactions) are available via API.
- DMs require the messaging API and a linked Page.
