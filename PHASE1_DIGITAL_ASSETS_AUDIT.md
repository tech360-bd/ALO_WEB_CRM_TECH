# PHASE 1: Repository Audit — Digital Assets & Social Media Integration Center
**Project:** ALO Education CRM  
**Repo:** `/home/user/alo_education_z....ai` (accessible clone of `/root/alo-github-main` — permission denied on /root, verified identical)  
**Production:** https://aloeducation.com | **App Port:** 3044 (package.json dev 3000, prod `next start` via standalone `node .next/standalone/server.js`, Caddy/Nginx proxy, `HOSTNAME=0.0.0.0`, `HEALTH_PORT=3000`, `DEPLOY_DIR=/root/alo-live`)  
**Date:** 2026-09-15 | **Auditor:** Arena Agent (reuse-first)  
**Scope:** Digital Assets & Social Media Integration Center — 10 platforms, Admin + Employee, publishing, security

---

## 1) Project Structure (Next.js 16, Prisma 6, MySQL)

```
src/app: admin, api, super-admin, employee, marketing, blog, course, universities, crm, portal, app/* (Next App Router)
src/components: alo/views, ui (Radix)
src/lib: 80+ libs (auth, db, ai-agents, crm, marketing, communication, rbac, whatsapp, facebook-lead-sync, ghost-publishing)
src/cron: worker.ts, cron-definitions.ts (15 jobs, Asia/Dhaka, locking)
prisma: schema.prisma (463 models), migrations/*, seed-*.ts (12 seeders: seed-complete.ts, seed-rbac, seed-university-data, etc.)
scripts: expand_to_6_levels_and_branches.py, regen_dependent_simple.py, build-delivery-packages-portable.sh
public, public_html/.htaccess, Caddyfile, Dockerfile, docker-compose.yml
```

**Reuse strategy:** Keep App Router, reuse `src/lib/db.ts` (PrismaClient), `src/lib/auth.ts` (NextAuth), `src/lib/permissions.ts`, `components/ui/*`, `Caddyfile`, existing API patterns (`/api/crm/ucc/*`, `/api/communications/*`, `/api/whatsapp/*`).

---

## 2) Employee Management System — EXISTING, MATURE

**Prisma Models (core):**
- `Employee` (id, userId, employeeId, name, email, phone, branch, department, designation, role=counselor, status, destinationFocus, partnerGroups, offices M2M)
- `EmployeeHRProfile`, `EmployeeAttendance`, `EmployeeSalary`, `EmployeeCommission`, `EmployeeBonus`, `EmployeeIncrement`, `EmployeePerformance`, `EmployeeLeave`, `EmployeePayroll`, `EmployeeDevice`, `EmployeeLoginLog`, `EmployeeAgreement`, `EmployeeAuditLog`, `EmployeePermissionRequest`, `EmployeeReassignment`, `EmployeeSecurityEvent`
- `PortalUser` (id, email, passwordHash, name, userType=STUDENT/EMPLOYEE/PARTNER/SUPER_ADMIN, status, firstLoginRequired) + `PortalRole`, `PortalRolePermission`, `PortalUserRole`, `PortalSession`, `LoginAttempt`, `OtpCode`
- `EmployeeProfile` (PortalUser 1-1), `EmployeeActivationToken`, `EmployeeCommunicationProfile` (see §3), `EmployeeDepartment`, `EmployeeBranch`, `EmployeeOffice`
- `AiEmployee` (AI workforce), `EmployeeHR` (HR module)

**UI / API:**
- `src/app/employee/*`, `src/app/admin/*`, `src/app/super-admin/*`, `src/app/counselor/*`
- HRM: `src/lib/hrms/*`, attendance, payroll, agreements
- RBAC: `src/lib/permissions.ts` (12168B), `src/lib/access-control.ts`, `src/lib/rbac/*`, 19 roles (SUPER_ADMIN…STUDENT), 559 perms
- Auth: `src/lib/auth.ts` NextAuth + PrismaAdapter, `src/lib/auth-middleware.ts`, `src/lib/rate-limiter.ts`, `src/app/api/auth/*`, `src/app/login`, `src/app/forgot-password`

**Verdict:** ✅ **EXISTING — REUSE, DO NOT DUPLICATE.** Employee `employeeId` is canonical FK for `EmployeeSocialAccount` / `EmployeeCommunicationProfile`. All new social tables must reference `Employee.employeeId` / `PortalUser.id`, not create new employee table.

---

## 3) Existing Social Media & WhatsApp Integrations — PARTIAL, FRAGMENTED

**Prisma — Already Implemented:**

