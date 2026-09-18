# Facebook Messenger — Provider Research

> **Status: CODE_COMPLETE (webhook receive partially implemented) / OAUTH_REQUIRED / LIVE_TEST_PENDING.**

## Official sources
- Messenger Platform: https://developers.facebook.com/docs/messenger-platform
- Send API: https://developers.facebook.com/docs/messenger-platform/send
- Graph API **v21.0**.

## OAuth
- Facebook Login; scope `pages_messaging` (+ `pages_messaging_subscriptions` for tags).
- Page access token required to message a Page's conversations.

## Webhook
- Graph Webhooks on the Page; `X-Hub-Signature-256` signature.
- Events: `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`, `messaging_referrals`.

## Capabilities
- Receive messages: YES. Send messages: YES (Send API).
- Messaging policy: 24-hour standard messaging window; message tags / sponsored messages for specific out-of-window cases per policy.
- Attachments: YES (image/audio/video/file, templates).
- Conversation: YES. Comments: NO (DMs only).
- Account management: YES. Revocation: YES.

## Approval / production
- `pages_messaging` requires App Review.
- Broadcasting must use approved message tags; no unsolicited bulk messaging.

## Rate limits
- Per-page messaging rate limits; honour 429.

## Known limitations
- No unsolicited promotional broadcasting outside policy.
- Handover protocol needed when multiple apps handle one Page.
