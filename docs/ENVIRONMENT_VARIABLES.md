# Environment Variables — ALO Education CRM

**Source of truth:** `.env.example` (and `.env.production.example` for VPS). Never commit `.env`, `.env.production`, `.env.local`. Secrets only in VPS `/root/alo-live/.env` and GitHub Actions Secrets (DEPLOY_*). **Port:** production `3044` (Caddy `reverse_proxy 127.0.0.1:3044`, `HEALTH_PORT=3044`, `PORT=3044`). Dev may run `3000` via override but prod MUST be `3044`.

> For each variable: purpose, required/optional, which module reads it, where to obtain, secret?, restart required? Do NOT report integrated merely because in .env — see audit column.

## Legend
- **Required:** app fails closed or feature disabled without it (prod needs random 32+ chars).
- **Optional:** feature gracefully degrades (fallback logged, no fabrication).
- **Secret:** never log, never commit, never expose to frontend, rotate via VPS/GH Secrets.
- **Restart:** `pm2 restart alo-education --update-env` (+ Caddy reload if PORT/HOSTNAME changes).

---

## Core App
| Variable | Purpose | Req/Opt | Module reads | Where to obtain | Secret | Restart | Notes |
|---|---|---|---|---|---|---|---|
| NODE_ENV | node env | Required | Next | `production` | no | yes | |
| APP_ENV | app env | Required | config | `production` | no | yes | |
| HOSTNAME | bind | Required | server | `0.0.0.0` | no | yes | |
| PORT | app port | Required | Next/server | **3044 prod** (Caddyfile + docker-compose + ecosystem) | no | yes | spec 3044; dev 3000 override only locally |
| APP_URL / NEXT_PUBLIC_APP_URL / NEXTAUTH_URL | canonical URL | Required | auth, sitemap, robots, cron | `https://aloeducation.com` | no | yes | must be https prod |
| DATABASE_URL | Prisma MySQL | Required | `src/lib/db.ts` Prisma | cPanel MySQL user `aloeduca_ALO_final_web_crm` | **yes** | yes | URL-encode password |
| DB_* | legacy DB vars | Optional | config compat | same as DATABASE_URL | yes | yes | keep sync with DATABASE_URL |
| MYSQL_* | docker compose | Required (docker) | compose | random long | yes | yes (compose) | must match DATABASE_URL |

## Auth & Security
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| NEXTAUTH_SECRET / AUTH_SECRET / JWT_SECRET / SESSION_SECRET | NextAuth signing | Required | `src/lib/auth.ts` | `openssl rand -hex 32` | **yes** | yes (invalidates sessions) |
| ENCRYPTION_KEY | AES-256-GCM for tokens | Required | `src/lib/token-encryption.ts` | `openssl rand -hex 32` (=64 hex) | **yes** | yes (re-encrypt needed on rotate) |
| FILE_SIGN_SECRET | HMAC signed URLs for private docs | Required | `src/app/api/employee-access/secure-download` | `openssl rand -base64 48` >=32 chars | **yes** | yes (old URLs expire) |
| SEED_SUPER_ADMIN_* | initial seed | Optional prod | `prisma/seed-complete.ts` | one-time | yes | no (seed only) |

## AI
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| GROQ_API_KEY | Groq LLM | Optional | `src/lib/ai.ts`, `ai-gateway` | groq console | yes | yes |
| OPENROUTER_API_KEY | fallback | Optional | same | openrouter.ai | yes | yes |
| ZAI_API_KEY | GLM | Optional | same | Z.ai | yes | yes |
| AI_DEFAULT_MODEL etc | model ids | Optional | ai-gateway | `glm-4-flash` etc | no | yes |

## Storage
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| STORAGE_POOL_C | private uploads path | Required | document upload | `/home/aloeduca/alo-education/storage/uploads` (not public) | no | yes |
| GOOGLE_CLIENT_ID / SECRET | OAuth (Youtube, Search Console, Business Profile) | Optional | `doodle-note`, google seo | Google Cloud Console OAuth2 | yes | yes |

## Mail
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| MAIL_*, IMAP_*, POP3_* | email | Required for comm | `email-service.ts` | cPanel mail | yes | yes |

## WhatsApp (Meta Cloud)
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| WHATSAPP_TOKEN / ACCESS_TOKEN | Graph API | Required for WA | `src/lib/whatsapp`, `api/whatsapp/send` | Meta developers | yes | yes |
| WHATSAPP_PHONE_NUMBER_ID / BUSINESS_ACCOUNT_ID | WA IDs | Required | same | Meta | no | yes |
| WHATSAPP_APP_SECRET / VERIFY_TOKEN | webhook sig | Required | `api/crm/ucc/webhooks/whatsapp`, `api/whatsapp/webhook` | Meta | yes | yes |

## Social OAuth (Admin + Employee)
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| FACEBOOK_APP_ID/SECRET | FB Pages | Optional | `api/facebook/*` + `SocialIntegration` | developers.facebook.com | yes | yes |
| INSTAGRAM_APP_ID/SECRET | IG Business | Optional | same | same | yes | yes |
| LINKEDIN_CLIENT_ID/SECRET | LinkedIn Pages | Optional | future `api/integrations/linkedin` | LinkedIn dev | yes | yes |
| YOUTUBE_CLIENT_ID/SECRET (or GOOGLE_*) | YouTube channel | Optional | `api/integrations/youtube` | Google Cloud OAuth (youtube scope) | yes | yes |
| TIKTOK_CLIENT_KEY/SECRET | TikTok Business | Optional | `api/integrations/tiktok` | TikTok for Business | yes | yes |
| X_CLIENT_ID/SECRET / X_BEARER_TOKEN | X API | Optional | `api/integrations/x` | developer.x.com | yes | yes |
| TELEGRAM_BOT_TOKEN | Telegram bot | Optional | `api/integrations/telegram` | @BotFather | yes | yes |
| PINTEREST_APP_ID/SECRET | Pinterest | Optional | `api/integrations/pinterest` | pinterest dev | yes | yes |
| GOOGLE_BUSINESS_ACCOUNT_ID | Business Profile | Optional | `api/integrations/google-business` | Business Profile API | no | yes |

