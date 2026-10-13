# ENVIRONMENT_VARIABLES.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Environment Variables Reference |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | Complete reference for every environment variable the application reads. For each: name, required (yes/no), description, example, where to set, and whether it's public-safe. |

---

## Where to set environment variables

| Location | When to use |
|---|---|
| **`.env` file at `/home/aloeduca/alaminn.info/.env`** (mode 600) | Primary location. Loaded by `server.js` BEFORE Next.js boots. Reproducible across deploys. |
| **cPanel UI → Setup Node.js App → Environment variables** | Emergency overrides. Wins over `.env`. Use sparingly. |
| **Local development `.env`** (gitignored) | For dev work. Set `DATABASE_URL=file:./dev.db` and dev fallbacks. |

> **Critical security rule**: `.env` MUST live at `/home/aloeduca/alaminn.info/.env` (OUTSIDE `public_html`). If placed inside `public_html`, it becomes web-accessible at `https://alaminn.info/.env` and leaks every secret.

---

## Conventions

- **Public-safe** = "Yes" means the value is safe to expose to the browser (e.g. `NEXT_PUBLIC_SITE_URL`). "No" means it MUST stay server-side.
- **Required in prod** = "Yes" means the app refuses to start (`throw new Error("FATAL...")`) when missing in production. "No" means a dev fallback or null is acceptable.
- All secrets should be generated with `openssl rand -hex 32` (64 hex chars = 256 bits of entropy).

---

## Complete variable table

### Application

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 1 | `NODE_ENV` | Yes | Node environment — must be `production` in prod. Forces React prod build, secure cookies, HSTS, fatal-on-missing-secret. | `production` | `.env` + cPanel UI | Yes |
| 2 | `PORT` | No (Passenger sets it) | TCP port the Next.js standalone server binds to. cPanel/Passenger sets this automatically. On VPS, set to 3000 or 3001. | `3000` | cPanel auto (Passenger) | Yes |
| 3 | `APP_URL` / `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` | Yes | Public site URL (no trailing slash). Used for emails, OG tags, sitemap, cookie domain. | `https://alaminn.info` | `.env` | Yes |
| 4 | `APP_ENV` | No (defaults to `production` when `NODE_ENV=production`) | Application environment label. | `production` | `.env` | Yes |
| 5 | `APP_DEBUG` | No | Boolean flag for verbose debug output. Set to `false` in production. | `false` | `.env` | Yes |
| 6 | `LOG_LEVEL` | No (defaults to `info`) | Logging verbosity: `error` / `warn` / `info` / `debug`. Use `debug` only during incident response. | `info` | `.env` | Yes |

### Database

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 7 | `DATABASE_URL` | Yes | Prisma connection string. MySQL 8 in prod, SQLite in dev. | `mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_crm` | `.env` | **No** (contains password) |
| 8 | `DB_CONNECTION` | No | Database type (informational; `DATABASE_URL` is authoritative). | `mysql` | `.env` | Yes |
| 9 | `DB_HOST` | No | MySQL host (informational). | `localhost` | `.env` | Yes |
| 10 | `DB_PORT` | No | MySQL port (informational). | `3306` | `.env` | Yes |
| 11 | `DB_DATABASE` | No | Database name (informational). | `aloeduca_alamin_crm` | `.env` | Yes |
| 12 | `DB_USERNAME` | No | Database user (informational). | `aloeduca_alamin_crm` | `.env` | Yes |
| 13 | `DB_PASSWORD` | Yes (if using `scripts/backup.sh`) | Database password. Used by `scripts/backup.sh` and `scripts/restore.sh` when `DATABASE_URL` is not parseable. | `ALO2026a` | `.env` | **No** |
| 14 | `DB_CHARSET` | No | Database charset (informational). Must be `utf8mb4`. | `utf8mb4` | `.env` | Yes |
| 15 | `DB_COLLATION` | No | Database collation (informational). Must be `utf8mb4_unicode_ci`. | `utf8mb4_unicode_ci` | `.env` | Yes |