| Model | Purpose | Status |
|-------|---------|--------|
| `SocialIntegration` | Provider row (whatsapp, meta_business, facebook_page, instagram, google_analytics, google_search_console, youtube, telegram, smtp_email, sms_provider) + tokens, webhookSecret, apiVersion | ✅ **EXISTING** — single row per provider (global, not per-employee). Fields: `provider, name, status(connected/disconnected/expired/error), accessToken, refreshToken, tokenExpiresAt, webhookStatus, metadata JSON` — but `accessToken` stored **plain text**, no encryption → **BROKEN for §6** |
| `SocialAccount` | Asset per integration (Page ID, Phone Number ID, Channel ID) | ✅ **EXISTING** — `integrationId FK, provider, assetId, assetName, assetType, isPrimary` — currently global, no `employeeId` → **MISSING per-employee ownership** |
| `SocialConnectedAccount` | Simple connected account (platform, accountName, accountId, avatar, status, tokenRef) | 🟡 **PARTIAL** — minimal, no provider verification, no encryption |
| `SocialWebhookEvent` | Generic webhook log | ✅ **EXISTING** but minimal |
| `SocialInbox`, `SocialInboxMessage`, `MarketingSocialMessage`, `MarketingDMThread`, `MarketingComment` | Marketing inbox | ✅ **EXISTING** — product-specific, not UCC |
| `UccConversation`, `UccMessage`, `UccAttachment`, `UccRoutingRule`, `UccOfficeHours`, `UccWebhookEvent` | Unified Communication Center (UCC) — omnichannel | ✅ **EXISTING, PRODUCTION-GRADE** — supports `channel=whatsapp|facebook|instagram|telegram|live_chat|email|sms`, assignment `assignedToUserId/assignedRole`, routing rules, office hours |
| `EmployeeCommunicationProfile` | Per-employee channel flags | ✅ **EXISTING** — `employeeId unique, whatsappAccess, whatsappNumberId, facebookAccess, instagramAccess, emailAccess, assignedPages JSON, channelPermissions JSON, workingHours` — **but boolean flags only, no OAuth tokens per employee** → **PARTIAL for Phase 3/4** |
| `WhatsAppOfficialNumber`, `WhatsAppNumberAssignmentAudit`, `WhatsAppContact`, `WhatsAppMessageArchive`, `WhatsAppFollowUpTemplate`, `WhatsAppRetryQueue`, `WhatsAppAnalyticsDaily`, `WhatsAppMessageStatus` | Official WhatsApp pool (20 numbers: 01805020100-...119) | ✅ **EXISTING, PRODUCTION-GRADE** — pool `ALO_MAIN_WHATSAPP_NUMBER` etc. from `.env.example`, assignment audit, retry queue |
| `SocialAccountOwnership` | Ownership mapping | 🟡 **PARTIAL** — `model SocialAccountOwnership { id, socialAccountId, employeeId, isPrimary, grantedAt }` — exists but not used in API |
| `IntegrationAuditLog`, `ProviderErrorLog`, `CommunicationConsent`, `ContentApproval` | Audit/error/consent | ✅ **EXISTING** |

**API Routes — Already Implemented (28 routes, partial reuse):**

- **UCC (reuse):** `POST /api/crm/ucc/oauth/start`, `GET /api/crm/ucc/oauth/callback`, `POST /api/crm/ucc/webhooks/[provider]`, `POST /api/crm/ucc/webhooks/whatsapp`, `GET /api/crm/ucc/integrations`, `GET/POST /api/crm/ucc/employee-profiles`, `POST /api/crm/ucc/employee-profiles/offboard`, `GET /api/crm/communications/social-inbox`, `POST /api/crm/communications/call-logs`
- **Communications (reuse):** `GET /api/communications/social-accounts`, `GET/DELETE /api/communications/social-accounts/[id]`, `GET /api/communications/webhooks/events`
- **WhatsApp (reuse):** `POST /api/whatsapp/send`, `GET /api/whatsapp/status`, `POST /api/whatsapp/webhook`, `GET /api/whatsapp/numbers`, `GET /api/whatsapp/contacts`, `GET /api/whatsapp/routing`, `POST /api/whatsapp/followup/*`, `POST /api/whatsapp/analytics`, `POST /api/whatsapp/ai-intent`, `POST /api/whatsapp/ai-reply`, `GET /api/whatsapp/sla`, `POST /api/crm/ucc/whatsapp/command`
- **Facebook/Instagram (reuse, but BROKEN):** `GET /api/facebook/auth`, `GET /api/facebook/callback`, `POST /api/facebook/webhook` — uses `FACEBOOK_APP_ID/SECRET` from `.env.example` but **no token encryption, no state validation visible, no `instagram_business` separate flow**
- **Marketing (reuse):** `POST /api/marketing/campaigns`, `POST /api/marketing/content`, `POST /api/marketing/video`, `GET /api/marketing/calendar`, `POST /api/marketing/webhooks`, `POST /api/marketing/webhooks/google-business`, `POST /api/partner/marketing`, `GET /api/social/reply`, `GET /api/unified-communication`
- **Integrations generic:** `GET /api/integrations/3cx/config`, `POST /api/integrations/3cx/webhooks`

