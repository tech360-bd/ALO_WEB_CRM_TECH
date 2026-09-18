# WhatsApp Business Cloud API — Provider Research

> **Status: CODE_COMPLETE (webhook receive partially implemented) / OAUTH_REQUIRED / LIVE_TEST_PENDING.**

## Official sources
- Docs: https://developers.facebook.com/docs/whatsapp
- Cloud API reference: https://developers.facebook.com/docs/whatsapp/cloud-api
- Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- Platform: Meta Graph API **v21.0**.

## OAuth / auth
- Via Meta Login or Business Login; or a System User token for server-side use.
- Scopes: `whatsapp_business_messaging`, `whatsapp_business_management`.
- Token: long-lived ~60 days; track expiry.

## Webhook
- Verification (GET): echo `hub.challenge` when `hub.verify_token` matches.
- Signature (POST): `X-Hub-Signature-256` HMAC-SHA256 of raw body with app secret.
- Events: inbound `messages`, `statuses` (sent/delivered/read/failed).
- No native replay protection — dedupe on message id.

## Capabilities
- Receive messages: YES. Send messages: YES.
- Messaging rules: free-form (session) messages within a **24-hour** customer-service window; outside it you must send an approved **template**.
- Templates: pre-approved message templates required for business-initiated conversations.
- Media: YES (image/video/audio/document/sticker/location/contact) via uploaded media id.
- Conversation: YES. Comments: NOT SUPPORTED (no public comment surface).
- Account management: YES (WABA id + phone number id).
- Revocation: YES.

## Approval / production
- Business verification + display-name approval required to message beyond the test number.
- Messaging limits tiered by business verification status.

## Rate limits
- Throughput limits per phone number; honour 429 + backoff.

## Known limitations
- No bulk/unsolicited messaging — opt-in and template rules enforced.
- Test number allows limited recipients before verification.