### Authentication

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 16 | `AUTH_SECRET` | Yes (≥ 32 bytes) | HMAC-SHA256 key for signing session cookies. Generate with `openssl rand -hex 32`. | `fa3cd58aef44d1b6496354dd51387bf4749902553b3fcc7079b88a91d12d6d72` | `.env` | **No** |
| 17 | `JWT_SECRET` | No (NOT USED) | Listed for documentation only. The app uses custom HMAC-SHA256 session cookies (`src/lib/auth.ts`), NOT JWTs. If set, the value is ignored. | (unset) | — | — |
| 18 | `NEXTAUTH_SECRET` | No (NOT USED) | Despite the name, **NextAuth is NOT installed**. The var is kept for backward-compat with cPanel auto-detection. Functionally inert. | (any value or unset) | `.env` | No (treat as secret) |
| 19 | `NEXTAUTH_URL` | Yes (set to site URL) | Despite the NextAuth-prefixed name, this is read by `src/lib/env.ts` as the canonical site URL alias. Same value as `NEXT_PUBLIC_SITE_URL`. | `https://alaminn.info` | `.env` | Yes |
| 20 | `CRON_SECRET` | Yes (required by 11 cron endpoints) | Shared secret for `/api/cron/*` endpoints. Verified in constant time via `timingSafeEqual`. If unset, all cron endpoints return 503. Generate with `openssl rand -hex 32`. | `b8c9a0f1e2d3c4b5a6978877665544332211ffeeddccbbaa9988776655443322` | `.env` + cPanel cron command | **No** |

### Admin bootstrap

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 21 | `ADMIN_EMAIL` | Yes (required by `scripts/seed-admin.ts`) | Email of the initial super-admin user. Used at seed time only. | `admin@alaminn.info` | `.env` | Yes |
| 22 | `ADMIN_PASSWORD` | Yes (required by `scripts/seed-admin.ts`) | Password of the initial super-admin. Hashed with scrypt before storage. **CHANGE THE DEFAULT before going live.** | `ChangeMeBeforeGoingLive2026!` → replace with a 12+ char strong password | `.env` | **No** |
| 23 | `ADMIN_NAME` | Yes (required by `scripts/seed-admin.ts`) | Display name of the initial super-admin. | `Al Aminn` | `.env` | Yes |

### ALO Education integration (Higher Study)

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 24 | `ALO_EDUCATION_API_URL` | Yes (for ALO integration) | Base URL of the ALO Education application platform API. Used for server-to-server referral callbacks. | `https://aloeducation.com/api/v1` | `.env` | Yes |
| 25 | `ALO_EDUCATION_API_KEY` | Yes (for ALO integration) | API key sent in the `Authorization` header when calling ALO Education's API. | `ak_live_abc123...` | `.env` | **No** |
| 26 | `ALO_EDUCATION_SIGNING_SECRET` | Yes (for ALO integration) | Shared HMAC secret used to sign referral tokens. ALO Education verifies with the same secret. Generate with `openssl rand -hex 32`. | `e1f2a3b4c5d6e7f8...` | `.env` | **No** |
| 27 | `HIGHER_STUDY_REFERRAL_SECRET` | Yes (for Higher Study referrals) | HMAC secret for signing Higher Study referral tokens (the cryptographic link between Alaminn.info audit row and ALO Education session). Generate with `openssl rand -hex 32`. | `85c1582248f80b976e35148cc2e5f401bccb43dec44ef3ab0d4cb8f5f3db1b78` | `.env` | **No** |

### English Learning integration

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 28 | `ENGLISH_PLATFORM_URL` | Yes (for English Learning referrals) | Base URL of the English Learning destination platform. Used to build referral redirect URLs. | `https://english.alaminn.info` or `https://aloeducation.com/english` | `.env` | Yes |
| 29 | `ENGLISH_LEARNING_REFERRAL_SECRET` | Yes (for English Learning referrals) | HMAC secret for signing English Learning referral tokens. Parallel to `HIGHER_STUDY_REFERRAL_SECRET` but for the English platform. Generate with `openssl rand -hex 32`. | `95afc160897faff59bf8c93e796348a7db17e229e7c427b0b1e6c0a875a2ad0a` | `.env` | **No** |