**Verdict:** 🟡 **PARTIAL — FRAGMENTED DUPLICATION RISK.** UCC + WhatsApp pool are production-grade and must be reused. `SocialIntegration/SocialAccount` are global, not per-employee, and lack encryption. `EmployeeCommunicationProfile` is flags-only. No LinkedIn/YouTube/TikTok/X/Telegram/Pinterest/Google Business Profile OAuth. No `SocialPlatform/EmployeeSocialAccount/SocialAccountToken/SocialPublishingJob` per §6 proposal — but `SocialIntegration` + `SocialAccount` + `SocialAccountOwnership` can be **extended, not duplicated**.

---

## 4) Prisma Schema & Migrations

- **DB:** MySQL `aloeduca_alo_education` (`DATABASE_URL` mysql://...), `prisma/migrations/*` (12+ dirs), `prisma/schema.prisma` 463 models, `DATABASE_MODEL_INVENTORY.csv` 463, `DATABASE_MIGRATION_INVENTORY.csv`
- **Migrations verification:** `npx prisma validate` OK, `npx prisma generate` OK, `prisma/migrations/20250915...` HRMS enterprise, content management, CRM communication etc.
- **Seeds:** 12 seeders, `seed-complete.ts` (Super Admin + PortalRole), `seed-university-data.ts` (560 unis, 11200 courses, 685 campuses — we expanded 6 levels + 125 branches)
- **Proposed §6 models vs existing:** `SocialPlatform` → reuse `SocialIntegration` (add `platform` enum + `provider`); `SocialAccount` → extend existing (add `employeeId`, `connectedStatus`, `lastSyncAt`, `tokenExpiresAt`, `grantedPermissions`, `capabilities`); `EmployeeSocialAccount` → **merge into `EmployeeCommunicationProfile` + `SocialAccountOwnership`**, do NOT create duplicate `EmployeeSocialAccount` — extend ownership table; `SocialAccountToken` → **add encryption to `SocialIntegration.accessToken/refreshToken` + new `SocialAccountToken` only if per-account tokens needed (per-employee OAuth requires per-account, so create but encrypt)**; `SocialPublishingJob` → reuse `MarketingCampaign`/`MarketingGeneratedContent`/`ContentApproval` + add `SocialPublishingJob` for cross-platform queue; `SocialWebhookEvent` → reuse `SocialWebhookEvent` + `UccWebhookEvent`; `SocialIntegrationAuditLog` → reuse `IntegrationAuditLog` + `AloAuditLog`

**Verdict:** ✅ **HEALTHY — EXTEND, DO NOT DUPLICATE.**

---

## 5) Authentication & Authorization

- **NextAuth:** `src/lib/auth.ts` (`@auth/prisma-adapter`), `PortalUser` + `PortalSession` + `LoginAttempt` + `OtpCode`, `NEXTAUTH_SECRET/AUTH_SECRET/JWT_SECRET/SESSION_SECRET/ENCRYPTION_KEY` (32-byte hex), `FILE_SIGN_SECRET`
- **RBAC:** `src/lib/permissions.ts`, `PortalRole` (19 roles), `PortalRolePermission`, `PortalUserRole`, `EmployeePermissionRequest`, `EmployeeTemporaryPermission`, `EmployeePermissionPackageAssignment`, `access-control/*`, `central-security-engine.ts`
- **Middleware:** `src/proxy.ts` (Next proxy), `src/lib/auth-middleware.ts`, `src/lib/rate-limiter.ts` (ioredis), `src/lib/ai-safety.ts` (`isGlobalAiPaused`)
- **Employee ownership:** `EmployeeCommunicationProfile.employeeId unique`, `SocialAccountOwnership.employeeId`, `UccConversation.assignedToUserId`

**Verdict:** ✅ **EXISTING — REUSE.** New Admin page `/admin/settings/digital-assets` must check `SUPER_ADMIN | ADMIN`, Employee `My Accounts` must check `PortalUser.id == employeeId`, token decryption only server-side.

---

## 6) OAuth Callback & Webhook Routes — EXISTING, PARTIAL

| Route | Status | Notes |
|-------|--------|-------|
| `GET /api/crm/ucc/oauth/start` | ✅ exists | Meta OAuth start, state param |
| `GET /api/crm/ucc/oauth/callback` | ✅ exists | Callback, needs audit for CSRF `state` validation + PKCE |
| `GET /api/facebook/auth` + `GET /api/facebook/callback` + `POST /api/facebook/webhook` | 🟡 partial | Facebook-only, no Instagram/LinkedIn/YouTube/TikTok/X/Telegram/Pinterest/Google Business |
| `POST /api/crm/ucc/webhooks/[provider]` + `POST /api/crm/ucc/webhooks/whatsapp` + `POST /api/whatsapp/webhook` + `POST /api/communications/webhooks/events` | ✅ exists | UCC + WhatsApp, needs signature validation (`WHATSAPP_APP_SECRET`, `FACEBOOK_APP_SECRET`) — check `ProviderErrorLog` |
| Missing | ❌ | `GET /api/integrations/linkedin/callback`, `GET /api/integrations/google/callback`, `GET /api/integrations/tiktok/callback`, `POST /api/integrations/telegram/webhook`, `POST /api/integrations/youtube/webhook`, etc. — **MISSING for §2 10 platforms** |

**Verdict:** 🟡 **PARTIAL — EXTEND PATTERN.** Reuse `ucc/oauth/*` pattern, add per-platform handlers under `src/app/api/integrations/[platform]/callback`.

---

## 7) .env Variables & Configuration

**Existing (from `.env.example` 80+ vars, reuse names):**
- App: `NODE_ENV, APP_ENV, HOSTNAME, PORT=3000 (prod 3044 via DEPLOY_DIR/Caddy), APP_URL=https://aloeducation.com, NEXT_PUBLIC_APP_URL, TZ=Asia/Dhaka`
- DB: `MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, DATABASE_URL, DB_*`
- Auth: `NEXTAUTH_SECRET, AUTH_SECRET, JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY, FILE_SIGN_SECRET`
- AI: `GROQ_API_KEY, OPENROUTER_API_KEY, ZAI_API_KEY, AI_DEFAULT_MODEL`
- WhatsApp Meta: `WHATSAPP_TOKEN/WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN, WHATSAPP_BUSINESS_PHONE, WHATSAPP_GRAPH_VERSION=v18.0`
- Social OAuth: `FACEBOOK_APP_ID/SECRET, INSTAGRAM_APP_ID/SECRET, LINKEDIN_CLIENT_ID/SECRET` — **MISSING:** `GOOGLE_CLIENT_ID/SECRET, YOUTUBE_CLIENT_ID/SECRET, TIKTOK_CLIENT_KEY/SECRET, X_CLIENT_ID/SECRET, TELEGRAM_BOT_TOKEN, PINTEREST_APP_ID/SECRET, GOOGLE_BUSINESS_*`
- Pool: `ALO_MAIN_WHATSAPP_NUMBER=01805020100` … `ALO_EMPLOYEE_WHATSAPP_START/END=01805020102-119`
- Infra: `REDIS_URL, HEALTH_PORT, PM2_NAME=alo-education, DEPLOY_DIR=/root/alo-live, ALO_CRON_SECRET, MOLX_URL, FIRECRAWL_API_KEY, TINYFISH_API_KEY, APIFY_TOKEN`
- 3CX: `THREECX_API_URL/TOKEN`, `SMS_PROVIDER_API_KEY`

**Verdict:** 🟡 **PARTIAL — ADD MISSING, NEVER OVERWRITE PRODUCTION SECRETS.** Provide updated `.env.example` with new OAuth vars, document callback URLs, never store per-employee tokens in `.env`.

---

## 8) Already Implemented Integrations — SUMMARY

**✅ Existing (reuse):** UCC (omnichannel conversations, routing, office hours), WhatsApp pool (20 numbers, assignment audit, retry queue, analytics), SocialIntegration/SocialAccount (global), EmployeeCommunicationProfile (flags), Marketing Campaign/Content/Video/Calendar, Facebook auth/callback/webhook (basic), 3CX, SMS, Ghost/Nextcloud/Chatwoot (provider matrix)

**🟡 Partial (extend):** Per-employee WhatsApp OAuth (only flags), per-account token encryption, Instagram/LinkedIn separate flows, TikTok/X/Telegram/Pinterest/YouTube/Google Business not implemented, `SocialConnectedAccount` tokenRef plain, no `SocialPublishingJob` queue

**❌ Missing (build per Phases 2-5):** Admin Official Accounts page (10 platforms, verification, token expiry, capabilities, error logs), Employee My Accounts page (own accounts, OAuth, request official access, disconnect), Official shared WhatsApp inbox with assignment/ownership, Social Publishing integrated with Marketing Manager (drafts, approval, schedule, validation, retry, audit), `SocialAccountToken` encryption, CSRF/state, rate limiting per platform

**🔴 Broken (fix):** `SocialIntegration.accessToken` plain text → encrypt with `ENCRYPTION_KEY` (AES-256-GCM), `SocialConnectedAccount.tokenRef` plain, no `tokenExpiresAt` check, no webhook signature validation in some routes, `PORT` mismatch (package.json 3000 vs prod 3044 — document Caddy proxy), missing OAuth state validation in `facebook/callback`

---

## 9) Reuse Checklist (Do Not Duplicate)

- ✅ Reuse `Employee` + `PortalUser` + `EmployeeCommunicationProfile` + `SocialAccountOwnership` for ownership
- ✅ Extend `SocialIntegration` + `SocialAccount` (add `employeeId, connectedStatus, lastSyncAt, tokenExpiresAt, grantedPermissions, capabilities, errorLog`)
- ✅ Reuse `UccConversation/UccMessage/UccWebhookEvent` + `WhatsApp*` pool for WhatsApp (Phase 4)
- ✅ Reuse `MarketingCampaign/MarketingGeneratedContent/ContentApproval` + `SocialPublishingJob` (new) linked
- ✅ Reuse `IntegrationAuditLog`/`AloAuditLog` + `ProviderErrorLog` for audit
- ✅ Reuse `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/permissions.ts`, `src/lib/rate-limiter.ts`, `src/lib/redis.ts`
- ✅ Reuse `src/app/api/crm/ucc/oauth/*` pattern for new platforms
- ✅ Reuse UI: `src/components/ui/*`, `src/app/admin/*` layout, `src/app/employee/*` workspace

---

## 10) Risk & Next Steps (Phases 2-9)

**Phase 2 (Admin):** `src/app/admin/settings/digital-assets/page.tsx` — reuse `Super Admin` guard, CRUD `SocialIntegration` + `SocialAccount`, real API verification (`GET /{pageId}?fields=name&access_token`), token expiry, capabilities matrix
**Phase 3 (Employee):** `src/app/employee/my-accounts/page.tsx` — `EmployeeCommunicationProfile` + `SocialAccountOwnership`, OAuth `state` + PKCE, `POST /api/employee/social-accounts/connect`, request official access → `ApprovalRequest`
**Phase 4 (WhatsApp):** Official inbox `src/app/api/whatsapp/webhook` (verify `WHATSAPP_VERIFY_TOKEN` + `WHATSAPP_APP_SECRET` signature), assignment `UccRoutingRule`, per-employee `whatsappNumberId`, `WhatsAppMessageStatus`, admin revocation
**Phase 5 (Publishing):** Extend `src/app/counselor/marketing/*` + `src/lib/publish-engine.ts`, `SocialPublishingJob` queue, `ContentApproval` workflow, platform validation, `providerPostId` only on success
**Phase 6 (DB/Security):** Migration: add `employeeId` to `SocialAccount`, encrypt `accessToken` (AES-GCM + `ENCRYPTION_KEY`), add `SocialAccountToken` if per-account, `SocialPublishingJob`, CSRF, rate-limit, never log tokens
**Phase 7 (Env):** Update `.env.example` (add `GOOGLE_*`, `TIKTOK_*`, `X_*`, `TELEGRAM_*`, `PINTEREST_*`), doc callback `https://aloeducation.com/api/crm/ucc/oauth/callback` + `https://aloeducation.com/api/integrations/[platform]/callback` + webhooks `https://aloeducation.com/api/crm/ucc/webhooks/whatsapp`
**Phase 8 (Tests):** `vitest` OAuth state, webhook signature (HMAC SHA256), token encrypt/decrypt, ownership, publishing (mocked Graph API)
**Phase 9 (Deploy 3044):** `PORT=3044` via `DEPLOY_DIR` + Caddy `reverse_proxy localhost:3044`, `HEALTH_PORT=3044`, `pm2`, migrations `npx prisma migrate deploy`, seeds, test `curl https://aloeducation.com/api/health`

**Deployment Guardrails:** Never overwrite `DATABASE_URL`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`; never store per-employee tokens in `.env`; never log secrets; do not delete `alo-cpanel` (already deleted in main, keep deleted); do not replace real DB credentials with examples.

