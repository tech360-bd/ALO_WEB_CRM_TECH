# Telegram — Provider Research

> **Status: CODE_COMPLETE (reference adapter implemented) / CONFIGURATION_REQUIRED / LIVE_TEST_PENDING.**
> The Telegram reference adapter (`src/lib/ucc/providers/adapters/telegram-adapter.ts`)
> is implemented but has NOT been live-verified (no bot token, sandbox egress blocked).

## Official sources
- Bot API: https://core.telegram.org/bots/api
- Webhooks: https://core.telegram.org/bots/webhooks
- BotFather: https://t.me/BotFather

## Auth
- **No OAuth.** The Bot API uses a static bot token issued by @BotFather.
- Token does not expire; rotate via BotFather `/revoke`.
- (The Telegram Login Widget is a separate user-authentication product, not the Bot API.)

## Webhook
- `setWebhook` with a `secret_token`.
- Telegram echoes the secret in the `X-Telegram-Bot-Api-Secret-Token` header — compare constant-time.
- No body signature; the secret_token is the authentication.

## Capabilities
- Receive messages: YES. Send messages: YES (`sendMessage` etc.).
- Attachments: YES (`sendPhoto`, `sendDocument`, `sendVideo`, `sendVoice`).
- Conversation: YES (chat id maps to a conversation).
- Comments: PARTIAL (channel comments via linked discussion group).
- Account management: YES (`getMe`, `getChat`).
- Revocation: YES (`deleteWebhook` + BotFather revoke).
- Analytics: NO (no native analytics API).
- OAuth: NO. Token refresh: NOT SUPPORTED (static token).

## Approval / production
- No app review. Create a bot via @BotFather and configure the webhook.
- Use a strong `secret_token` and serve the webhook over HTTPS.

## Rate limits
- ~30 messages/second globally; per-chat limits. Honour 429 with `retry_after`.

## Known limitations
- No OAuth, no native analytics.
- Bot must be added to groups/channels to read them.