### SMTP / Email

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 30 | `SMTP_HOST` | Yes (or use Resend) | SMTP server hostname. Use cPanel email's host. | `mail.alaminn.info` | `.env` | Yes |
| 31 | `SMTP_PORT` | Yes (or use Resend) | SMTP port. 465 for SSL, 587 for STARTTLS. | `465` | `.env` | Yes |
| 32 | `SMTP_USER` | Yes (or use Resend) | SMTP username (the cPanel email address). | `noreply@alaminn.info` | `.env` | Yes |
| 33 | `SMTP_PASS` / `SMTP_PASSWORD` | Yes (or use Resend) | SMTP password (the cPanel email account password). Both spellings work; `SMTP_PASSWORD` is the canonical name in `.env.production`. | `your-cpanel-email-password` | `.env` | **No** |
| 34 | `SMTP_SECURE` | Yes | Transport security. `ssl` for port 465, `starttls` for port 587, `false` for no encryption. | `ssl` | `.env` | Yes |
| 35 | `MAIL_FROM` / `EMAIL_FROM` | Yes | Default `From:` address for outgoing email. Both spellings work; `EMAIL_FROM` is canonical. | `Alaminn.info <noreply@alaminn.info>` | `.env` | Yes |
| 36 | `EMAIL_REPLY_TO` | No (defaults to `EMAIL_FROM`) | `Reply-To:` address for outgoing email. | `Alaminn.info <hello@alaminn.info>` | `.env` | Yes |
| 37 | `RESEND_API_KEY` | No (alternative to SMTP) | Resend.com API key. If set, the email-worker uses Resend's API instead of SMTP. | `re_xxxxxxxxxxxxxxxxxxxxxxxx` | `.env` | **No** |

### WhatsApp (optional)

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 38 | `WHATSAPP_TOKEN` | No | WhatsApp Cloud API access token. Used for sending WhatsApp notifications (deadline alerts, etc.). | `EAAG...` | `.env` | **No** |
| 39 | `WHATSAPP_PHONE_NUMBER_ID` | No | WhatsApp Cloud API phone number ID (sender). | `123456789012345` | `.env` | Yes |

### Analytics (optional)

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 40 | `ANALYTICS_ID` | No | External analytics ID (e.g. Google Analytics 4 measurement ID). If unset, only first-party privacy-friendly analytics (`AnalyticsEvent` model) are used. | `G-XXXXXXXXXX` | `.env` | Yes |

### Mini-service ports (optional)

| # | Name | Required in prod | Description | Example | Where to set | Public-safe |
|---|---|---|---|---|---|---|
| 41 | `EMAIL_WORKER_PORT` | No (defaults to 3002) | Port for the email-worker mini-service. | `3002` | `.env` | Yes |
| 42 | `AUDIT_WORKER_PORT` | No (defaults to 3003) | Port for the audit-worker mini-service. | `3003` | `.env` | Yes |
| 43 | `HEALTH_MONITOR_PORT` | No (defaults to 3004) | Port for the health-monitor mini-service. | `3004` | `.env` | Yes |
| 44 | `NOTIFICATION_SERVICE_PORT` | No (defaults to 3005) | Port for the notification-service mini-service. | `3005` | `.env` | Yes |

---

## Required vs optional — summary

### MUST be set in production (app refuses to start without these)

1. `NODE_ENV=production`
2. `APP_URL` / `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` (= `https://alaminn.info`)
3. `DATABASE_URL=mysql://...` (production MySQL connection string)
4. `AUTH_SECRET` (≥ 32 bytes — generate with `openssl rand -hex 32`)
5. `CRON_SECRET` (≥ 32 bytes — required by all 11 cron endpoints)
6. `EMAIL_FROM` / `MAIL_FROM` (production email From address)
7. SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`) OR `RESEND_API_KEY`
8. `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (required by `scripts/seed-admin.ts` at seed time)

### MUST be set for full feature parity

9. `ALO_EDUCATION_API_URL`, `ALO_EDUCATION_API_KEY`, `ALO_EDUCATION_SIGNING_SECRET`
10. `HIGHER_STUDY_REFERRAL_SECRET`
11. `ENGLISH_PLATFORM_URL`, `ENGLISH_LEARNING_REFERRAL_SECRET`

### Optional

12. `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
13. `ANALYTICS_ID`
14. `RESEND_API_KEY` (alternative to SMTP)
15. `LOG_LEVEL` (defaults to `info`)
16. `APP_ENV`, `APP_DEBUG`
17. `DB_*` informational fields (used by backup scripts)
18. Mini-service ports (only if running mini-services)

---

## Generating strong secrets

```bash
# AUTH_SECRET
openssl rand -hex 32
# Output: fa3cd58aef44d1b6496354dd51387bf4749902553b3fcc7079b88a91d12d6d72

# CRON_SECRET
openssl rand -hex 32

