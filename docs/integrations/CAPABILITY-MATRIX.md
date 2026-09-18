# Capability Matrix — Unified Communication Center

> Generated from `src/lib/ucc/providers/registry.ts` on 2026-09-18. Do not edit by hand.
>
> **Provider** = the official API's stance (verified against provider docs).
> **Impl** = our codebase's stance. `NOT_SUPPORTED` means the official API does
> not offer the capability — it is NEVER a missing implementation (mandate §53).

Values: `YES` / `NO` / `PARTIAL` / `NOT_SUPPORTED` (provider) · `IMPL` / `PART` / `—` / `N/A` (implementation).

| Capability | Email | WhatsApp | Facebook | Facebook | Instagram | LinkedIn | TikTok | YouTube | Google | Telegram | X |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `oauth` | PARTIAL<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | NO<br>N/A | YES<br>— |
| `token_refresh` | PARTIAL<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | NOT_SUPPORTED<br>N/A | YES<br>— |
| `webhook` | NO<br>N/A | YES<br>PART | YES<br>PART | YES<br>PART | YES<br>PART | PARTIAL<br>— | PARTIAL<br>— | PARTIAL<br>— | PARTIAL<br>— | YES<br>— | YES<br>— |
| `signature_validation` | PARTIAL<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | PARTIAL<br>— | PARTIAL<br>— | PARTIAL<br>— | PARTIAL<br>— | YES<br>— | YES<br>— |
| `receive_messages` | YES<br>— | YES<br>PART | YES<br>PART | YES<br>PART | YES<br>PART | NOT_SUPPORTED<br>N/A | NOT_SUPPORTED<br>N/A | NOT_SUPPORTED<br>N/A | NOT_SUPPORTED<br>N/A | YES<br>— | YES<br>— |
| `send_messages` | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | NOT_SUPPORTED<br>N/A | NOT_SUPPORTED<br>N/A | NOT_SUPPORTED<br>N/A | NOT_SUPPORTED<br>N/A | YES<br>— | YES<br>— |
| `attachments` | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | PARTIAL<br>— | PARTIAL<br>— | PARTIAL<br>— | PARTIAL<br>— | YES<br>— | YES<br>— |
| `conversation` | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | PARTIAL<br>— | NOT_SUPPORTED<br>N/A | PARTIAL<br>— | PARTIAL<br>— | YES<br>— | YES<br>— |
| `comments` | — | NOT_SUPPORTED<br>N/A | YES<br>— | — | YES<br>— | YES<br>— | PARTIAL<br>— | YES<br>— | YES<br>— | PARTIAL<br>— | YES<br>— |
| `account_management` | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | PARTIAL<br>— | PARTIAL<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— |
| `revocation` | PARTIAL<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— |
| `publishing` | — | — | YES<br>— | — | PARTIAL<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | — | YES<br>— |
| `advertising` | — | — | YES<br>— | — | — | YES<br>— | YES<br>— | YES<br>— | PARTIAL<br>— | — | PARTIAL<br>— |
| `analytics` | PARTIAL<br>— | PARTIAL<br>— | YES<br>— | — | YES<br>— | YES<br>— | PARTIAL<br>— | YES<br>— | YES<br>— | NO<br>N/A | PARTIAL<br>— |
| `live_test` | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— | YES<br>— |

## NOT_SUPPORTED explanations (mandate §5, §53)

### Email (SMTP / IMAP) (`email`)
- `webhook` — **NO**: Inbound email arrives via IMAP polling or provider push (e.g. SendGrid Inbound Parse), not a universal webhook.

### WhatsApp Business Cloud API (`whatsapp`)
- `comments` — **NOT_SUPPORTED**: WhatsApp has no public comment surface.

### LinkedIn (Community Management API) (`linkedin`)
- `receive_messages` — **NOT_SUPPORTED**: LinkedIn Messaging API is closed; DMs are NOT available to partner apps. Do not claim messaging.
- `send_messages` — **NOT_SUPPORTED**: No member-to-member messaging API. Only organization posts/comments.

### TikTok for Developers (`tiktok`)
- `receive_messages` — **NOT_SUPPORTED**: No public DM API in TikTok for Developers.
- `send_messages` — **NOT_SUPPORTED**: No public DM API.
- `conversation` — **NOT_SUPPORTED**: no official endpoint

### YouTube Data API v3 (`youtube`)
- `receive_messages` — **NOT_SUPPORTED**: No DM surface. Comments are the inbound channel.
- `send_messages` — **NOT_SUPPORTED**: No DM API. Reply to comments instead.

### Google Business Profile APIs (`google_business`)
- `receive_messages` — **NOT_SUPPORTED**: No consumer messaging API. Reviews are the inbound channel.
- `send_messages` — **NOT_SUPPORTED**: No consumer messaging API. Reply to reviews instead.

### Telegram Bot API (`telegram`)
- `oauth` — **NO**: Bot API uses a static bot token, not OAuth. (Telegram Login Widget is a separate user-auth product.)
- `token_refresh` — **NOT_SUPPORTED**: Bot tokens do not expire; rotate via BotFather /revoke.
- `analytics` — **NO**: No native analytics API.
