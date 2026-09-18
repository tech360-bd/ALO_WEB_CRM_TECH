# Meta (Facebook / Instagram / Messenger / WhatsApp) — Provider Research

> Umbrella OAuth application that fronts the Facebook, Instagram, Messenger and
> WhatsApp Business channels. The leaf channels have their own research docs;
> this file covers the shared Meta platform mechanics.
>
> **Status: CODE_COMPLETE (webhook receive partially implemented) / OAUTH_REQUIRED / LIVE_TEST_PENDING.**
> Nothing here has been live-verified in this environment.

## Official sources
- Developer portal: https://developers.facebook.com
- Graph API reference: https://developers.facebook.com/docs/graph-api
- Webhooks: https://developers.facebook.com/docs/graph-api/webhooks
- Login / permissions: https://developers.facebook.com/docs/facebook-login
- Current API version at time of writing: **v21.0** (verify before build).

## OAuth
- Method: OAuth 2.0 authorization-code (Facebook Login / Business Login).
- Authorization endpoint: `https://www.facebook.com/v21.0/dialog/oauth`
- Token endpoint: `https://graph.facebook.com/v21.0/oauth/access_token`
- PKCE: supported (`code_challenge` / `code_verifier`).
- `state`: required for CSRF; validate exact match on callback.
- Scopes (request only what each channel needs):
  - Pages: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_messaging`, `pages_read_user_content`
  - Instagram: `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, `instagram_content_publish`
  - WhatsApp: `whatsapp_business_management`, `whatsapp_business_messaging`
  - Business: `business_management`
- Token lifetime: short-lived user token ~1–2h; exchange for long-lived (~60 days). Page tokens derived from a long-lived user token can be non-expiring.
- Refresh: long-lived tokens are re-exchanged, not silently refreshed; track `tokenExpiresAt`.

## Webhooks
- Mechanism: Graph API Webhooks (subscribe an app to object fields).
- Verification (GET): echo `hub.challenge` when `hub.verify_token` matches `WHATSAPP_VERIFY_TOKEN` / app verify token.
- Signature (POST): `X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of raw body with app secret>`.
- Replay protection: none native — dedupe on event id / message id.
- Events: `messages`, `messaging_postbacks`, `feed` (comments/reactions), `message_deliveries`, `message_reads`, WhatsApp `statuses`.

## Capabilities
- Receive messages: YES (Messenger + Instagram DM + WhatsApp).
- Send messages: YES (24-hour standard messaging window; WhatsApp templates outside it).
- Attachments/media: YES (upload media, send by attachment id).
- Conversation: YES.
- Comments: YES (Page feed + Instagram comments).
- Account management: YES (Pages, IG Business accounts, WABA phone numbers).
- Revocation: YES (token revoke + permission deauthorize).
- Publishing: YES for Pages/Instagram (Content Publishing API); formats restricted per surface.
- Advertising: YES via the separate Marketing API.
- Analytics: YES (Page Insights, Instagram Insights).

## Approval / production requirements
- App Review required for `pages_messaging`, `pages_read_engagement`, `pages_manage_posts`, Instagram messaging, WhatsApp messaging.
- Business verification required for advanced access and WhatsApp production messaging.
- WhatsApp: display-name approval + business verification before messaging beyond the test number.

## Rate limits
- Graph API: app-level and page-level rate limits (X-Business-Use-Case-Usage / X-App-Usage headers). Honour 429 with backoff.

## Data retention / deletion
- Honour user data-deletion callbacks; provide a data-deletion callback URL in app settings.

## Known limitations
- Messaging windows restrict unsolicited outbound messages.
- Instagram messaging requires a Business/Creator account linked to a Facebook Page.
- Some Instagram publishing formats are unavailable via API.