# ALO_EDUCATION_SIGNING_SECRET
openssl rand -hex 32

# HIGHER_STUDY_REFERRAL_SECRET
openssl rand -hex 32

# ENGLISH_LEARNING_REFERRAL_SECRET
openssl rand -hex 32
```

> Each secret MUST be unique. Do NOT reuse the same hex string across multiple vars.

---

## Public-safe classification

### Public-safe (safe to expose in browser-side JavaScript)

- `NODE_ENV`
- `APP_URL` / `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL`
- `APP_ENV`, `APP_DEBUG`, `LOG_LEVEL`
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_CHARSET`, `DB_COLLATION`
- `NEXTAUTH_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_SECURE`
- `MAIL_FROM` / `EMAIL_FROM`, `EMAIL_REPLY_TO`
- `ENGLISH_PLATFORM_URL`, `ALO_EDUCATION_API_URL`
- `ANALYTICS_ID`
- `WHATSAPP_PHONE_NUMBER_ID`
- Mini-service ports

### NOT public-safe (MUST stay server-side only)

- `DATABASE_URL` (contains password)
- `DB_PASSWORD`
- `AUTH_SECRET`
- `JWT_SECRET` (not used, but treat as secret if set)
- `NEXTAUTH_SECRET` (not used, but treat as secret if set)
- `CRON_SECRET`
- `ADMIN_PASSWORD`
- `ALO_EDUCATION_API_KEY`
- `ALO_EDUCATION_SIGNING_SECRET`
- `HIGHER_STUDY_REFERRAL_SECRET`
- `ENGLISH_LEARNING_REFERRAL_SECRET`
- `SMTP_PASS` / `SMTP_PASSWORD`
- `RESEND_API_KEY`
- `WHATSAPP_TOKEN`

---

## How `.env` is loaded

The `server.js` entry point contains a minimal inline parser (no `dotenv` dependency):

1. Reads `/home/aloeduca/alaminn.info/.env` (the app root).
2. For each non-comment, non-empty line, splits on the first `=`.
3. Strips surrounding quotes (single or double).
4. Sets `process.env[key] = val` ONLY IF the var is not already set in the environment.

> This means cPanel UI env vars (set in the Passenger process env before `server.js` runs) take precedence over `.env` values. Use this for emergency overrides.

After loading `.env`, `server.js` sets `NODE_ENV=production` (if not already set) and requires `.next/standalone/server.js` (the Next.js standalone server).

`src/lib/env.ts` then validates the loaded env at first access:
- Throws `FATAL: AUTH_SECRET is missing in production` if `AUTH_SECRET` is empty in prod
- Throws `FATAL: AUTH_SECRET must be at least 32 bytes in production` if too short
- Throws `FATAL: EMAIL_FROM is missing in production` if email From is empty in prod
- Logs `WARNING: No email transport configured` if SMTP and Resend are both unset

---

## Verifying the env at runtime

```bash
# Check that .env is loaded
cd ~/alaminn.info
node -e "
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('MISSING: .env not found at', envPath);
  process.exit(1);
}
const raw = fs.readFileSync(envPath, 'utf8');
const lines = raw.split('\n').filter(l => l && !l.startsWith('#'));
const keys = lines.map(l => l.split('=')[0].trim());
console.log('Loaded keys:', keys.length);
const required = ['NODE_ENV','DATABASE_URL','AUTH_SECRET','CRON_SECRET','EMAIL_FROM','ADMIN_PASSWORD'];
const missing = required.filter(k => !keys.includes(k));
if (missing.length) {
  console.error('MISSING required vars:', missing);
  process.exit(1);
}
console.log('All required vars present.');
"
```

Or via the health endpoint:
```bash
curl -s https://alaminn.info/api/health | python3 -m json.tool
# Look for "env" or "config" object that shows which vars are loaded
```

---

## Reference

- **`.env` location**: `/home/aloeduca/alaminn.info/.env` (mode 600, outside public_html)
- **Template**: `deploy/cpanel/.env.production` (copy to `.env`)
- **Total env vars**: 44 (across 7 categories)
- **Required in prod**: 11 (app refuses to start without these)
- **Required for full feature parity**: 7 more (ALO Education + English Learning integration)
- **Secrets generator**: `openssl rand -hex 32`
- **Env validation source**: `src/lib/env.ts`
- **`.env` parser**: inline in `server.js`
