# ALO Education — Full Repository Audit & Build Progress Report

**Repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Audit date:** 2026-10-23 (UTC)
**Audited commit:** `cead8141b34bfca78fc7b01dba07b6b748eecf7a` (branch `main`, HEAD of the audit branch)
**Auditor role:** Senior architect / full-stack / QA / DB / security / DevOps review
**Mode:** Read-only inspection, static verification, local test execution, read-only live production checks. **No production DB was connected, no messages sent, no payments triggered, no migrations executed, no code changed.**

> Every finding below carries a file path, a command, or an observed live response. Where verification was impossible the status is **BLOCKED** and the reason is stated. No test result in this document is invented; anything that did not run is listed in §9 and §14.

---

## 1. Executive summary

**The repository is a large, genuinely engineered Next.js monolith — not a mock-up.** It contains 422 pages, 965 API route handlers, a 548-model Prisma/MySQL schema, 30 migrations, 232 test files and a real CI pipeline that currently passes on `main` (lint, typecheck, unit tests, fresh-DB migration, zero-drift check, production build, boot smoke).

**The live site is a different, and much worse, story than the repository.** `https://aloeducation.com` is up and its database is connected (`/api/health` → `{"status":"ok","database":{"connected":true}}`), but:

* **The public catalogue is empty.** `/api/courses?limit=5` returns `{"courses":[],"total":0}`; the Course Finder renders "No courses match your current filters"; `/universities?country=United Kingdom` renders "No university records matched these filters"; `sitemap.xml` contains **zero** `/course/…` and **zero** `/university/…` URLs.
* **Clean public URLs return 404 from LiteSpeed.** `/about`, `/contact`, `/scholarships`, `/blog`, `/book-consultation`, `/universities`, `/visa` all return the LiteSpeed "resource could not be found" 404. Appending any query string (`/about?x=1`) returns the correct page with HTTP 200. This is an edge/cache routing defect, not a missing route.
* **Internal build-spec text is rendered to the public.** `/destinations/uk` displays literal instructions such as "Count from database — not hardcoded", "No courses found for United Kingdom — real DB, no fake static course cards. Load courses dynamically from existing courses table filter country_id", and "White card • Blue accent • Premium design • Route: /language-prep". These strings exist in source at `src/components/website/PremiumCountryPage.tsx:201` and `:266`, and `src/components/website/TestPreparationMiniCard.tsx:103`.
* **Production is stale.** The live About page still advertises "360+ University partners / 8,800+ Courses listed"; that block was deleted on `main` (`src/components/website/public-pages/PublicPages.tsx:632`: *"the previous 360+ partners / 8,800+ courses tiles were removed because no verified source backs those numbers"*). The deployed build therefore predates the audited commit.
* **The daily production health workflow has been failing** (`Health & Dependency Monitor`, job "Public production health", step "Public readiness and anonymous smoke checks"), consistent with the 404s above.

**The catalogue data itself is not trustworthy.** The master CSVs are templated rather than sourced: in a 50,000-row sample of `07_ALO_TUITION_FEES.csv`, **17,514 rows share one amount (14,000)**, every sampled duration is `1 year`; deadlines in `08_ALO_APPLICATION_DEADLINES.csv` are formulaic (`2026-12-01` for a January 2027 intake); `07_ALO_SCHOLARSHIPS.csv` repeats "University Excellence Scholarship" with identical amounts. `04_ALO_UNIVERSITY_VERIFICATION.csv` marks **399 of 400** universities `NEEDS_REVIEW`, with every row `verified_by = "Antigravity AI Auditor"`. No human or official-source verification is evidenced.

**Security is uneven — strong in the modern code paths, weak in a long tail of legacy endpoints.** 756 of 965 API handlers carry an authentication/authorization guard; I confirmed by source inspection a set of **unauthenticated handlers that read or write commercially sensitive or personal data** — `university-agreements` (commission terms), `official-emails`, `b2b-contacts`, `hr/leave`, `communications/tasks`, `communications/escalations`, `partner-packages` — plus three **unauthenticated, unrate-limited AI endpoints** (`/api/ai/sop`, `/api/ai/match`, `/api/ai/eligibility`).

**Verdict: NOT READY for production.** The engineering substrate is solid and CI-verified; the *product* is not. The blocking issues are (a) an empty verified catalogue, (b) broken clean-URL routing and unverified live deployment parity, (c) public display of internal spec text and unsourced marketing statistics, (d) unauthenticated access to sensitive endpoints, and (e) data that cannot be presented as "verified".

---

## 2. Repository identity and current Git status

| Item | Value |
|---|---|
| Repository | `https://github.com/tech360-bd/ALO_WEB_CRM_TECH` (GitHub reports `isPrivate: false` — **public**) |
| Package name/version | `alo-education-erp` v`0.3.0` (`package.json:2-3`) |
| Audited branch | `arena/65a95bf2-alo-web-crm-tech` (session branch, identical to `main`) |
| `main` HEAD | `cead8141b34bfca78fc7b01dba07b6b748eecf7a` |
| HEAD commit date | 2026-10-23 21:11:10 +0600 |
| HEAD commit | *Merge pull request #17 from tech360-bd/arena/137a6507-alo-web-crm-tech* |
| Working tree | **clean** (`git status`: "nothing to commit, working tree clean") |
| Tracked files | 67,953 |
| Working-tree size | 2.2 GB (`imports/` 1.1 GB, `alo-education-web-crm-final/` 371 MB, `docs/` 171 MB, `src/` 25 MB) |
| Git object size (GitHub `diskUsage`) | 273,617 KB (~267 MB) |
| Node/npm pinned | Node 22.x (`engines`, `.nvmrc`, `scripts/assert-node22.cjs`), npm 10.9.2 |

**Repository hygiene problems visible here**

* `imports/alo-education-full/` is a **997 MB vendored copy of the application, including `node_modules/`**, tracked in Git. It contains its own Prisma client and engine binaries (`imports/alo-education-full/node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x`). This is what made local Prisma verification possible in this sandbox, but it is dead weight, a secret-scan blind spot (documented in `.github/workflows/ci.yml:79-160`), and a source of stale code confusion.
* Two `.env` files are tracked: `imports/alo-education-full/.env` and `imports/alo-education-source/.env`. Both contain a single local SQLite path (`file:/home/z/my-project/db/custom.db`) — **no live credential**, but the files are not git-ignored and set a bad precedent.
* ~150 audit/report `.md`/`.csv`/`.json` artefacts sit at repository root (e.g. `ALO_FINAL_MASTER_PRODUCTION_READY.md`, `ALO_SUPER_ADMIN_CONTROL_CENTER_READY.md`), many claiming readiness that the live site contradicts.

---

## 3. Verified technology stack and architecture

Verified by reading `package.json`, `prisma/schema.prisma`, `next.config.ts`, `server.js`, `prisma.config.ts`, and by running the toolchain.

