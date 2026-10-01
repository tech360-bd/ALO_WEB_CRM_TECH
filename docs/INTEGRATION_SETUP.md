> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# Integration Setup — ALO Education CRM

**Single connected CRM:** Web Search → Scrape → Extract → AI → Lead Validation → CRM Database → Employee Assignment → Communication & Follow-up. Production port 3044, Asia/Dhaka, MySQL Prisma, Redis locking.

## 1) Web Search → Scrape (Phase 3)

**Primary:** Molx self-hosted (MIT, free) — Docker hostname `http://molx:3001` (not localhost in compose), non-Docker `http://localhost:3001` or VPS IP. **Fallback:** Firecrawl `https://api.firecrawl.dev` when `MOLX_URL` empty/5xx + `FIRECRAWL_API_KEY` set. Logged never silent.

Env:
```
MOLX_URL=http://molx:3001
MOLX_API_KEY= # optional if open
FIRECRAWL_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY= # required if no Molx
TINYFISH_API_KEY= # optional waterfall
APIFY_TOKEN= # optional, fallback webSearch if empty
APIFY_ACTOR=compass/crawler-google-places
BRIGHTDATA_API_KEY= APOLLO_API_KEY= SALESQL_API_KEY= # optional enrichment stubs
```

Architecture: `src/lib/research/molx-firecrawl-client.ts` unified adapter — timeout 15s, retry 3× exponential backoff, Redis rate limit (60/min molx, 30/min firecrawl), ProviderErrorLog cost/quota aware, SSRF blocklist `169.254.169.254` + `10/192.168/172.16-31/127`, safe truncate 200k markdown, sourceUrl + retrievedAt provenance. Health: `GET /api/research/provider-status`.

Do not scrape private accounts, respect robots, terms, privacy. Fabricate nothing.

## 2) AI → Lead Validation (Phase 4)

`src/lib/ai.ts` Groq→OpenRouter→ZAI → `src/lib/ai-gateway.ts` (ModelRouter + groqGuard) → `src/lib/lead-validation.ts` (normalize phone/email/name, validate required, confidence 0-100, verified vs unverified, flag incomplete/conflicting, duplicate check via `duplicate-detector.ts`, route uncertain to manual review `/api/admin/university-data/updates/[id]/approve`). AI output treated as untrusted — `sanitizeAiOutput` strips control chars, flags injection, never auto-verify identity/academic/financial, record sourceUrl+retrievedAt.

## 3) CRM IDs (Phase 5)

Prisma `cuid()` for internal `id` (non-sequential, concurrency-safe, transaction-safe unique constraints). Business IDs: `Lead.leadId @unique`, `Student.studentId @unique`, `Employee.employeeId @unique`, `StudentDocument.id`, `UccConversation.id`. No browser IDs, no sequential exposure. Test concurrency: `Promise.all(Array(10).fill(0).map(()=> db.lead.create(...)))` — unique constraint guarantees no dup.

## 4) Document Management (Phase 6)

Private storage `STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` (outside `public/`), randomized names, metadata in DB (`StudentDocument`/`Document`/`DocumentVersion`/`DocumentAudit`/`DocumentSecurityIncident`), size/type validation (`file-validator.ts`), HMAC signed URLs `FILE_SIGN_SECRET` ≥32 (SEC-02 `timingSafeEqual`, NaN guard, capped 60m, audit), access control per download (`checkDocumentSharingAllowed`), malware scan hook where available. Never in `public/uploads`, never in GitHub.

## 5) Communication Center (Phase 7)

UCC: `UccConversation` (whatsapp/facebook/instagram/telegram/live_chat/email/sms) + `UccMessage`/`UccAttachment`/`UccRoutingRule`/`UccOfficeHours` + `EmployeeCommunicationProfile` + `CommunicationConsent` + `WhatsAppOfficialNumber` pool 20 numbers. Assignment `assignedToUserId`, channel, timestamps, delivery `WhatsAppMessageStatus`, webhook `POST /api/crm/ucc/webhooks/[provider]` + `POST /api/whatsapp/webhook` (verify `WHATSAPP_VERIFY_TOKEN` + HMAC `WHATSAPP_APP_SECRET`), retry `WhatsAppRetryQueue`, audit `aloAuditLog`, RBAC, human approval for sensitive AI messages.

## 6) Official vs Employee Social (Phase 8)

Admin: `src/app/admin/settings/digital-assets/page.tsx` — 10 platforms (FB Pages, IG Business, WA Business, LinkedIn Pages, YouTube, TikTok, X, Telegram, Pinterest, Google Business Profile) via official OAuth, encrypted `SocialIntegration.accessToken` (ENCRYPTION_KEY AES-256-GCM `src/lib/social/token-encryption.ts`), token expiry, webhook secret, health, `ProviderErrorLog`.

Employee: `src/app/employee/my-accounts/page.tsx` — own accounts connect via OAuth (`state`+PKCE), request official access → `ApprovalRequest`, disconnect revokes. Ownership `SocialAccountOwnership` + `EmployeeCommunicationProfile`, never store employee tokens in `.env`.

## 7) Google SEO (Phase 9)

`sitemap.ts` (560 unis + blogs/courses), `robots.ts` (disallow /api/crm/admin), canonical/structured data `src/lib/seo/schema-helpers.ts`, `src/lib/seo/ga4.ts` consent-aware GA4 (`GA4_MEASUREMENT_ID`+`GA4_API_SECRET`, `NEXT_PUBLIC_GA4_ENABLED`, `NEXT_PUBLIC_CONSENT_MODE`), Search Console OAuth `GOOGLE_CLIENT_ID/SECRET` + `GOOGLE_SEARCH_CONSOLE_SITE_URL`, Business Profile `GOOGLE_BUSINESS_ACCOUNT_ID` (separate integrations — do not conflate). Health: `GET /api/seo/health`.

## 8) Automation & Redis (Phase 10)

`REDIS_URL=redis://127.0.0.1:6379` (ioredis 6, fallback MemoryRedis never claim active without real scheduler). `src/cron/cron-definitions.ts` 15 jobs Asia/Dhaka locking, `src/cron/worker.ts` DB-based lock via `DeploymentSequence`/`cronLock`. Scheduler `POST /api/automation/schedule` verifies `ALO_CRON_SECRET` server-side (Bearer + timingSafeEqual, never frontend) + fallback session SUPER_ADMIN, `GET` health shows `cronSecretConfigured` boolean only. Job status/failed-report/idempotency/duplicate prevention via lock.

## 9) GitHub & Deployment (Phases 11-12)

Single workflow `.github/workflows/deploy-production.yml` `push main` → `/root/alo-live` (verify `git remote -v`): `npm ci` → `prisma generate` → `migrate deploy` (never reset) → `build` → `pm2 restart --update-env` → `ss :3044` → `curl 127.0.0.1:3044`. GH Secrets `DEPLOY_HOST/USER/SSH_KEY/PORT` (never log). Fail when required env missing. `HEALTH_PORT=3044` must equal `PORT`.

See `docs/ENVIRONMENT_VARIABLES.md`, `docs/PRODUCTION_SETUP.md`, `docs/WHATSAPP_SETUP.md`, `docs/SOCIAL_MEDIA_SETUP.md`, `docs/GOOGLE_SEO_SETUP.md`, `docs/DOCUMENT_SECURITY.md`.
