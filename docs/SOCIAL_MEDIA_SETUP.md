# Social Media Setup — 10 Platforms (Official + Employee)

**Official OAuth only** — never store employee tokens in `.env`. Tokens encrypted AES-256-GCM with `ENCRYPTION_KEY` server-side.

## Admin Official Accounts

Page: `src/app/admin/settings/digital-assets/page.tsx` (SUPER_ADMIN|ADMIN guard). CRUD `SocialIntegration` + `SocialAccount`, verification `GET /{pageId}?fields=name&access_token`, token expiry `tokenExpiresAt`, capabilities, `ProviderErrorLog`, `IntegrationAuditLog`.

Supported (where officially available):
- **Facebook Pages** — `FACEBOOK_APP_ID/SECRET` → `developers.facebook.com` → OAuth `pages_show_list,pages_read_engagement,pages_messaging` → business `SocialIntegration` provider `facebook_page`.
- **Instagram Business** — `INSTAGRAM_APP_ID/SECRET` (Graph API, requires FB Page linked) → `instagram_basic`.
- **WhatsApp Business** — Meta Cloud (see `WHATSAPP_SETUP.md`), provider `whatsapp`.
- **LinkedIn Pages** — `LINKEDIN_CLIENT_ID/SECRET` → `linkedin.com/developers` → `r_organization_social,rw_organization_admin` → `linkedin`.
- **YouTube** — `GOOGLE_CLIENT_ID/SECRET` (or `YOUTUBE_CLIENT_ID/SECRET`) Google Cloud OAuth youtube.readonly → `youtube`. Reuses Google OAuth.
- **TikTok** — `TIKTOK_CLIENT_KEY/SECRET` → `TikTok for Business` → `user.info.basic,video.list` → `tiktok`.
- **X** — `X_CLIENT_ID/SECRET` + `X_BEARER_TOKEN` → `developer.x.com` OAuth 2.0 `tweet.read,users.read` → `x`.
- **Telegram** — `TELEGRAM_BOT_TOKEN` from @BotFather → `telegram` (bot, not OAuth) → webhook `POST /api/crm/ucc/webhooks/telegram`.
- **Pinterest** — `PINTEREST_APP_ID/SECRET` → `boards:read,pins:read` → `pinterest`.
- **Google Business Profile** — `GOOGLE_CLIENT_ID/SECRET` + `GOOGLE_BUSINESS_ACCOUNT_ID` → Business Profile API → `google_business` (separate from GA4/Search Console).

Callbacks: `https://aloeducation.com/api/crm/ucc/oauth/callback` + `https://aloeducation.com/api/integrations/[platform]/callback`. Webhooks: `https://aloeducation.com/api/crm/ucc/webhooks/[provider]`.

## Employee My Accounts

Page: `src/app/employee/my-accounts/page.tsx` (own `PortalUser.id`). Own OAuth `state`+PKCE → `POST /api/employee/social-accounts/connect`, request official access → `ApprovalRequest` → admin approves. Disconnect: revoke at provider + delete `SocialAccountOwnership` + `SocialAccountToken` row. Audit `SocialWebhookEvent` + `aloAuditLog`.

## Security

- `ENCRYPTION_KEY` 64-hex — rotate requires re-encrypt (documented in `SECURITY_AUDIT_FINAL_REPORT.md`).
- `accessToken` encrypted before `db.socialIntegration.create/update`, decrypted only server-side for API calls, never logged.
- Rate limit per platform via `src/lib/rate-limiter.ts` (Redis).
- Token expiry handling: check `tokenExpiresAt` < now → status `expired`, prompt reconnect.

## Verification

Admin: connect → verify `GET /{pageId}?fields=name` → `healthStatus healthy` + `lastSyncAt` now. Employee: connect own → see `connected` + assetName. Revoke: disconnect → status `disconnected` + audit.
