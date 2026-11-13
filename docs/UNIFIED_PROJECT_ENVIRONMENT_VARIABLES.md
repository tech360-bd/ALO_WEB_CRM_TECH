# Unified Project — Environment Variables

**Date:** 2026-10-27
**Source of truth:** `.env.example`, `.env.production.example`, `.env.ai-gateway.example`
**Status:** **NO `.env` FILE PRESENT** in the checkout. The application cannot boot without
configuration. No secret values are reproduced here.

---

## 1. Inventory

| Template | Variables | Purpose |
|---|---|---|
| `.env.example` | **242** | Full documented set (dev + prod), well-commented by section |
| `.env.production.example` | ~ (14,289 B) | Production subset |
| `.env.ai-gateway.example` | ~ (4,178 B) | AI gateway provider config |
| Actual `.env` | **0 — absent** | Must be created from a template |

- **154** of the 242 variables are **optional** (empty in the template).
- Variables are grouped: core/hosting, database, email, AI layer, storage/integrations,
  malware scanning, WhatsApp, telephony/SMS, social OAuth, Google SEO/Analytics, cron, etc.

---

## 2. Required (application will not start / will fail closed without these)

| Variable | Purpose | Where referenced | Documented | Present |
|---|---|---|---|---|
| `DATABASE_URL` | **Single** Prisma/MySQL connection source. Do **not** use legacy `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD` — app does not consume them. | `prisma/schema.prisma` datasource | ✅ | ❌ |
| `AUTH_SECRET` | NextAuth JWT signing (HS256) | `src/proxy.ts`, auth routes | ✅ | ❌ |
| `NODE_ENV` | Runtime mode; gates analytics injection & prisma log level | `src/lib/db.ts`, analytics | ✅ | ❌ |
| `APP_URL` / `APP_ENV` | Public base URL, environment gate | app config | ✅ | ❌ |
| `PORT` / `HOSTNAME` | Hostinger-supplied; **do not hardcode** | server | ✅ | ❌ |

> `src/lib/db.ts` throws at import time if `DATABASE_URL` is missing when
> `ALO_DB_DRIVER=sqlite`; otherwise the app constructs `PrismaClient` but the generated
> client is absent (see Repair Log R5), so startup fails with
> `@prisma/client did not initialize yet`.

## 3. Security-sensitive (fail-closed if absent in production)

| Variable | Purpose | Failure mode if absent |
|---|---|---|
| `CLAMD_HOST` / `CLAMD_PORT` | Malware scanning of inbound student documents (`src/lib/documents/malware-scan.ts`) | **REQUIRED in production** — unreachable scanner **rejects** the upload rather than storing an unscanned document. Dev falls back to the built-in signature layer. |
| WhatsApp Meta tokens (`WHATSAPP_*`, `META_*`) | Official WhatsApp send/receive | WhatsApp features disabled |
| Cron secrets (`ALO_CRON_SECRET`, etc.) | Authenticated cron endpoints | Cron jobs rejected |

## 4. AI layer (opt-in, cost-gated)

- Cloud AI inference is **disabled by default**. A key alone never authorizes a call.
- `PAID_AI_API_ALLOWED=true` is required before any cloud provider call, and only after
  owner approval of provider/model/billing/limits. Free-tier notes are **unverified**.
- Optional catalogued providers: `AI21_API_KEY`, `CEREBRAS_API_KEY`, `ANTHROPIC_*`,
  `OPENAI_*`, `GEMINI_*`, etc. (see `src/lib/ai-providers/catalog.ts`).
- Model overrides follow `ALO_AI_<SLUG>_MODEL`.
- `ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS` permits third-party proxies — **blocked by default**.

## 5. Integrations (optional unless the feature is used)

- **Social OAuth:** `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_*`, `LINKEDIN_*`, `YOUTUBE_*`,
  `TIKTOK_*`, `TWITTER_*`, `TELEGRAM_*`, `PINTEREST_*`.
- **Google SEO/Analytics:** `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `GTM_CONTAINER_ID`
  (GTM becomes the only tag loader when set). Analytics injected in **production only**
  unless `ANALYTICS_ALLOW_NON_PRODUCTION=true`.
- **Email transport:** the live transport is the `SMTP_*` block; `MAIL_*/IMAP_*/POP3_*`
  are **not read** by application code.

## 6. Configuration status summary

| Check | Result |
|---|---|
| All vars documented in a template | ✅ Yes (242) |
| Actual `.env` present | ❌ No |
| Secrets exposed in Git | ❌ No `.env` tracked (only `.example` files) |
| App can start without config | ❌ No |
| Fail-closed behavior documented | ✅ Yes (malware scan, AI cost gate) |

## 7. Safe setup

1. Copy `.env.example` → `.env` (never commit the result; `.env` is gitignored).
2. Fill `DATABASE_URL`, `AUTH_SECRET`, `NODE_ENV`, `APP_URL`, `PORT`.
3. Set WhatsApp/cron/malware-scan variables per the deployment target.
4. Leave cloud AI keys empty unless `PAID_AI_API_ALLOWED` is authorized.
5. Run `prisma generate` (requires engine download) and `prisma migrate deploy`.

> **Never** rotate production secrets during an audit without an approved rotation plan.
