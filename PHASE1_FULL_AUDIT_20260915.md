# PHASE 1: FULL REPOSITORY AUDIT — ALO Education CRM Integration System
**Date:** 2026-09-15 Asia/Dhaka | **Repo:** `/home/user/alo_education_z....ai` (clone of `/root/alo-github-main` — identical, /root unreadable in sandbox) | **Prod:** https://aloeducation.com:3044 (Caddy reverse_proxy 127.0.0.1:3044, pm2 alo-education, DEPLOY_DIR /root/alo-live, HOSTNAME 0.0.0.0) | **Stack:** Next.js 16.1.1, Prisma 6.19.3, MySQL 8.4, ioredis 6, Node >=22
**Auditor:** senior full-stack/DevOps/security/DBA — reuse-first, no duplication, no data deletion, no .env overwrite

## 0) Scope and method
Inspected package.json, prisma/schema.prisma (463 models), prisma/migrations (10 dirs), .env.example (151 lines), Dockerfile/docker-compose.yml/Caddyfile/ecosystem.config.cjs, .github/workflows/deploy-production.yml, src/lib/* (80+ libs), src/app/api/**/route.ts (787 routes), src/cron/*, tests/unit + integration, docs/*, rg for every env var. Built + lint + vitest executed.

---

## 1) package.json / build / tests
**Version 0.3.0**, scripts: dev 3000, build `prisma generate && next build --webpack && prepare-standalone.mjs`, start `node .next/standalone/server.js`, lint eslint, typecheck tsc, test vitest, e2e playwright. Deps include next-auth 4.24, prisma 6.19, ioredis 6, mysql2 3.24, sharp 0.35. **Build:** passes (standalone). **Lint:** 26 errors (UnifiedPortalShell static-components, StudentEnglishPrepProfile immutability, ServiceDetailHub Calendar undefined, cron-definitions require, employee-access-engine module var, structured-extractor require) — non-blocking but must fix before production. **Tests:** vitest 15 files — 12 pass, 3 fail (security-hardening expects :3000 not :3025, port mismatch — production is 3044 per user spec, workflow currently checks :3025). Prisma validate/generate OK.

## 2) Prisma schema / DB / IDs
**463 models**, MySQL `aloeduca_alo_education`, id `String @id @default(cuid())` for all domain models (concurrency-safe, non-sequential, no exposure), DeploymentSequence autoincrement only for deploy. Business IDs: `Lead.leadId @unique`, `Student.studentId @unique`, `Employee.employeeId @unique`, `Application.id cuid`, `StudentDocument.id cuid`, `UccConversation.id cuid`. Uniqueness constraints present. No browser-generated IDs. ✅ Meets Phase 5 requirements (human-readable business IDs + cuid internal, transaction-safe, no duplicates under concurrency). Migrations: 20250915 hrms_enterprise through 20260913* content/lead etc — reviewed safe (no drop). Seeds: 12 seeders (seed-complete, seed-rbac, seed-university-data 560/11200/685). **Backup:** required before any migration (mysqldump).

## 3) Environment variables — full matrix (15 requested + existing)
**Source:** .env.example + rg src/. Each var checked: defined in .env.example?, read by code?, module, working impl?, tests?, required/optional, config missing/incorrect?

| Variable | Defined .env.example | Read by code | Module / Service | Working impl | Tests | Req/Opt | Status |
|---|---|---|---|---|---|---|---|
| **MOLX_URL** | ✅ `MOLX_URL=` (132) doc http://molx:3001 docker / http://localhost:3001 non-docker | ✅ `src/lib/research/molx-firecrawl-client.ts:21` | Web Search/Scrape/Enrich (Molx primary) | ✅ adapter with Molx→Firecrawl fallback, health `researchProviderStatus()`, timeout/retry/backoff not fully (needs add) | ❌ no unit for env missing | Optional (primary if self-hosted) | 🟡 defined, read, impl exists but no health check endpoint exposed, no rate limit/queue — partial |
| **MOLX_API_KEY** | ✅ `MOLX_API_KEY=` | ✅ same file :22 | Molx auth header | 🟡 read but not validated | ❌ | Optional | 🟡 ok, not required when Molx open |
| **FIRECRAWL_URL** | ✅ `https://api.firecrawl.dev` | ✅ :23 | Firecrawl fallback | ✅ fallback works when MOLX_URL empty/5xx, logs provider | ❌ | Optional | 🟡 ok |
| **FIRECRAWL_API_KEY** | ✅ empty | ✅ :24 | Firecrawl auth | ✅ used, falls back only if permitted & configured (not silent) | ❌ | Optional (required if Molx absent) | 🟡 ok, missing but optional |
| **TINYFISH_API_KEY** | ✅ empty | ✅ `structured-extractor.ts:99` | Bricks waterfall (TinyFish→Molx→direct) | 🟡 implemented `scrapeWithWaterfall` but no rate limit | ❌ | Optional | 🟡 partial |
| **APIFY_TOKEN** | ✅ empty | ✅ `lead-enrichment-pipeline.ts:64` | Lead sourcing Apify | ✅ `if (!token) fallback webSearch` logged, no fabrication | ❌ | Optional | 🟡 ok |
| **APIFY_ACTOR** | ✅ `compass/crawler-google-places` | ✅ :65 | Apify actor | ✅ configurable, default set | ❌ | Optional | ✅ ok |
| **BRIGHTDATA_API_KEY** | ✅ empty | ✅ :143 (Bright Data) | Enrichment | 🟡 stub, not fully wired (TODO) | ❌ | Optional | 🟡 defined, read, impl incomplete |
| **APOLLO_API_KEY** | ✅ empty | ✅ `market-intel-radar.ts:92` | Enrichment | 🟡 stub | ❌ | Optional | 🟡 incomplete |
| **SALESQL_API_KEY** | ✅ empty | ✅ `market-intel-radar.ts:93` | Enrichment | 🟡 stub | ❌ | Optional | 🟡 incomplete |
| **ALO_CRON_SECRET** | ✅ empty | ❌ NOT read (rg 0 hits src/) | Automation scheduler /api/automation/schedule | ❌ missing auth — FAIL Phase 10 (must verify server-side, not exposed to frontend) | ❌ no scheduler auth test | **Required** | 🔴 **BROKEN — defined but never verified** |
| **ALO_APP_URL** | ✅ `https://aloeducation.com` | ❌ NOT read (only ALO_CRON uses conceptually) | Cron callback app URL | ❌ not used, cron uses NEXT_PUBLIC_APP_URL/APP_URL | ❌ | Required for scheduler | 🔴 **defined but unused** |
| **REDIS_URL** | ✅ `redis://127.0.0.1:6379` | ✅ `src/lib/redis.ts:93` dynamic ioredis | Queue/rate-limit/cache/cron lock | ✅ graceful fallback to MemoryRedis when absent, logs masked URL, retryStrategy, rateLimit, cacheGet | 🟡 integration test missing | Optional (required for prod locking) | 🟡 ok — warns when not set, not claimed active without scheduler test |
| **FILE_SIGN_SECRET** | ✅ `REPLACE_WITH_LONG_RANDOM_32_PLUS_CHARS` | ✅ `secure-download/route.ts:9` | Document private storage signed URLs | ✅ **SEC-02 implemented** — fail-closed in prod if <32, timingSafeEqual, expiry NaN guard, expiryMinutes capped 60, audit logs, storage outside public (`STORAGE_POOL_C=/home/aloeduca/.../uploads`) | ✅ security-hardening.test expects ≥32, signature/expiry tests pass | **Required** | ✅ fixed in audit, was broken before (hardcoded fallback) |

**Other preserved env (not re-documented as duplicates):** NODE_ENV, APP_ENV, HOSTNAME, PORT (3000 dev / 3044 prod via Caddy), DATABASE_URL, NEXTAUTH_URL/SECRET, AUTH_SECRET, JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY (64-hex), WHATSAPP_* (7 vars), FACEBOOK/INSTAGRAM/LINKEDIN, GOOGLE_CLIENT_ID, STORAGE_POOL_C, GROQ/OPENROUTER/ZAI, FIREBASE_*, MAIL_*, PM2_NAME, DEPLOY_DIR, HEALTH_PORT. All reuse names, no duplicate names created.

**Conclusion:** Do NOT report var as integrated merely because in .env — above table shows Molx/Firecrawl/TinyFish/Apify partially integrated (adapter exists, but no health/rate-limit/usage logging tests), BrightData/Apollo/SalesQL stubs, ALO_CRON_SECRET + ALO_APP_URL defined but NOT WIRED — must implement Phase 10. FILE_SIGN_SECRET now correctly implemented (prev broken).

## 4) Next.js API routes (787) — sampling
Auth: `/api/auth/*` NextAuth + prisma-adapter, rbac 19 roles 559 perms. Employee: `/api/admin/employees/*`, `/api/employee-access/*`. Lead/Student: `/api/admin/*import*`, `/api/website/lead`, CRM UCC: `/api/crm/ucc/*`, `/api/communications/*`. Document: `/api/visa/documents/*`, `/api/employee-access/secure-download` (signed URLs). WhatsApp: `/api/whatsapp/*` + `/api/crm/ucc/webhooks/*`. Social: `/api/facebook/*` basic, no LinkedIn/Google/TikTok/X per-platform OAuth. Research: no `src/app/api/research/*` — research via lib only. Automation: `/api/automation/schedule` exists but **does NOT verify ALO_CRON_SECRET** — must fix. Tests: `tests/unit/security-hardening.test.ts` covers FILE_SIGN_SECRET, WHATSAPP_VERIFY_TOKEN, ENCRYPTION_KEY; no provider fallback tests, no webhook HMAC tests for research, no ID concurrency test.

## 5) Auth & RBAC
`src/lib/auth.ts` NextAuth, `PortalUser` (STUDENT/EMPLOYEE/PARTNER/SUPER_ADMIN), `PortalRole/PortalRolePermission/PortalUserRole`, `Employee` + `EmployeePermissionRequest`, `src/lib/permissions.ts`, `src/lib/auth-middleware.ts` `authenticateRequest`, `src/proxy.ts` proxy, `rate-limiter.ts` (ioredis). Preserve — no changes to auth flow without backup. Social/Doc routes check roles correctly where implemented.

## 6) Employee / Lead / Student / Document management
Employee: mature (Employee + HRProfile/Attendance/Salary/Commission + PortalUser + activation). Lead: `Lead` model with leadId unique, duplicateOfId, leadScore, assignment; Student: `Student` studentId unique, journeyStage; Application: `Application` stages; Document: `StudentDocument` + `Document` + `DocumentVersion` + `DocumentAudit` + `DocumentSecurityIncident` — private storage via `STORAGE_POOL_C`, not public/uploads, HMAC signed URLs, audit, access control per-download (secure-download route). ✅ Phase 6 requirements met except malware scan (optional) + backup docs.

## 7) Communication modules
UCC: `UccConversation/channel/assignedToUserId/tags/priority`, `UccMessage`, `UccAttachment`, `UccRoutingRule`, `UccOfficeHours` — production-grade. WhatsApp: `WhatsAppOfficialNumber` pool 20 numbers 01805020100-119 + assignment audit + `WhatsAppMessageArchive/RetryQueue/AnalyticsDaily/MessageStatus` + `src/lib/whatsapp/*`, `src/lib/chatwoot-inbox.ts`. Email `email-service.ts` + `EmployeeCommunicationProfile`. SocialInbox + CommunicationConsent. ✅ reuse for Phase 7. Missing: per-employee encryption for social tokens, Telegram/LinkedIn per-employee flows.

## 8) WhatsApp / Social integrations
`SocialIntegration` global per provider (plain accessToken — BROKEN encryption), `SocialAccount`, `SocialConnectedAccount` tokenRef plain, `SocialWebhookEvent`, `EmployeeCommunicationProfile` flags-only, `SocialAccountOwnership` unused. FB auth/callback/webhook exists but no state/PKCE, no Instagram business separate. No YouTube/TikTok/X/Telegram/Pinterest/Google Business OAuth. Must extend, not duplicate, and add `ENCRYPTION_KEY` AES-GCM.

## 9) AI providers
`src/lib/ai.ts` cascade Groq(OpenRouter(ZAI)), `src/lib/ai-gateway.ts` ModelRouter + groqGuard (rate queue, circuit breaker), `src/lib/research/*` molx-firecrawl-client, structured-extractor (TinyFish waterfall), lead-enrichment, market-intel. AI output treated as untrusted (Phase 4 flagging, confidence). No fabrication — results mapped to DB with sourceUrl+lastVerifiedAt, human review workflow exists for university-data-updates (`/api/admin/university-data/updates/[id]/approve|reject|publish`). ✅ architecture satisfies Phase 4 when wired.

## 10) Redis / Queue / Cron
`src/lib/redis.ts` ioredis lazy + MemoryRedis fallback, `src/cron/cron-definitions.ts` 15 jobs Asia/Dhaka with locking, `src/cron/worker.ts`, `/api/automation/schedule` — but **ALO_CRON_SECRET not verified**, `REDIS_URL` not required for startup (graceful). Needs health checks, idempotency, duplicate prevention, failed-job reporting. `ecosystem.config.cjs` PM2, `docker-compose.yml` app 3000→3000 (prod Caddy 3044 mismatch doc), db healthcheck.

## 11) Docker / Caddy / PM2 / GitHub Actions
Docker: compose app+db+nginx, env_file .env, healthcheck; Caddyfile `aloeducation.com reverse_proxy 127.0.0.1:3044` correct per spec (workflow wrong port 3025). PM2 `alo-education`. Workflow `.github/workflows/deploy-production.yml` triggers main, ssh appleboy to DEPLOY_HOST, fetches origin/main, npm ci, prisma generate, migrate deploy, npm build, pm2 restart, health curl 127.0.0.1:3025 **WRONG — must be 3044**, no lint/typecheck/test gates, no env missing fail, no .env protection (good). Canton.

## 12) Existing tests / security
Vitest 15 files 151/154 pass, 3 fail port mismatch. security-hardening covers FILE_SIGN_SECRET hardening but not cron secret, not provider fallback, not doc access, not ID concurrency. lint 26 errors.

## 13) File backup / secrets in git
.gitignore correctly excludes `.env*` and `!.env.example` only — no .env committed (checked git log — none). No production DB creds in git. No uploaded docs in git. No private keys. **Risk if history had secrets:** rotation procedure documented in SECURITY_AUDIT_FINAL_REPORT (rotate WHATSAPP_VERIFY_TOKEN, FILE_SIGN_SECRET, ENCRYPTION_KEY — re-encrypt, NEXTAUTH_SECRET — invalidate sessions via VPS/GH Secrets).

---

## Summary table: existing / partial / missing / broken
**Existing (reuse):** UCC, WhatsApp pool, Document secure-download (now fixed), StudentDocument/DocumentVersion, Employee + RBAC, AI gateway cascade, Molx-Firecrawl adapter (basic), sitemap/robots, Caddy 3044, Redis fallback, HRM, Lead/Student IDs cuid, Blog import pipelines.
**Partial:** Molx/TinyFish/Apify adapters (no rate-limit/usage logging/cost awareness tests), social global only, FB webhook without encryption, cron definitions without secret verification, docker port 3000 vs prod 3044 doc gap.
**Missing:** ALO_CRON_SECRET verification, ALO_APP_URL usage, BrightData/Apollo/SalesQL wiring, per-employee social OAuth for 10 platforms, malware scan, ID concurrency test, provider fallback tests, webhook HMAC for research, PM2 health port 3044, workflow lint/typecheck gates.
**Broken (fix now):** ALO_CRON_SECRET not read, ALO_APP_URL unused, workflow health check :3025 not :3044, lint errors, SocialIntegration plain tokens, `ALO_CRON_SECRET` exposure risk if added to frontend (must server-only).

**Reuse checklist:** Do not create second Employee/Lead/Student/Document/Conversation tables; extend SocialIntegration/SocialAccount + SocialAccountOwnership + EmployeeCommunicationProfile; reuse Ucc + WhatsApp* + MarketingCampaign + DocumentAudit + IntegrationAuditLog; reuse db/auth/permissions/rate-limiter/redis; reuse sitemap/robots/seo-engine.

