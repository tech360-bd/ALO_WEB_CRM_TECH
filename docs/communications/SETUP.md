# Unified Communication Center — Setup

> Mandate §48, §49, §80, §81. How an administrator configures a provider.
> **Never paste secrets into public UI** — use server-side env / secret store.

## Environment variables (grouped — see `.env.example`)

```
ENCRYPTION_KEY        # 64-char hex, AES-256-GCM key for token storage (REQUIRED in prod)
# Meta (Facebook/Instagram/Messenger/WhatsApp)
META_APP_ID / META_APP_SECRET / META_VERIFY_TOKEN
WHATSAPP_VERIFY_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_WABA_ID
# LinkedIn
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
# TikTok
TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET
# YouTube / Google Business
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_PUBSUB_AUDIENCE
# Telegram
TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET
# X (Twitter)
X_CLIENT_ID / X_CLIENT_SECRET / X_CONSUMER_SECRET
# Email
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS  (or Gmail/M365 OAuth)
```

All secret values are placeholders `CONFIGURE_IN_SERVER_SECRET_STORE` in
`.env.example`. Real values are NEVER committed (mandate §50, §87).

## Setup wizard (mandate §48) — 14 steps
1. Select provider → 2. Show official requirements → 3. Show required app config
→ 4. Show required credentials → 5. Configure redirect URI → 6. Configure OAuth
→ 7. Authorize account → 8. Verify token → 9. Configure webhook → 10. Verify
webhook → 11. API health check → 12. Test message (where supported) →
13. Record verification evidence → 14. Show final computed status.

The wizard's status badges come from `computeIntegrationStatus()` — they are
computed, never manually set (mandate §83).

## What the admin must obtain from each provider (mandate §49)
See `docs/integrations/provider-research/<provider>.md` for the exact portal,
scopes, approval gate, and redirect/webhook requirements per provider.

## Verification status
The wizard flow and env schema are `CODE_COMPLETE`. No provider is connected:
`CONFIGURATION_REQUIRED` / `OAUTH_REQUIRED` / `PROVIDER_APPROVAL_REQUIRED` /
`LIVE_TEST_PENDING` as computed.