**Runtime and framework**
* Next.js **16.4.2** App Router, React **19**, TypeScript **5** (strict), `output: "standalone"` (`next.config.ts:5`).
* Node **22.x** enforced at build *and* start (`scripts/assert-node22.cjs`, loaded by `server.js:4`).
* Build: `prisma generate && next build --webpack` then `scripts/prepare-standalone.mjs`; start: `node server.js` → `.next/standalone/server.js` (`package.json:12-14`, `server.js`).
* Middleware is `src/proxy.ts` (Next 16's renamed middleware), matcher `/:path*` (`src/proxy.ts:659-661`), with an explicit `PUBLIC_ROUTES` allow-list and per-role route maps.

**Data layer**
* Prisma **6.19.3**, provider **MySQL**, 548 models / 549 tables, 30 tracked migrations plus an excluded `prisma/legacy-migrations-20261001/` archive.
* `prisma/schema.prisma` validates (`npx prisma validate` → "The schema at prisma/schema.prisma is valid 🚀").
* Model→table coverage check (script over `schema.prisma` + every `migration.sql`, honouring `@@map`): **548 models, 549 tables created, 0 models without a `CREATE TABLE`**, 1 extra legacy join table `_EmployeeToOffice`.
* `src/lib/db.ts` has a documented SQLite/libsql escape hatch gated on `ALO_DB_DRIVER=sqlite` for offline verification only.

**Authentication**
* NextAuth 4 with a Credentials provider, JWT sessions, 30-day max age (`src/lib/auth.ts:13`), Prisma adapter.
* bcrypt (12 rounds) verification (`src/lib/auth.ts:54`); login throttling via `LoginAttempt` (5 failures / 15 min by email **or** IP, `src/lib/auth.ts:31-38`); audit log write on login.
* A second portal identity system: DB-backed `alo_portal_session` cookie (`src/app/api/portal-auth/login/route.ts:282-284`, `httpOnly`, `sameSite=lax`, `secure` in production) plus legacy bearer support (`src/lib/auth-middleware.ts:57`).
* Role/RBAC services: `src/lib/rbac/role-service.ts`, `src/lib/rbac/permission-service.ts`, `src/lib/access-control/central-security-engine.ts`, `src/lib/access-control/object-scope.ts`.

**UI**
* Tailwind CSS 4 + Radix UI primitives, shadcn-style `components.json`, lucide icons, recharts, framer-motion, react-hook-form + zod 4.

**Integrations present in dependencies/config**
* nodemailer (`smtp-mailer` alias), WhatsApp/comms adapters (`src/lib/ucc/*`, `src/lib/communications/*`), Facebook/Instagram webhooks (`src/app/api/facebook/webhook/route.ts`), GA4/GTM, Ghost CMS, Redis (`src/lib/redis.ts`), S3-compatible storage libs, Remotion video engine.
* **No payment provider SDK** anywhere (`grep -i "stripe|sslcommerz|bkash|paypal|razorpay" src` → 0 matches). Payments are recorded, not processed.

**Deployment**
* `server.js` (Hostinger startup file), `ecosystem.config.cjs` (PM2 — throws deliberately), `Dockerfile`, `docker-compose.yml` (marked legacy), `vercel.json` (**16 cron definitions still present**), `nginx.conf`, `deploy.sh` (deliberately exits 1).
* CI: `.github/workflows/ci.yml` (413 lines, 2 jobs). `deploy-production.yml` and `deploy-recovery.yml` are refusal stubs (16 lines each, `exit 1`).

**Architecture summary**

```
Browser ── LiteSpeed (Hostinger) ── Node 22 / Next 16 standalone (server.js)
                                        │
                    ┌───────────────────┼────────────────────┐
              src/proxy.ts           965 API routes      422 pages
              (auth gate)                │
                                   Prisma 6.19 → MySQL 8 (548 models)
                                        │
              ┌──────────┬──────────┬────┴─────┬───────────┬──────────────┐
          SMTP/IMAP   WhatsApp   Facebook    AI gateway   Local private
          (nodemailer)  (UCC)     Lead Ads   (Groq/OR/ZAI/ storage pool C
                                             37 providers)
```

---

## 4. Complete feature inventory

Status vocabulary: **VERIFIED WORKING** (directly tested here) · **IMPLEMENTED, NOT VERIFIED** · **PARTIALLY IMPLEMENTED** · **PLACEHOLDER / MOCK** · **MISSING** · **BLOCKED**.

### 4.1 Public website

| Feature | Status | Evidence / path | Verification performed | Remaining work | Priority |
|---|---|---|---|---|---|
| Homepage + nav | PARTIALLY IMPLEMENTED | `src/app/page.tsx` (629 lines), `src/components/website/*` | Live `https://aloeducation.com/` renders (200) | Remove the "360+/8,800+" claims still deployed; fix broken CTA | P0 |
| About / contact / policy pages | PARTIALLY IMPLEMENTED | `src/components/website/public-pages/PublicPages.tsx` | Live `/about` and `/contact` → **404** (200 with `?x=1`) | Fix edge 404 caching; redeploy | P0 |
| Destinations (14 country guides) | PARTIALLY IMPLEMENTED | `src/app/destinations/[slug]/page.tsx`, `PremiumCountryPage.tsx` | Live `/destinations/uk` 200 but **contains internal spec text** | Remove spec placeholders (lines 201, 266) | P0 |
| Universities index & detail | PARTIALLY IMPLEMENTED | `src/app/universities/page.tsx`, `/api/universities` | Live: "No university records matched these filters"; clean URL 404 | Populate verified data; fix routing | P0 |
| Courses index & detail | PARTIALLY IMPLEMENTED | `src/app/courses/page.tsx`, `/course/[slug]/page.tsx` | `/api/courses` → `total: 0` | Populate verified data | P0 |
| Course Finder | PARTIALLY IMPLEMENTED | `src/app/course-finder/page.tsx`, `src/lib/course-finder/*`, `src/lib/public-catalog.ts` | Live renders filters; **zero results** | Feed verified courses | P0 |
| Course facts (fees/intakes/requirements) | PARTIALLY IMPLEMENTED | `src/lib/course-finder/*`, `CrmCourseIntakeFee`, `CrmCourseRequirement` | Schema + filters exist; no public rows | Verified ingestion | P1 |
| Scholarships | PARTIALLY IMPLEMENTED | `src/app/scholarships/*`, `src/app/api/scholarships` | 2 scholarship URLs in live sitemap; index 404 | Fix routing; verify records | P1 |
| SEO: metadata, sitemap, robots, structured data | IMPLEMENTED, NOT VERIFIED | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo/schema-helpers.ts` | Live sitemap renders but lists 0 catalogue URLs | Fix duplicate title tags; repair catalogue | P1 |
| Mobile responsiveness | IMPLEMENTED, NOT VERIFIED | Tailwind responsive classes throughout | Not tested (no browser) | Manual QA pass | P2 |
| Public enquiry form | IMPLEMENTED, NOT VERIFIED | `src/app/api/leads/route.ts` POST, `captureAttributionFromRequest` | zod `.strict()` schema + `rateLimitMiddleware(req,'lead_create')` + consent flag read | Verify against live DB; consent copy review | P1 |
| Apply Now (Form A) | PARTIALLY IMPLEMENTED | `src/app/apply/[slug]/page.tsx`, `src/app/api/applications/route.ts` | Route requires a public course to exist → currently unreachable | Catalogue dependency | P1 |
| Book consultation | PARTIALLY IMPLEMENTED | `src/app/book-consultation/page.tsx` | Live → **404**, homepage CTA dead | Fix routing | P0 |

### 4.2 Student portal

| Feature | Status | Evidence | Verification | Remaining | Priority |
|---|---|---|---|---|---|
| Registration / login / email verification | IMPLEMENTED, NOT VERIFIED | `src/app/api/auth/register/route.ts:92`, `src/lib/student/canonical-student.ts:191-202` (bcrypt 12) | Source inspection | Live end-to-end test | P1 |
| Password reset / OTP | IMPLEMENTED, NOT VERIFIED | `src/app/api/auth/reset-password/route.ts:22,76` (SHA-256 token hash), `portal-auth/*` | Source inspection | Live test | P1 |
| Profile management | IMPLEMENTED, NOT VERIFIED | `src/app/api/student/profile/route.ts` (IDOR fixed, sensitive fields stripped) | Source inspection; regression tests pass | Live test | P2 |
| Dashboard / application tracking | IMPLEMENTED, NOT VERIFIED | `src/app/student/**` (46 pages), `/api/student-portal/*` | Source inspection | Live test | P1 |
| Application forms (Form B) + readiness gate | IMPLEMENTED, NOT VERIFIED | `src/lib/application-readiness.ts`, `src/app/api/applications/route.ts` | Source inspection | Live test | P1 |
| Document upload | IMPLEMENTED, NOT VERIFIED | `src/app/api/documents/auto-upload/route.ts` (magic-byte MIME, 20 MB cap, private store), `src/lib/storage/private-file-store.ts` | Source inspection; strong containment (`O_NOFOLLOW`, web-root overlap rejection) | Live test | P1 |
| Status history / notifications | IMPLEMENTED, NOT VERIFIED | `ApplicationStageHistory`, `Notification`, `src/lib/application-manager/stage-transition.ts` | Unit tests pass | Live test | P2 |
| Learning / mock tests / English prep | IMPLEMENTED, NOT VERIFIED | `src/app/student/english-test`, `EnglishPrep*` models, `/api/mock-tests` | Source inspection | Live test | P2 |

### 4.3 CRM / admin / employee

| Feature | Status | Evidence | Verification | Remaining | Priority |
|---|---|---|---|---|---|
| Lead capture & management | IMPLEMENTED, NOT VERIFIED | `src/app/api/leads/route.ts` (guarded GET), `Lead`, `LeadScore`, attribution | Unit tests pass | Live CRM test | P1 |
| Counselor assignment / workload | IMPLEMENTED, NOT VERIFIED | `src/app/counselor/**` (26 pages), `src/app/api/admin/reassignment`, `quota-requests` | Source inspection | Live test | P2 |
| Application management (stages, offers, CAS/I-20) | IMPLEMENTED, NOT VERIFIED | `src/app/api/applications/[id]/offer|cas-i20-coe`, `src/lib/application-manager/*` | Source inspection; `authenticateUnified` + role checks present | Live test | P1 |
| University/course catalogue admin | IMPLEMENTED, NOT VERIFIED | `src/app/admin/**` (90 pages), `/api/admin/*` (many guarded by `getContentAdminSession`, which re-validates the account server-side, `src/lib/content-admin-auth.ts:7-20`) | Source inspection | Live test | P1 |
| RBAC / permissions / acting-as | IMPLEMENTED, NOT VERIFIED | `src/lib/rbac/*`, `src/lib/auth-middleware.ts`, `src/app/api/employee/acting-as` | Tests pass (`auth-session-hardening`, `api-authz-regression`) | Live test | P1 |
| Reports / analytics / audit logs | IMPLEMENTED, NOT VERIFIED | `AuditLog`, `AloAuditLog`, `PortalAuditLog`, `/api/analytics`, `/api/metrics` | Source inspection | Live test | P2 |
| Import / validation / approval / publishing | IMPLEMENTED, NOT VERIFIED | `src/app/api/admin/data-import/route.ts` (preview → queue proposals, never writes live), `UniversityUpdateRequest`, `src/lib/course-finder/catalogue-import-service.ts` | Source inspection + `catalog-import-safety`/`catalog-import-quarantine` tests pass | Live test | P1 |
| HR / payroll / accounting / procurement | IMPLEMENTED, NOT VERIFIED | `src/app/api/hr/*`, `src/lib/accounting/*`, `/api/procurement`, ~40 models | Unit tests pass (ledger, payroll transitions) | Live test | P3 |

### 4.4 Partner portal

| Feature | Status | Evidence | Verification | Remaining | Priority |
|---|---|---|---|---|---|
| Partner registration / activation | IMPLEMENTED, NOT VERIFIED | `src/app/partner/register`, `src/app/api/partner/activate` | Source inspection | Live test | P2 |
| Tenant isolation (B2B) | IMPLEMENTED, NOT VERIFIED | `AuthenticatedRequest.partnerId` resolved server-side (`src/lib/auth-middleware.ts:20-26`), `docs/B2B_PARTNER_TENANT_SECURITY.md` | `partner-b2b-security` integration test **skipped** (no DB) | Run with disposable DB | P1 |
| Referrals / student tracking | IMPLEMENTED, NOT VERIFIED | `StudentReferral`, `src/app/api/referrals/*` | Source inspection | Live test | P2 |
| Commission calculation / outstanding payments | PARTIALLY IMPLEMENTED | `CrmCommission`, `src/app/api/commissions`, `commissionTerms` fields | Code present; no test coverage found for computation correctness | Business-rules tests | P2 |
| Partner dashboards / quotas / marketing | IMPLEMENTED, NOT VERIFIED | `src/app/partner-admin/**` (23 pages), `PartnerMarketingQuota`, `/api/partner-admin/marketing` | Source inspection (legacy generator returns 410 by design) | Live test | P2 |

### 4.5 Integrations and automation

| Integration | Status | Evidence | Verification | Remaining | Priority |
|---|---|---|---|---|---|
| Facebook / Instagram Lead Ads | IMPLEMENTED, NOT VERIFIED | `src/app/api/facebook/webhook/route.ts` (`x-hub-signature-256` verified at line 51, encrypted page token) | Source inspection | Live webhook test | P1 |
| WhatsApp Business API | IMPLEMENTED, NOT VERIFIED | `src/app/api/crm/ucc/webhooks/whatsapp/route.ts` (verify token + signature at lines 28-94), `src/lib/ai-whatsapp-engine.ts` | Unit tests pass | Live test | P2 |
| SMTP / email | IMPLEMENTED, NOT VERIFIED | `src/lib/email-service.ts`, `/api/email/*`, queue + caps (`EMAIL_DAILY_CAP`) | Unit tests pass | Send test to own inbox | P1 |
| AI agents / AI Workforce | IMPLEMENTED, NOT VERIFIED | see §5 | 12 AI-related test files pass | Live run with keys | P2 |
| AI content builder | IMPLEMENTED, NOT VERIFIED | `src/app/admin/builder`, `/api/admin/builder` | Source inspection; **no tests reference it** | Add tests; live run | P2 |
| Payments | **MISSING** | No gateway SDK or webhook handler in `src/` | grep | Decide build vs. manual reconciliation | P2 |
| Scheduled jobs / crons | PARTIALLY IMPLEMENTED | `vercel.json` (16 crons) vs Hostinger ownership; `/api/cron/*` with `requireCron`; `cron_lock` migration | Source inspection; Vercel crons will **not** run on Hostinger | Move to server cron/systemd | P1 |
| Webhooks out | IMPLEMENTED, NOT VERIFIED | `/api/webhooks/*`, `src/lib/webhook*` | Source inspection | Live test | P3 |

---

## 5. AI Builder and AI agent audit

### 5.1 "AI Builder" is two different things — this matters

1. **The external AI coding tool.** `docs/AI-BUILDER-UPDATE-WORKFLOW.md:1-6` describes "AI Builder output → compare with main → branch → PR → CI → human approval → merge → Hostinger deploy". This is a *development process document*, **not a product feature**. There is no "AI Builder" service, route or model with that name in `src/` (`grep -ri "AI Builder" src` → 0 matches).
2. **ALO AI Short-form Builder (the in-app product).** This is the real content-generation feature:
   * UI: `src/app/admin/builder/page.tsx` → `src/components/admin/AloShortFormBuilder.tsx`.
   * API: `src/app/api/admin/builder/route.ts` (940+ lines).
   * Domain/validation: `src/lib/alo-short-form-builder.ts` (content types, grounded facts, `validateBuilderDocument` with `PASS|WARNING|BLOCKER` severities).
   * Status: **IMPLEMENTED, NOT VERIFIED**. No test file references `alo-short-form-builder` or `validateBuilderDocument` (`grep -rl ... tests` → empty). It cannot be exercised here: it needs an authenticated admin session, a populated MySQL DB, and an AI provider key.

**What the builder actually does (code-verified):**
* Access: `withAuth` + `isBuilderUser()` role gate (super_admin, admin, content_manager, content_editor, marketing_manager, marketing) — `route.ts:40-48`.
* Grounding: it queries real `CrmUniversity`/`CrmCourse`/`Country`/`CrmScholarship`/`CrmCourseIntakeFee` rows with `status: 'active'`, `verificationStatus`, `sourceUrl`, `lastVerifiedAt` and builds `BuilderGroundedFact[]` (`route.ts:214-310`, `:404`).
* Generation: `generateText` / `extractJson` from `src/lib/ai.ts`, then schema-parse into `AloBuilderDocument`.
* Persistence: `db.contentAsset.create({ ..., status: draftStatus })` plus `db.cmsRevision` (`route.ts:708-718`, `:797-813`).
* **Approval gate exists:** on "request review" it creates `db.contentApproval` with `status: 'pending'` (`route.ts:828-841`) and sets `publication: { status: 'DRAFT', approvalRequired: true }` (`route.ts:617`). Approved/published assets are immutable (`route.ts:743-744`: *"Approved or published pages are immutable. Create a new draft version before editing."*).
* **Can generated content reach production without approval?** By design, no: the sitemap only lists `ContentAsset` where `status: 'PUBLISHED'` **and** `tags` contains `alo-short-form-builder` **and** the parsed document has ≥2 images (`src/app/sitemap.ts:31-48`). A DRAFT asset is not public. **Caveat:** that guarantee is only as strong as the approval endpoint, and no automated test proves the transition. This is a "trust the code, unproven" control.

### 5.2 AI Workforce / agent infrastructure (the substantial AI system)

* **Models:** 23 `Awf*` tables in `prisma/schema.prisma` (departments, agents, versions, prompt versions, skills, tool grants, workflows, runs, run steps, tool calls, approvals, memory, knowledge sources/chunks, audit, events, test cases/results, model runtimes, improvement proposals, task ledger).
* **Services:** `src/lib/ai-workforce/` — `runner.ts` (17 KB), `workflow-engine.ts`, `deterministic-engine.ts` (41 KB), `gateway.ts`, `runtimes.ts`, `lifecycle.ts`, `approvals.ts`, `rbac.ts`, `security.ts`, `telemetry.ts`, `health.ts`, `validation.ts`, `output-schemas.ts`, `memory.ts`, `knowledge.ts`, plus registries `skills/catalog.ts` (19 skills), `tools/registry.ts` (6 tools).
* **API:** `src/app/api/ai-workforce/{agents,approvals,audit,automation,dashboard,events,health,knowledge,runs,seed,skills,tools,workflows}` — every handler routes through `_guard.ts` + a permission string (`awf.agent.read`, `awf.approval.read`, …).
* **Approval semantics:** `src/lib/ai-workforce/approvals.ts:1-6` — "An approval authorises ONE specific action, for ONE run, ONCE… Consumption is atomic". `requestApproval` stores a redacted payload with a TTL (`:25-45`).
* **Registries / routing:** runtime tiers 1→9 (self-hosted primary, secondary, optional cloud, deterministic terminal), with cloud egress gated by `ALO_ENABLE_OPTIONAL_CLOUD_AI` and private-IP endpoint validation (`runtimes.ts:35-80`).
* **Deterministic fallback:** `deterministic-engine.ts` guarantees structured output even with **no LLM configured**. This is good for uptime and dangerous for quality claims: without a real model, the "AI" output is rule-generated. Nothing in the health payload labels an individual run as deterministic to the end user — `runner.ts:283` returns `deterministic: true|false` to the caller, but the public/marketing surfaces do not disclose it.
* **Seeds:** `src/lib/ai-workforce/seed.ts` (30 KB), `prisma/seed-ai-agents.ts`, `prisma/seed-enterprise-ai.ts`, `prisma/agentos-seed.ts` (45 KB) — agent catalogue populated.
* **Tests:** 9 passing files — `ai-workforce-core`, `ai-workforce-security`, `ai-workforce-runner-regressions`, `ai-workforce-workflow-regressions`, `ai-workforce-seed-gates`, `ai-tool-loop`, `ai-command-execute-contract`, `ai-command-retry-policy`, `ai-model-registry`, `ai-provider-catalog`, `ai-provider-policy`, `ai-action-executor-approval`.
* **Status: IMPLEMENTED, NOT VERIFIED end-to-end.** I did not run a single agent execution against a database or model. There is no evidence in the repo that production has LLM keys configured (`ALO_ENABLE_OPTIONAL_CLOUD_AI` default off, no local model server assumed), so in production the Workforce most likely executes via the deterministic engine.

### 5.3 Other AI surfaces

| Surface | Path | Status |
|---|---|---|
| Public AI tools (course match, scholarship match, SOP helper, CV helper, visa coach) | `src/app/ai/*` (5 pages), `/api/ai/*` | PARTIALLY IMPLEMENTED — three endpoints have **no auth and no rate limit** (§10) |
| AI Command Center / monitor | `src/app/admin/ai-command-center`, `src/app/admin/ai-monitor`, `/api/ai-command/*` | IMPLEMENTED, NOT VERIFIED; `/api/ai-command/replicate` is unauthenticated |
| AI Brains (seo/marketing/student/university) | `src/lib/brains/*`, `/api/brains/*` | PARTIALLY IMPLEMENTED; several read endpoints unguarded |
| AI provider catalogue | `src/lib/ai-providers/catalog.ts`, `src/lib/ai-models/registry.ts` | VERIFIED WORKING at unit level (`ai-provider-*` tests pass) |

### 5.4 AI classification summary

| Classification | Components |
|---|---|
| **Operational (verified by tests, not by live run)** | provider registry/policy, tool-loop safety, approval transition logic, AI Workforce RBAC/security invariants |
| **Implemented, unverified** | Short-form Builder end-to-end, Workforce execution against a real model, AI Command Center, agent scheduling cron |
| **Placeholder / illustrative** | `seed-ai-agents.ts` uses `Math.random()` for status, `jobsProcessed`, `pendingApprovals`, `lastRunAt` (lines 80-83) — seeded dashboards show fabricated operational metrics |
| **Planned / absent** | no AI Builder agent/skill/workflow registry *for content generation* distinct from the Workforce; no automated publish-without-approval prevention test |

---

## 6. Public website implementation status (live vs. code)

Live checks were read-only `GET`s performed during this audit. They compare **deployed reality** against the repository.

| URL | Observed | Repository expectation | Interpretation |
|---|---|---|---|
| `/` | 200, full homepage | 200 | §-mat OK, but stats blocks differ from `main` |
| `/api/health` | `{"status":"ok","database":{"connected":true},…}` | 200 JSON | **Deployment is live and DB-connected** |
| `/api/courses?limit=5` | `{"success":true,"courses":[],"data":[],"total":0}` | verified+published+source-linked rows | **Public catalogue empty** |
| `/courses` | renders `/course-finder` content | full catalogue index (`src/app/courses/page.tsx`) | Stale build / redirect |
| `/course-finder` | 200, "No courses match your current filters" | 200 with results | Empty catalogue |
| `/universities?country=United Kingdom` | 200, "No university records matched these filters" | 200 with directory | Empty catalogue |
| `/universities` (clean) | **404 LiteSpeed** | 200 | Edge routing defect |
| `/about`, `/contact`, `/scholarships`, `/blog`, `/book-consultation`, `/visa` (clean) | **404 LiteSpeed** | 200 | Edge routing defect |
| `/about?x=1`, `/visa?x=1` | 200 with full page | 200 | Confirms routes exist; cache/edge is the fault |
| `/destinations/uk` | 200 — **contains internal spec instructions** | production copy | Content defect |
| `/sitemap.xml` | static + 14 destinations + 15 services + 5 resources + 2 scholarships; **0 courses, 0 universities** | same + catalogue | Confirms §catalogue empty |
| `/api/workforce/metrics` | `{"error":"Unauthorized — authentication required"}` | 401 | **Correctly guarded** |

**Conclusions**
1. Deployment exists and is healthy at the infrastructure level; the *content and routing* are not.
2. Production is running a build **older than `main`** (About-page statistics removed on `main` are still live).
3. The negative-control 404 pattern (clean URL 404 → same URL with `?x=1` 200) is consistent with LiteSpeed caching a 404 for those exact paths. It must be verified in the hosting panel (cache purge / rewrite rules) — I did not change hosting config.
4. `Health & Dependency Monitor` has been failing daily; its smoke script checks exactly these paths (`scripts/production-smoke.mjs:19`).

---

## 7. Student portal, CRM, admin and partner portal status

**Scale (code-verified):** student 46 pages, partner 22, counselor 26, admin 90, crm 56, employee 38, application-manager 19, partner-admin 23, super-admin 2, university-portal 1, parent-portal 1.

**What is genuinely engineered**
* **Auth:** two identity domains (`user` via NextAuth, `portal` via DB session), never inferred from client input; acting-as sessions are bound and revocable (`src/lib/auth-middleware.ts:20-40`).
* **Authorization:** explicit per-route permission helpers (`requireStudentResource`, `requirePartnerContext`, `requireCatalogAdmin`, `requireMonitoringViewer`, `requireCmsAdmin`, …) — 756/965 handlers carry a guard.
* **Application workflow:** stage machine with `ApplicationStageTransitionError`, maker-checker on payroll, private document links, B2B field stripping (`src/lib/application-manager/service.ts`).
* **Partner isolation:** `partnerId` resolved server-side from `PartnerProfile`; documented in `docs/B2B_PARTNER_TENANT_SECURITY.md`. The security test for this (`tests/integration/partner-b2b-security.test.ts`) **skipped** in this environment.

**What is not proven**
* Zero authenticated portal flows were exercised (no credentials, and I will not create them in production).
* `university-portal` and `parent-portal` each have a single page → **PLACEHOLDER** scope.

---

## 8. Database schema and data quality findings

### 8.1 Schema health — good
* 548 models, 549 tables, 30 migrations; **0 models without a matching `CREATE TABLE`** (checked against every `migration.sql`, honouring 47 `@@map` renames).
* `prisma validate` passes; `prisma generate` succeeds.
* CI job "MySQL 8 · Migrate · Integrate · Boot" passed on `main` at this commit: *Fresh-database migration*, *Migration status up to date*, *No drift between migrations and schema.prisma*, *Production build*, *Boot standalone server + runtime smoke* — all `success`.

### 8.2 Data quality — poor, and misrepresented

| Finding | Evidence |
|---|---|
| **Universities are not verified** | `04_ALO_UNIVERSITY_VERIFICATION.csv`: 400 rows, **399 `NEEDS_REVIEW`**, 1 `VERIFIED_OFFICIAL`; `verified_by` = `"Antigravity AI Auditor"` for all 400; notes say *"Seeded metadata requiring live audit"* |
| **Tuition fees are templated** | `07_ALO_TUITION_FEES.csv` 145,600 rows; 50,000-row sample: 17,514 identical `14000`, 9,984 × `15000`, 7,527 × `9000`; 100% `duration = "1 year"`; single currency per country block |
| **Deadlines are formulaic** | `08_ALO_APPLICATION_DEADLINES.csv`: `deadline_date` = first of the month before the intake month (`DEAD-00001` January 2027 → `2026-12-01`), identical row count to fees (145,600) |
| **Scholarships are repetitive** | `07_ALO_SCHOLARSHIPS.csv`: 3,411 rows, repeated "University Excellence Scholarship", identical amount/eligibility/application method |
| **Seed data is partly random** | `prisma/seed-ai-agents.ts:80-83,232,261` (`Math.random()` for agent status, jobs processed, pending approvals) |
| **Synthetic data was produced then "rejected"** | `ALO_SYNTHETIC_DATA_REJECTED.csv` (2.5 MB) and `src/lib/ai-agents/synthetic-data-guard.ts` exist; the guard is real, but the rejected corpus still sits in the repo |
| **Seeds do not make records public** | Only 20 occurrences of `verificationStatus: "VERIFIED"` across all `prisma/seed*.ts`; only 2 of `publicationStatus: 'published'` — so post-seed the catalogue is empty **by design** (fail-closed), which is exactly what production shows |
| **Public filter is strict (good)** | `src/lib/public-catalog.ts:29-55` requires `status:'active'` + `verificationStatus:'VERIFIED'` + `publicationStatus:'published'` + a source link + a public university + non-excluded international eligibility |

### 8.3 Data-integrity / approval controls that do exist
* Import preview never mutates live records; changes are queued as `UniversityUpdateRequest` proposals (`src/app/api/admin/data-import/route.ts:1-18`).
* Duplicate detection + conflict tracking: `src/lib/duplicate-detector.ts`, `DataConflict`, `ALO_DUPLICATE_REPORT.csv`, `ALO_CONFLICT_REPORT.csv`.
* Publication policy for legacy catalogue pages rejects non-https or synthetic source hosts and any slug with an open conflict (`src/lib/course-finder/public-content-page-policy.ts:1-50`).

### 8.4 Destructive-risk assessment
* `prisma/seed-complete.ts:281-287` **requires** `SEED_SUPER_ADMIN_PASSWORD` (≥12 chars) and **re-hashes/resets the Super Admin password on every run** — documented in `deploy.sh:8-13` and excluded from deployment by design.
* 114 `deleteMany`/`TRUNCATE` occurrences across `prisma/seed*.ts` — the seeds are **not** safe to run against production data. The runbook forbids it; nothing technical prevents it (seeds will happily run).
* `deploy.sh` is permanently disabled (exits 1) — good.

### 8.5 Verdict on data
**The catalogue cannot be described as "verified", "official" or "current".** The public UI's own claims ("Only courses with a published, verified record and a source link are listed", "Verified tuition fees") are true only because *nothing* is listed. The moment records are published with the existing CSVs, the site would present AI-attributed, templated fee figures as verified facts.

---

## 9. Tests executed and results

Environment: sandbox, Node v22.22.3, 2 vCPU, **3 GB RAM**, npm 10.9.8. `npm ci` → **1,282 packages installed OK**.

| # | Check | Command | Ran? | Result | Notes / limitations |
|---|---|---|---|---|---|
| 1 | Dependency install | `npm ci --no-audit --no-fund` | ✅ | **PASS** (43 s) | Uses committed `package-lock.json` |
| 2 | Prisma validate | `npx prisma validate` | ✅ after workaround | **PASS** — "schema is valid" | Prisma engine binary download is blocked by sandbox egress; resolved by pointing `PRISMA_SCHEMA_ENGINE_BINARY` / `PRISMA_QUERY_ENGINE_LIBRARY` at the vendored binaries in `imports/alo-education-full/node_modules/@prisma/engines/` and supplying a **dummy** `DATABASE_URL` |
| 3 | Prisma generate | `npx prisma generate` | ✅ | **PASS** — client v6.19.3 generated | Same engine workaround; no DB connection |
| 4 | Lint | `npx eslint .` | ✅ | **PASS** (158 s, zero output) | 67k tracked files, but repo-configured scope |
| 5 | Type check (full) | `npx tsc --noEmit` | ⚠️ **BLOCKED** | **OOM**: `FATAL ERROR: Reached heap limit` at 2.6 GB; `Killed` at 8 GB request on a 3 GB box | `package.json` build script asks for 4 GB; CI adds a swap file (`.github/workflows/ci.yml:189-203`) |
| 6 | Type check (scoped) | `npx tsc -p tsconfig.arena-critical-check.json --noEmit` | ✅ | **PASS** (exit 0) | ~35 critical API/lib files incl. applications, visa, AI intake, WhatsApp |
| 7 | Unit + integration tests | `npx vitest run` | ✅ | **PASS**: 232 files → **225 passed, 7 skipped, 0 failed**; 2,793 tests → **2,718 passed, 75 skipped, 0 failed** | 7 integration files skip with reason `TEST_DATABASE_URL is not set` (no MySQL in sandbox). First run (before client generation) had 10 failing files / 17 failing tests — **all** caused by `@prisma/client did not initialize yet` / `Prisma.sql is not a function`; after `prisma generate` all pass |
| 8 | Production build | `npm run build` | ❌ **NOT RUN** | Blocked by RAM (needs >4 GB; sandbox has 3 GB) | Equivalent step **passes in CI** on this exact commit (see #10) |
| 9 | DB schema drift / fresh migrate | `prisma migrate deploy` + `migrate diff` | ❌ **NOT RUN** | No MySQL service, no disposable DB, production DB forbidden | Verified green in CI MySQL 8 job |
| 10 | CI status on `main` | `gh run list` / `gh run view 39976097650` | ✅ | **SUCCESS** (10 m 28 s, ~3 h before audit) — jobs: *Lint · Typecheck · Tests · Prisma · Build* **success**; *MySQL 8 · Migrate · Integrate · Boot* **success**; steps incl. secret-leak scan, Prisma validate/generate, lint, typecheck, tests, production build, fresh migrate, zero drift, boot smoke — all **success** | Evidence for the audited commit |
| 11 | Production health workflow | `gh run list` | ✅ (observed) | **FAILING** daily — job `Public production health`, step `Public readiness and anonymous smoke checks` | Matches the live 404s |
| 12 | Live anonymous smoke (read-only) | `fetch_page` GETs | ✅ | Mixed: `/api/health` OK; `/api/workforce/metrics` correctly 401; **clean public URLs 404**; catalogue empty | Could not run `scripts/production-smoke.mjs` from the sandbox (egress restricted to GitHub/npm) |
| 13 | E2E (Playwright) | `npx playwright test` | ❌ **NOT RUN** | No browsers installed, no DB, no fixtures | `playwright.config.ts` present |
| 14 | `npm run test:integration` | — | ❌ **NOT RUN** | Requires disposable MySQL | 8 integration files |
| 15 | Dependency vulnerability audit | `node scripts/ci/npm-security-audit.mjs` | ❌ **NOT RUN** | Requires `npm audit` registry access | CI runs it and passed |

**Test-suite quality observation:** the 2,718 passing tests include meaningful security regressions (`api-authz-regression`, `application-documents-route-security`, `whatsapp-ai-safety`, `ai-workforce-security`, `content-publication-security` — the last skipped here for lack of DB). This is above average for a project of this size. But **no test covers the Short-form Builder**, and **no test caught the unguarded endpoints listed in §10**.

---

## 10. Security vulnerabilities and privacy risks

> All secrets were read and classified, never printed. No credential value appears in this report.

### P0 — unauthenticated data access / mutation (code-verified)

| Endpoint | Exposure | Evidence |
|---|---|---|
| `GET/POST/PATCH /api/university-agreements` | **University agreements including `commissionTerms`, contacts, internal notes** — readable and writable anonymously | `src/app/api/university-agreements/route.ts:6,14,22`; model `UniversityAgreement.commissionTerms` |
| `GET/POST /api/official-emails` | Official outbound email records (recipients, subjects, bodies); POST queues mail | `src/app/api/official-emails/route.ts:6,14` |
| `GET/POST /api/b2b-contacts` | B2B partner/university contact database | `src/app/api/b2b-contacts/route.ts:6,14` |
| `GET/POST/PATCH /api/hr/leave` | Employee leave records (HR PII) | `src/app/api/hr/leave/route.ts:5,16,26` |
| `GET/POST /api/communications/tasks` | Staff communication tasks (student-linked) | `src/app/api/communications/tasks/route.ts:7,31` |
| `GET/POST /api/communications/escalations` | SLA escalations | `src/app/api/communications/escalations/route.ts:7,29` |
| `GET/POST /api/partner-packages` | Package catalogue; POST writes **the raw request body** into `partnerPackage.create` (mass assignment) | `src/app/api/partner-packages/route.ts:5,13-15` |
| `POST /api/ai-command/replicate` | Creates AI agents (and apparently children) with no actor check | `src/app/api/ai-command/replicate/route.ts:9` |

**Caveat on live exploitability:** these paths returned **404 on the live host** during the audit (`/api/official-emails`, `/api/b2b-contacts`, `/api/hr/leave`), which is consistent with production running an older build. They are live risks the moment `main` is deployed — which is the stated release process.

### P0/P1 — unauthenticated, unrate-limited AI endpoints (cost + abuse)
`POST /api/ai/sop`, `POST /api/ai/match`, `POST /api/ai/eligibility` — no `authenticate*`, no `rateLimitMiddleware` (grep counts: auth=0, rate=0). Each calls an external LLM through `src/lib/ai.ts`. Anyone can burn provider quota and shape prompts. `/api/ai/scholarship-match` and `/api/ai/student-intake` do rate-limit.

### P1 — rate limiting is per-process and volatile
`src/lib/rate-limiter.ts:6` — `const store = new Map<...>()`. In-memory counters reset on every restart and are **not shared** between workers or instances; behind a load balancer the effective limit multiplies. Redis exists (`src/lib/redis.ts`) but the limiter does not use it. Also keys on raw `x-forwarded-for` (`:47`), spoofable if the proxy does not overwrite it.

### P1 — 209 handlers without a recognized guard pattern
756/965 guarded under my broader pattern; **77 mutation handlers** remain unguarded by source inspection. Most are legitimately public (registration, OTP, password reset, lead intake, Meta/WhatsApp webhooks with signature checks, unsubscribe, review-token submission). The ones listed above are not.

### P1 — `CommunicationTask`/`Escalation`/HR data may include student PII
These models are joined to `studentId`; unauthenticated listing is a privacy incident under any data-protection reading.

### P2 — repository is public
`gh repo view` → `isPrivate: false`. Source, data-quality reports and environment variable names are world-readable. No live secret was found (CI enforces a secret-leak scan; `.env*` is git-ignored except two harmless local SQLite-path files), but the exposure of `docs/` (including internal hostnames, runbooks, and the previous credential incident described in `ci.yml:81-100`) is itself a risk.

### Positive controls verified in source
* Login throttling + audit (`src/lib/auth.ts:31-60`); bcrypt 12 rounds; no plaintext password path (`src/lib/student/canonical-student.ts:191-202`).
* Reset/OTP tokens stored **hashed** (SHA-256) — `src/app/api/auth/reset-password/route.ts:22,76`.
* Cookies: `httpOnly`, `sameSite=lax`, `secure` in production (`src/app/api/portal-auth/login/route.ts:28,282-284`).
* Origin checks on 61 call sites (`src/lib/request-origin.ts`), used by 27 route files — **partial CSRF coverage**, not universal.
* Meta webhook signature verification `x-hub-signature-256` (`src/app/api/facebook/webhook/route.ts:51`), WhatsApp verify-token + signature (`src/app/api/crm/ucc/webhooks/whatsapp/route.ts:28-94`).
* Private document storage: absolute operator-configured `STORAGE_POOL_C`, rejects web-root overlap, `O_NOFOLLOW` leaf reads, magic-byte MIME checks, 20 MB cap (`src/lib/storage/private-file-store.ts:9-50`, `src/app/api/documents/auto-upload/route.ts:1-25`).
* Security headers in `next.config.ts`: HSTS (preload), `X-Frame-Options: SAMEORIGIN`, `nosniff`, Referrer-Policy, Permissions-Policy, CSP.
* `/api/crm/seed` was previously a public credential-dump; it is now disabled outside dev **and** gated by `ENABLE_CRM_DEV_SEED` (`src/app/api/crm/seed/route.ts:1-35`).
* `/api/student/profile` IDOR fixed; credential columns stripped (`src/app/api/student/profile/route.ts:1-30`).

### Privacy notes
* `Student.password` and `Student.otpCode` columns still exist (plaintext-capable) but are unused by current code (`otpCode:` writes → 0 matches). Legacy risk, should be dropped.
* AI Workforce approvals store *redacted* payloads (`redactDeep`, `approvals.ts:31`).

---

## 11. Deployment readiness for `aloeducation.com`

| Requirement | Finding |
|---|---|
| Intended architecture | Hostinger + Node 22 + npm, `server.js` starting `.next/standalone/server.js` (`README_DEPLOYMENT.md`, `docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md`) |
| Build command | `npm run build` (assert node22 → `prisma generate` → `next build --webpack` → `prepare-standalone.mjs`) |
| Start command | `node server.js` (validates `.next/standalone/server.js` exists, forces `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, validates `PORT`) |
| Database | MySQL 8 with `DATABASE_URL`; schema via `prisma migrate deploy` only |
| Persistent storage | **`STORAGE_POOL_C` must be an absolute path in production or uploads throw** (`private-file-store.ts:9-16`) |
| Environment variables | `.env.example` **245 keys**, `.env.production.example` **187 keys** — a very large surface: DB, auth secrets, SMTP, WhatsApp, Meta, ~20 AI providers, SMTP/email caps, storage, cron secret, analytics |
| Domain / HTTPS | Domain referenced as `https://aloeducation.com` throughout (`src/lib/seo/schema-helpers.ts`, `sitemap.ts`, `robots.ts`); TLS terminated by LiteSpeed |
| Reverse proxy | LiteSpeed (observed in 404 pages); `nginx.conf` and `docker-compose.yml` are legacy/unused |
| Email | nodemailer + queue with daily/hourly caps; `EMAIL_TEST_MODE`, `EMAIL_SENDING_ENABLED` flags |
| Backups | `/api/cron/database-backup` declared in `vercel.json` — **will not run on Hostinger** unless a system cron exists; no evidence of one |
| CI/CD | CI green on `main`; deployment is **manual/outside Actions** — `deploy-production.yml` and `deploy-recovery.yml` are 16-line refusal stubs; `deploy.sh` exits 1; `ecosystem.config.cjs` throws |
| Config contradictions | `vercel.json` still declares 16 crons; `docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md:24` names `REPOSITORY=engralaminn-collab/alo_education_z....ai` while the real repo is `tech360-bd/ALO_WEB_CRM_TECH`; README says "legacy/not used" in three separate banners |
| Staging | No staging environment evidenced (`docs/POST-AUDIT-STAGING-VERIFICATION.md` exists but marks items NOT VERIFIED) |
| Release state | The authoritative runbook itself says **"RELEASE HOLD"** (`docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md:3`) |
| Live parity | **Deployed build ≠ `main`** (§6 evidence) |
| Domain/DNS/email routing | **Not changed, not inspected** (out of scope and forbidden) |

---

## 12. Missing features and incomplete workflows

| Area | Missing / incomplete |
|---|---|
| Catalogue | No verified university/course/scholarship intake data reaching production; no human sign-off workflow evidenced for verification statuses |
| Payments | No gateway integration (no Stripe/bKash/SSLCommerz/PayPal); only recorded amounts and mock-test credits |
| Cron/scheduler | Jobs declared for Vercel; no Hostinger-native scheduler evidenced |
| Staging | No isolated staging environment |
| University portal / parent portal | Single page each — effectively placeholders |
| Commission engine | Computation exists in models/API; no test evidence of correct commission math |
| Accessibility / i18n | `src/i18n/`, `next-intl` present; no evidence of configured locales or a11y testing |
| AI content workflow | No automated tests for the builder; no proof that publish requires approval |
| Marketing claims governance | No guard preventing unsourced statistics from shipping (proof: live About page) |
| Content QA | No guard preventing spec text from rendering (proof: live `/destinations/uk`) |

---

## 13. Critical blockers preventing production readiness

**B1 — Empty public catalogue.** 0 courses, 0 universities publicly visible; Course Finder, `/courses`, `/universities`, `/apply/*` are dead ends. Root cause: strict fail-closed filter (`public-catalog.ts`) + data that no one has verified/published. *(Evidence: live `/api/courses` total 0; sitemap; `needs review` verification file.)*

**B2 — Broken clean-URL routing on the live host.** `/about`, `/contact`, `/scholarships`, `/blog`, `/book-consultation`, `/universities`, `/visa` return LiteSpeed 404 without a query string. Daily production health workflow failing. *(Evidence §6.)*

**B3 — Production build is stale.** Live pages contain copy removed from `main` (360+/8,800+ tiles) and lack routes present on `main`.

**B4 — Internal spec text exposed on public pages.** `PremiumCountryPage.tsx:201,266`, `TestPreparationMiniCard.tsx:103`.

**B5 — Unauthenticated access to sensitive endpoints** (commission terms, HR leave, B2B contacts, official emails, comms tasks/escalations, partner packages, AI agent creation) plus three unrate-limited AI endpoints.

**B6 — "Verified" data is not verified.** 399/400 universities `NEEDS_REVIEW` by an AI auditor; templated fees/deadlines/scholarships. Publishing this under "verified" wording is a misrepresentation risk.

**B7 — Release process contradicts itself.** `vercel.json` crons, disabled PM2/Docker/nginx paths, a deployment doc naming the wrong repository, and a self-declared RELEASE HOLD — with no verified Hostinger configuration.

---

## 14. Prioritized remediation roadmap

### P0 — Critical (do before any further public exposure)
1. Purge/fix LiteSpeed 404 caching for clean URLs; confirm `X-Robots-Tag`, rewrites, and that `/about`, `/contact`, `/book-consultation`, `/universities`, `/scholarships`, `/blog`, `/visa` return 200. Re-run `scripts/production-smoke.mjs`.
2. Remove spec/placeholder strings from `PremiumCountryPage.tsx:201,266` and `TestPreparationMiniCard.tsx:103`; add a CI content gate (`grep` deny-list of "DB", "not hardcoded", "Blue accent", "Create tabs/cards") on shipping components.
3. Remove unsourced statistics ("360+ partners", "8,800+ courses") from any deployed build and add a claim-provenance test.
4. Add authentication + role checks + origin checks to `university-agreements`, `official-emails`, `b2b-contacts`, `hr/leave`, `communications/tasks`, `communications/escalations`, `partner-packages` (replace mass assignment with a zod schema), `ai-command/replicate`.
5. Add auth **and** rate limiting to `/api/ai/sop`, `/api/ai/match`, `/api/ai/eligibility`.
6. Deploy `main` to production and verify parity (About page, `/courses` full index, routes added since).

### P1 — Essential for a safe launch
7. **Data verification programme:** replace AI-attributed `NEEDS_REVIEW` rows with human-verified, officially-sourced records (university URL + course page + fee page + last-verified date); add fee/deadline provenance fields; drop templated tuition/deadline rows.
8. Build the publish gate: a review queue that flips `verificationStatus → VERIFIED` and `publicationStatus → published` only with an approver ID, a source URL, and an audit entry; block any row whose source host is synthetic.
9. Publish a real catalogue subset (start with 20–50 verified courses/universities) and wire `/apply/[slug]` end-to-end.
10. Move rate limiting to Redis (`src/lib/redis.ts`) with proxy-trusted IP handling; add per-endpoint budgets.
11. Replace Vercel crons with a Hostinger-native scheduler (or systemd timers) covering backup, email queue, SLA monitoring, sitemap regeneration; verify `/api/cron/*` auth.
12. Add a CSRF/origin check to **every** state-changing route (currently 27 of 77 unguarded mutation handlers use it, 61 call sites overall).
13. Add automated tests for the Short-form Builder (validation blockers, draft-only persistence, approval transition, immutability after approval).
14. Fix the deployment contradictions: one authoritative runbook naming `tech360-bd/ALO_WEB_CRM_TECH`, explicit cron strategy, remove or clearly quarantine `vercel.json`.

### P2 — Operational / business
15. Commission calculation tests + partner ledger reconciliation.
16. Decide payments: integrate a gateway or document manual reconciliation.
17. Remove/scope the 997 MB `imports/` tree; drop dead `Student.password`/`otpCode` columns.
18. Add a staging environment with a disposable MySQL and run the 7 skipped integration suites there on every PR.
19. Replace random seed metrics (`seed-ai-agents.ts`) with empty-state UX.
20. i18n and accessibility programme (bn/en), plus structured-data validation in CI.

### P3 — Enhancements
21. Split the 548-model schema into domain modules; prune unused models.
22. Replace the monolithic `docs/` audit sprawl with a single status page generated from CI.
23. Performance budget + Core Web Vitals monitoring for the public site.
24. Add contract tests for Meta/WhatsApp/SMTP adapters using recorded fixtures.

---

## 15. Feature matrix (consolidated)

| Feature | Status | Evidence / file path | Verification performed | Remaining work | Priority |
|---|---|---|---|---|---|
| Homepage | PARTIALLY IMPLEMENTED | `src/app/page.tsx:1-629` | Live 200 | Remove stale claims, fix CTAs | P0 |
| About / Contact / Consultation | PARTIALLY IMPLEMENTED | `src/components/website/public-pages/PublicPages.tsx` | Live 404 on clean URLs | Edge-routing fix + redeploy | P0 |
| Destination guides | PARTIALLY IMPLEMENTED | `src/components/website/PremiumCountryPage.tsx:201,266` | Live 200 with spec text | Remove placeholders | P0 |
| Course Finder | PARTIALLY IMPLEMENTED | `src/lib/course-finder/*`, `src/lib/public-catalog.ts:29-55` | Live: 0 results | Verified catalogue | P0 |
| Course detail | PARTIALLY IMPLEMENTED | `src/app/course/[slug]/page.tsx` | Source + policy read | Catalogue | P0 |
| University directory | PARTIALLY IMPLEMENTED | `src/app/universities/page.tsx`, `/api/universities` | Live: 0 records; clean URL 404 | Data + routing | P0 |
| Scholarships | PARTIALLY IMPLEMENTED | `src/app/scholarships/*` | 2 URLs live; index 404 | Routing + verification | P1 |
| SEO / sitemap / robots / schema | IMPLEMENTED, NOT VERIFIED | `src/app/sitemap.ts`, `robots.ts`, `src/lib/seo/schema-helpers.ts` | Live sitemap XML inspected | Catalogue URLs missing; titles duplicated | P1 |
| Enquiry form | IMPLEMENTED, NOT VERIFIED | `src/app/api/leads/route.ts` | Source + tests | Live DB confirmation | P1 |
| Apply Now (Form A) | PARTIALLY IMPLEMENTED | `src/app/apply/[slug]/page.tsx` | Source | Needs public courses | P1 |
| Student registration/auth | IMPLEMENTED, NOT VERIFIED | `src/lib/auth.ts`, `canonical-student.ts:191` | Tests pass | Live E2E | P1 |
| Student dashboard/applications/docs | IMPLEMENTED, NOT VERIFIED | `src/app/student/**` (46), `/api/student-portal/*` | Source + tests | Live E2E | P1 |
| CRM leads/counselors | IMPLEMENTED, NOT VERIFIED | `src/app/crm/**` (56), `/api/leads` | Source | Live E2E | P1 |
| Catalogue admin + import/approve | IMPLEMENTED, NOT VERIFIED | `/api/admin/data-import`, `UniversityUpdateRequest` | Source + tests | Live E2E | P1 |
| RBAC / permissions / acting-as | IMPLEMENTED, NOT VERIFIED | `src/lib/rbac/*`, `auth-middleware.ts` | Tests pass | Live E2E | P1 |
| Partner portal / tenancy | IMPLEMENTED, NOT VERIFIED | `src/app/partner-admin/**`, `auth-middleware.ts:20-26` | Integration test **skipped** | Run with DB | P1 |
| Commissions | PARTIALLY IMPLEMENTED | `CrmCommission`, `/api/commissions` | Source only | Calculation tests | P2 |
| HR / payroll / accounting | IMPLEMENTED, NOT VERIFIED | `src/app/api/hr/*`, `src/lib/accounting/*` | Unit tests pass | Live E2E | P3 |
| Facebook Lead Ads | IMPLEMENTED, NOT VERIFIED | `facebook/webhook/route.ts:51` | Source | Live webhook test | P1 |
| WhatsApp | IMPLEMENTED, NOT VERIFIED | `crm/ucc/webhooks/whatsapp/route.ts:28-94` | Tests pass | Live test | P2 |
| SMTP email | IMPLEMENTED, NOT VERIFIED | `src/lib/email-service.ts` | Tests pass | Send test | P1 |
| AI Short-form Builder | IMPLEMENTED, NOT VERIFIED | `src/app/admin/builder`, `/api/admin/builder`, `src/lib/alo-short-form-builder.ts` | Source; **no tests** | Tests + live run | P2 |
| AI Workforce | IMPLEMENTED, NOT VERIFIED | `src/lib/ai-workforce/*` (23 models) | 12 AI-related test files pass | Runtime proof w/ model | P2 |
| Public AI tools | PARTIALLY IMPLEMENTED | `src/app/api/ai/*` | Live 401 only on `/api/workforce` | Auth + rate limit | P1 |
| Payments | MISSING | — | grep: no provider SDK | Build or document manual | P2 |
| Scheduler / crons | PARTIALLY IMPLEMENTED | `vercel.json` vs Hostinger | Source | Hostinger-native cron | P1 |
| Mobile responsiveness | IMPLEMENTED, NOT VERIFIED | Tailwind classes | Not tested | Manual QA | P2 |
| Structured data / SEO metadata | IMPLEMENTED, NOT VERIFIED | `src/lib/seo/*` | Source | Rich-results validation | P2 |

---

## 16. Top 10 findings

1. **The public catalogue is empty in production** — `/api/courses` `total: 0`, zero course/university URLs in `sitemap.xml`.
2. **Clean public URLs 404 on the live host** (`/about`, `/contact`, `/book-consultation`, `/universities`, `/scholarships`, `/blog`, `/visa`) while the same URLs with any query string return 200.
3. **Production is running a stale build**, demonstrably older than `main` (About-page statistics removed on `main` are still live).
4. **Internal build-spec text is rendered to the public** on `/destinations/uk` (`PremiumCountryPage.tsx:201,266`; `TestPreparationMiniCard.tsx:103`).
5. **Eight sensitive API areas are unauthenticated** (commission terms, HR leave, B2B contacts, official emails, comms tasks/escalations, partner packages, AI agent creation).
6. **Three AI endpoints are unauthenticated and unrate-limited**, exposing LLM spend and prompt injection.
7. **"Verified" catalogue data is not verified** — 399/400 `NEEDS_REVIEW`, `verified_by = "Antigravity AI Auditor"`, templated fees and deadlines.
8. **The test/CI substrate is genuinely strong** — 2,718 passing tests, zero failures locally after client generation, and a green two-job CI including fresh MySQL migration, zero drift, production build, and a boot smoke test on the audited commit.
9. **The AI system is real but unproven** — a 23-model Workforce with approval gates and a deterministic fallback engine, plus a grounded content builder; neither has end-to-end proof, and the builder has no tests.
10. **Release engineering contradicts itself** — `vercel.json` crons on a Hostinger target, disabled PM2/Docker/deploy paths, a runbook naming the wrong repository, and a self-declared RELEASE HOLD.

---

## 17. Ten next actions for the development team

1. **Purge the LiteSpeed 404 cache / fix rewrite rules** and get the daily `Health & Dependency Monitor` green (it is the cheapest, highest-impact fix).
2. **Redeploy `main` and prove parity** with a checklist of routes that exist on `main` but not in production.
3. **Strip spec/placeholder text and unsourced statistics**, then add a CI deny-list so they cannot return.
4. **Close the unauthenticated endpoints** listed in §10 today — they are one deployment away from being live.
5. **Add auth + rate limiting to `/api/ai/{sop,match,eligibility}`** and move the limiter to Redis.
6. **Run the data-verification sprint**: pick 30 universities, verify fee/intake/requirement pages against official URLs, record approver + `lastVerifiedAt`, publish, and watch `/course-finder` return results.
7. **Add tests to the Short-form Builder** and a publish-gate test proving DRAFT content cannot go live without `ContentApproval`.
8. **Stand up staging** with disposable MySQL so the 7 skipped integration suites (partner tenancy, content publication security, communication ownership, etc.) actually run on every PR.
9. **Replace Vercel crons with a Hostinger-native scheduler** and verify `/api/cron/*` authentication and backup execution.
10. **Delete or quarantine the 997 MB `imports/` tree** and consolidate the deployment documentation into one authoritative, repo-accurate runbook.

---

## 18. Tests that could not be run, and why

| Test | Why it could not run |
|---|---|
| Full `tsc --noEmit` (`npm run typecheck`) | Sandbox has 3 GB RAM; TypeScript OOMs at 2.6 GB and is killed at 8 GB. CI provisions a swap file and passes. |
| `npm run build` (production Next build) | Same memory constraint (`NODE_OPTIONS=--max-old-space-size=4096` in the script). CI's identical step passes on this commit. |
| `prisma migrate deploy` / `migrate diff` (drift) | No MySQL server in the sandbox; connecting to production is forbidden. CI verifies both against MySQL 8.4. |
| 7 DB-backed integration suites (`TEST_DATABASE_URL` unset) | Includes `partner-b2b-security`, `content-publication-security`, `communication-ownership`, `university-monitoring*`, `visa-security-negative`, `consultation-workflow`, `whatsapp-student-journey`. They **skip with a stated reason** (never reported as passes). |
| Playwright E2E (`tests/e2e`, `tests/browser`) | No browser binaries, no DB, no fixtures. |
| `npm run test:integration` / `scripts/run-integration-tests.mjs` | Requires discretionary MySQL. |
| `node scripts/production-smoke.mjs https://aloeducation.com` | Sandbox egress is restricted to GitHub/npm; I reproduced the checks manually with read-only page fetches instead. |
| `node scripts/ci/npm-security-audit.mjs` / `npm audit` | Registry advisory access restricted; CI runs it and passed. |
| Authenticated flows (student/CRM/partner/AI Workforce/builder) | No credentials exist for me, and creating accounts in production is out of scope. |
| Any write/integration test against production | Explicitly forbidden. |

---

## 19. Production-readiness verdict

# NOT READY

**Why not `CONDITIONALLY READY`:** the blockers are not polish. The site's primary product — a searchable, verified university/course catalogue — returns **zero results** in production; several primary public URLs return **HTTP 404**; internal build instructions are **visible to end users**; the deployed build is **stale relative to `main`**; and eight sensitive API areas plus three AI endpoints are **unauthenticated** in the shipping code. Any one of these would justify a hold; together they are disqualifying.

**What is genuinely ready (and should not be rebuilt):**
* Toolchain and build: Node 22 + Next 16 standalone build, green in CI on the audited commit (lint, typecheck, 2,718 tests, production build, fresh MySQL migration, zero drift, boot smoke).
* Schema: 548 models, 549 tables, 0 models missing a migration, `prisma validate` clean.
* Security engineering in the modern paths: bcrypt, hashed reset tokens, httponly/secure/samesite cookies, login throttling, signature-verified webhooks, private-document storage with path containment, security headers, RBAC + object scoping, human-approval design in the AI Workforce.
* The AI Workforce and Short-form Builder are real implementations with genuine approval semantics — they need proof and polish, not invention.

**Evidence limitations:** no production database, no authenticated session, no browser, no local MySQL, and a 3 GB RAM ceiling constraining typecheck/build. The live comparisons are read-only `GET`s taken on 2026-10-23 and reflect that moment; the 404 pattern is consistent but the underlying LiteSpeed configuration was **not inspected** (hosting access not available and changes were out of scope).

**Recommended immediate sequence:** fix edge routing → redeploy `main` → strip placeholders → close unauthenticated endpoints → start the human data-verification programme → re-audit. Re-assess the verdict only after the catalogue returns non-zero, verified results and every public URL in `sitemap.xml` answers 200.

---

*End of report. No repository source file was modified during this audit; this document is the only file added.*
