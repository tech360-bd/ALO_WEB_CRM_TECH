# Facebook Pages — Provider Research

> **Status: CODE_COMPLETE (webhook receive partially implemented) / OAUTH_REQUIRED / LIVE_TEST_PENDING.**

## Official sources
- Pages API: https://developers.facebook.com/docs/pages-api
- Messenger Platform: https://developers.facebook.com/docs/messenger-platform
- Graph API **v21.0**.

## OAuth
- Facebook Login OAuth 2.0; PKCE supported; `state` required.
- Token endpoint: `https://graph.facebook.com/v21.0/oauth/access_token`.
- Scopes: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_messaging`, `pages_read_user_content`.
- Long-lived page tokens can be non-expiring when derived from a long-lived user token.

## Webhook
- Graph Webhooks on the Page object.
- Signature: `X-Hub-Signature-256`.
- Events: `feed` (posts/comments/reactions), `messages` (via Messenger).

## Capabilities
- Receive/send messages: YES (via Messenger Platform; 24h window).
- Comments: YES (`/{comment-id}`, `/{page-id}/feed`).
- Publishing: YES (`/{page-id}/feed`, photos, videos).
- Attachments: YES. Conversation: YES.
- Account management: YES (Pages the user administers).
- Advertising: YES (Marketing API, separate permissions).
- Analytics: YES (Page Insights).
- Revocation: YES.

## Approval / production
- App Review for `pages_messaging`, `pages_read_engagement`, `pages_manage_posts`.
- Business verification for advanced access.

## Rate limits
- Page-level and app-level Graph rate limits; honour 429.

## Known limitations
- Messaging windows restrict unsolicited DMs.
- Group APIs are largely deprecated/restricted.