## SEO / Analytics
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| GA4_MEASUREMENT_ID | GA4 | Optional | `src/lib/seo-engine.ts`, analytics | GA4 admin stream | no | yes |
| GA4_API_SECRET | Measurement Protocol | Optional | same | GA4 admin | yes | yes |
| GOOGLE_SEARCH_CONSOLE_SITE_URL | GSC | Optional | `src/lib/seo` + api | `https://aloeducation.com` verified in GSC | no | yes |
| GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON | GSC API | Optional | same | Service account JSON (base64) | yes | yes |
| NEXT_PUBLIC_GA4_ENABLED / NEXT_PUBLIC_CONSENT_MODE | frontend consent | Optional | layout/analytics | `true/false` | no | yes (rebuild) |

## Web Search -> Scrape -> Extract -> AI -> CRM (15 vars audited)
| Variable | Purpose | Req/Opt | Module reads | Where | Secret | Restart | Audit |
|---|---|---|---|---|---|---|---|
| MOLX_URL | Molx self-hosted base | Optional (primary when self-hosted) | `src/lib/research/molx-firecrawl-client.ts` | `http://molx:3001` docker or `http://localhost:3001`/VPS IP non-docker | no | yes | defined, read, adapter exists Molx->Firecrawl, needs timeout/queue |
| MOLX_API_KEY | Molx auth | Optional | same | Molx config | yes | yes | optional if open |
| FIRECRAWL_URL | Firecrawl base | Optional | same | `https://api.firecrawl.dev` | no | yes | default correct |
| FIRECRAWL_API_KEY | Firecrawl auth | Optional (required if no Molx) | same | firecrawl.dev | yes | yes | fallback only when permitted+configured, not silent |
| TINYFISH_API_KEY | Bricks waterfall provider | Optional | `structured-extractor.ts` | tinyfish.ai | yes | yes | partial (waterfall exists, no rate limit) |
| APIFY_TOKEN | Apify auth | Optional | `lead-enrichment-pipeline.ts` | apify.com console | yes | yes | falls back to webSearch if empty, logged — no fabrication |
| APIFY_ACTOR | Apify actor name | Optional | same | `compass/crawler-google-places` or custom | no | yes | configurable |
| BRIGHTDATA_API_KEY | Bright Data enrich | Optional | same | brightdata.com | yes | yes | stub — not fully wired |
| APOLLO_API_KEY | Apollo enrich | Optional | `market-intel-radar.ts` | apollo.io | yes | yes | stub |
| SALESQL_API_KEY | SalesQL enrich | Optional | same | salesql.com | yes | yes | stub |
| ALO_CRON_SECRET | scheduler auth | **Required** | `src/app/api/automation/schedule` (NEEDS FIX — currently NOT read) | `openssl rand -hex 32` on VPS .env only | **yes** | yes | defined but not verified server-side — fix Phase 10 |
| ALO_APP_URL | cron callback base | **Required** | same (currently NOT read — uses APP_URL) | `https://aloeducation.com` | no | yes | defined but unused — wire in Phase 10 |
| REDIS_URL | queue/cache/cron lock | Optional (required prod) | `src/lib/redis.ts` ioredis | `redis://127.0.0.1:6379` or hosted | yes if auth | yes | fallback MemoryRedis, never claim active without scheduler test |
| FILE_SIGN_SECRET | signed doc URLs | Required | `secure-download` | `openssl rand -base64 48` >=32 | yes | yes | SEC-02 fail-closed, timingSafeEqual, audit — fixed |

**Notes on 15:** never expose ALO_CRON_SECRET or FILE_SIGN_SECRET to frontend; verify ALO_CRON_SECRET server-side on every scheduler request; MOLX_URL must be reachable from app container (compose hostname `molx`), not assumed localhost in docker; log provider switches; respect robots/privacy.

## Deployment
| Variable | Purpose | Req/Opt | Module | Where | Secret | Restart |
|---|---|---|---|---|---|---|
| DEPLOY_DIR | VPS path | Required deploy | GH Action | `/root/alo-live` (actual prod path per workflow) | no | yes |
| PM2_NAME | pm2 id | Required | ecosystem | `alo-education` | no | yes |
| HEALTH_PORT | health check port | Required | workflow/cron | `3044` (must equal PORT) | no | yes |
| DEPLOY_HOST etc | GH Secrets | Required deploy | `appleboy/ssh-action` | GH repo Settings->Secrets | **yes** | — (CI only) |

## How to verify
- `rg -n "process.env.MOLX_URL" src/` — must hit `molx-firecrawl-client.ts` (we do).
- `rg -n "process.env.ALO_CRON_SECRET" src/` — currently 0 — fix required.
- `npx prisma validate && npx prisma generate && npm run typecheck && npm run lint && npm test` (see `tests/unit/security-hardening.test.ts` for FILE_SIGN_SECRET/ENCRYPTION_KEY enforcement).
- Never run `prisma migrate reset` on prod; only `migrate deploy`. Backup with `mysqldump`.

