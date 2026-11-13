# ALO Education Complete Digital Platform — Audit & Remediation Report

**Repository:** `tech360-bd/ALO_WEB_CRM_TECH` (existing project — nothing rebuilt, nothing replaced)
**Branch:** `arena/2c99a107-alo-web-crm-tech`
**Base commit audited:** `71b3f953` (Merge PR #24)
**Audit date:** 2026-10-24
**Auditor:** Arena Agent Mode

**Final status: NOT COMPLETE.** The platform is far larger and more complete than a greenfield build, but the acceptance gate is not passable in this environment: there is no MySQL instance, no integration credentials, no browser runtime, and the full-repo type-check cannot execute inside the 3 GB sandbox. Everything claimed below is backed by a command output, a file path, or a test result. Anything that could not be executed is marked as such, not as passing.

---

## A. Existing System Audit

| Item | Value | How verified |
|---|---|---|
| Framework | Next.js 16.4.2 (App Router, `--webpack` build), React 19, TypeScript 5, Tailwind | `package.json` |
| ORM / DB | Prisma 6.19.3, MySQL (provider `mysql`) | `prisma/schema.prisma`, `package.json` |
| Pages (App Router) | **434** `page.tsx` files | `find src/app -name page.tsx` |
| API route handlers | **969** `route.ts` files | `find src/app/api -name route.ts` |
| Prisma models | **548** models / 12,300 schema lines | `grep -c "^model "` + `scripts/verify-prisma-client.mjs` |
| Migrations | 32 directories + `legacy-migrations-20261001` | `ls prisma/migrations` |
| Library modules | 454 `.ts` files under `src/lib` | `find src/lib -name "*.ts"` |
| Unit/integration tests | 283 spec files in the Vitest project | `ls tests/unit tests/integration` |
| Seeders | 24 seed scripts; `db:seed` → `prisma/seed-complete.ts` | `prisma.config.ts` |
| Tracked files | 68,069 | `git ls-files` count |

Conclusion: this is a mature monolith with a public marketing site, a CRM, 12 portal families, an AI workforce, an HRM subsystem, accounting/procurement, and a university/course catalogue pipeline. The correct response is gap-filling, not construction. No module was replaced.

---

## B. Repository & Stack Inventory

* **Public site:** about, destinations (20 countries), universities, courses, course-finder, scholarships, services, language-prep (15 exam routes), resources (10 canonical categories + article detail), guides, blog, news, events, success-stories, team, faqs, policies, AI tools (`/ai/course-match`, `/ai/scholarship-match`, `/ai/sop-helper`, `/ai/cv-helper`, `/ai/visa-coach`).
* **Portals:** `/student` (28 routes), `/counselor`, `/admin` (≈120 routes), `/crm`, `/employee`, `/partner`, `/partner-admin`, `/application-manager`, `/super-admin`, `/visa`, `/hrm`, `/marketing`, `/finance`, `/university-portal`, `/review/[token]`, `/parent-portal`.
* **Cross-cutting:** `src/proxy.ts` (662-line edge auth/RBAC gate), `src/cron` (scheduler + 15 job declarations), `src/lib/agentos`, `src/lib/ai-workforce`, `src/lib/communication`, `src/lib/access-control`.
* **Brand layer:** `src/components/website/PublicNavbar.tsx` (658 lines), `PublicFooter.tsx` (477 lines), `globals.css` design tokens.

---

## C. Database Layer

* 548 models cover: identity/RBAC (`User`, `Role`, `Permission`, `UserRole`, `PortalUser`, `PortalRole`, `EmployeePermissionRequest`, `EmployeeTemporaryPermission`, `EmployeeBreakGlassAccess`), CRM (`Lead`, `Student`, `Application`, `VisaCase`, `B2bProvider`), HR (`Employee*`, `EmployeeLeave`, `EmployeePayroll`, `Hrm*`), communication (`Communication*`, `Ucc*`, `WhatsApp*`, `OtpLog`, `CallLog`), AI (`AiAgent`, `AiAgentRegistry`, `AgentOS*`, `Awf*`), approvals (`ApprovalRequest`, `ApprovalQueueItem`, `AgentApprovalQueue`, `ContentApproval`, `AwfApproval`), and the catalogue (`CrmUniversity`, `CrmCourse`, `CoursePage`, `UniversityPage`, `Scholarship`, `Country*`).
* **Not verified:** there is no MySQL server in this sandbox and no `TEST_DATABASE_URL`, so `prisma migrate status`, `prisma db pull` comparison, seed execution, and any live query are **unexecuted**. Database correctness is therefore *static-only* evidence.

---

## D. API Layer

* 969 route files. `src/proxy.ts` is a **fail-closed** gate: unknown `/api/*` paths require authentication; `PUBLIC_API_READ_ROUTES`/`PUBLIC_API_WRITE_ROUTES` are explicit allow-lists; a 105-entry role map plus path-normalisation and 5-round percent-decoding hardening guard privileged prefixes.
* Many handlers are *also* guarded individually (`authenticateRequest`, `withAuth`, `withStudentAuth`, `getContentAdminSession`, `requireAloSuperAdmin`, `canAccessFeatureEngine`, `handleAuthorizedCronRequest`, `_guard` in `ai-workforce`). Defence-in-depth is uneven — several privileged handlers rely on the proxy alone (see §AD).

---

## E. Authentication & Session Security

* NextAuth (`/api/auth/[...nextauth]`) for staff; separate student portal session (`src/lib/student-auth.ts`, `withStudentAuth`), separate portal-auth flow with OTP (`/api/portal-auth/*`), login-attempt and OTP throttling models (`LoginAttempt`, `OtpCode`, `OtpLog`, `isPhoneBlocked`).
* Sensitive routes write audit rows on success **and** denial (`SALARY_VIEW_DENIED`).
* Verified in code; not exercised at runtime (no DB).

---

## F. RBAC & Data Scope

* Two cooperating layers exist:
  * `src/lib/permissions.ts` — 1,000-level permission catalogue with human IDs (`h6` = *view own salary*), role→permission packages.
  * `src/lib/access-control/central-security-engine.ts` — `AccessScope` (`GLOBAL|ALL|OWN|ASSIGNED|BRANCH|COUNTRY|DEPARTMENT`) with alias normalisation (`ALL→GLOBAL`, `OWN_ONLY→OWN`, `BRANCH_ONLY→BRANCH`).
  * `src/lib/data-scope.ts` — role→scope map (`branch_manager→BRANCH`, `finance→BRANCH`, `hr_manager→BRANCH`, …).
* Frontend checks exist for UX only; server routes re-resolve roles from the session, never from client input.

---

## G. Acting-As / Impersonation

* Implemented: `/api/portal-auth/acting-as/start|stop`, legacy alias `/api/admin/acting-as` (re-exports the same POST, GET returns the audit history), session record + `PortalAuditLog` actions `ACTING_AS_START`/`ACTING_AS_STOP`, no employee password required, `actingAsSessionId` propagated into audit metadata.
* **Hardened in this pass:** permission-granting (`POST /api/employee-access/feature-access`) now refuses an acting session (see §AA-6).

---

## H. Audit Trail

* Multiple append-only models (`PortalAuditLog`, `AloAuditLog`, `EmployeeAuditLog`, `CrmAuditLog`, `HrmAuditLog`, `AwfAuditLog`, `AgentAuditLog`, `AuditLog`) plus `src/lib/transactional-audit.ts`.
* `GET /api/audit` exposes raw audit rows but is role-gated to `SUPER_ADMIN`/`ADMIN` in `proxy.ts:283`.

---

## I. Approval Workflows

* Models: `ApprovalRequest`, `ApprovalAction`, `ApprovalQueueItem`, `ContentApproval`, `AgentApprovalQueue`, `AwfApproval`, `MarketingApproval`.
* UI: `/admin/approvals`, `/admin/change-approval`, `/admin/change-approval/history`, `/admin/approval-center` **does not exist** (see §AF-3).

---

## J. Student 360

* Shared view `src/components/alo/views/counselor-student-360.tsx` (1,562 lines) backed by `/api/counselor/students` and `/api/counselor/students/{id}`.
* **Defect fixed:** `/counselor/students/[id]` rendered the view without the route id, so any student link showed the *first* student in the list. The id is now passed as `slug`, and an out-of-scope id resolves to an error state instead of silently showing another student (§AA-3/§AA-4).
* **Gap closed:** canonical `/crm/students` and `/crm/students/{id}` routes now exist and reuse the same component (§AA-5). `/crm/leads/new` already linked to `/crm/students`.

---

## K. Employee HR Module

* Present: `/crm/hrm/*` (profile, attendance, leave, payroll, documents, devices, notices, exit, agreements, analytics, security), `/employee/*`, `Hrm*` + `Employee*` models (250+ HR models total).
* Student dashboard is untouched by HR (`/student/*` routes contain no HR surfaces).
* HR APIs use role gates (`/api/hrm` and `/api/hr` → `SUPER_ADMIN|ADMIN|HR_MANAGER` in `proxy.ts:280-281`).

---

## L. AI Agent Network

* Registry models exist (`AiAgent`, `AiAgentRegistry`, `AgentDefinition`, `AgentRuntime`, `AiEmployee`, `AgentOS*`, `Awf*` with `AwfToolGrant`, `AwfApproval`, `AwfRun`, `AwfTestCase`, `AwfAuditLog`).
* Seed `prisma/seed-ai-agents.ts` declares **51 departments × 20 = 1,020** agents. The specification asks for **2,000** agents across 48–50 departments → **spec mismatch, not met** (§AF-4).
* **Fixed in this pass:** the seeder previously ran `deleteMany()` on every agent and wrote `Math.random()` statuses, job counts, pending approvals and last-run timestamps. It is now idempotent (find-first/update-or-create), never destroys rows, and seeds truthful zero-state telemetry (`IDLE`, 0 jobs, no last run) (§AA-9).

---

## M. AI System Builder

* `/admin/system-builder`, `/admin/builder`, `/admin/homepage-builder`, `Awf*` sandbox/test/approval/rollback models exist. The apply → approve → rollback path is code-present but **unverified at runtime** (no DB).

---

## N. Unified Communication Engine

* Models: `CommunicationThread/Message/Template/Preference/SlaRule/Escalation`, `UccConversation/Message/RoutingRule/OfficeHours/WebhookEvent`, `WhatsApp*`, `SmsLog`, `CallLog`, `SocialInbox`, `AiReplyDraft`.
* Engine: `src/lib/communication/{unified-engine,business-hours,after-hours,otp-engine}.ts`; SLA routes under `/api/communications/sla/*`; OTP gate before private data in `/api/crm/communications/otp`.
* Provider credentials are absent → status **READY_FOR_AUTHORIZATION**, never "LIVE_CONNECTED".

---

## O. Partner / B2B System

* Models include `PartnerProfile`, `PartnerUserSeatRequest`, `PartnerMarketingQuota`, `PartnerMarketingUsage`, `PartnerMarketingRequest`, `FeatureAccessRule`, `ExtraQuotaRequest`, `StudentBenefitEntitlement`, `StudentMockTestVoucher`.
* UI: `/partner`, `/partner-admin` (dashboard, students, seat-request API, marketing studio), `/application-manager/b2b*`.
* Partner isolation: `auth.partnerId` is resolved server-side (documented in `src/lib/auth-middleware.ts:21-29`), never from client input. Masking of passport/bank/visa-private fields is enforced in the partner-facing selects; verified by reading the partner views, not by runtime test.

---

## P. Course Finder / University Directory / Eligibility

* `/course-finder` is a public, DB-driven catalogue with shared public-page policy (`publicCoursePageWhere`, `publicUniversityPageWhere`, open-conflict exclusion) — sitemap and pages use the same predicate.
* Eligibility: `/api/course-finder/eligibility`, `FinderEligibilityResult`, `RegulatoryRuleVersion`, `/admin/eligibility-rules`, `/admin/rule-versions`; the rule engine is structured, not LLM-only.
* Country pages: 20 slugs in `sitemap.ts`, data in `src/lib/country-destinations-data.ts` with per-country `canonicalUrl` and source fields; DB `Country*` tables exist.

---

## Q. SEO Growth Module

* `/crm/seo-manager`, `/admin/seo/link-health`, `/admin/seo/orphan-pages`, `/api/seo/*` (keywords, opportunities, tasks, Search Console ingest/performance/sitemaps).
* **Defect found, not fixed:** `src/components/crm/seo/CrmSeoContentWorkflow.tsx` renders a fictional pipeline — invented writers ("Priya Sharma", "Dr. Anil Mehta", "Ravi Kumar", "Sarah Chen", "Neha Gupta"), fabricated word counts and a hardcoded "Published 24" tile — and it is reachable through the CRM view map in `src/app/page.tsx:487`. Same pattern in `CrmSeoGrowthDashboard.tsx` and `CrmSeoPolicyWatcher.tsx` (§AF-5).

---

## R. Marketing Automation

* `/marketing/*`, `/admin/marketing-automation`, `/admin/social-media-management`, `/admin/video-studio`, `Marketing*` (30+ models), `src/lib/marketing/*` with permission + audit helpers. `hasMarketingAccess`/`isMarketingSuperAdmin` guard handlers; `/api/marketing` has no blanket proxy rule, so handler guards are the only line for most of it (§AD-2).

---

## S. Security Center & Emergency Lockdown

* `/admin/security`, `/api/admin/security/lockdown` (state consumed by `MasterSuperAdminDashboard`), `EmployeeSecurityEvent`, `SecurityAudit`, `DocumentSecurityIncident`, `SensitiveDataRevealLog`, device/login models. Code-present; runtime unverified.

---

## T. Observability & Background Jobs

* `src/cron/worker.ts` + `cron-definitions.ts` + `src/lib/cron/{job-registry,job-runner}.ts` with real leases (`CronLock`) and `CronJobLog`; 15 declared jobs, 13 `route.ts` handlers under `/api/cron/*`.
* **Defect found, not fixed:** `vercel.json` schedules **16** paths of which **14 do not exist** (e.g. `/api/cron/sla-monitoring`, `/api/cron/whatsapp-followups`, `/api/cron/database-backup`). Only `university-monitoring` and `webhook-dispatch` resolve. If this app is deployed to Vercel, those jobs 404 silently. The PM2 worker is the working scheduler (§AF-6).

---

## U. Reporting Engine

* `/admin/reports`, `/crm/visa-reports`, `/application-manager/reports`, `WeeklyReport`, `MarketingReport`, `/api/cron/weekly-reports`. Code-present; not executed.

---

## V. Import Center

* `/admin/import-center/*` (students, courses, universities, countries, scholarships, visa rules, city living costs, country facts/pages), `/admin/data-import`, `ImportBatch`, `ImportStagingStudent`, `CrmImportError`, change-approval queue `/admin/change-approval`. CSV masters exist at repo root (e.g. `01_ALO_UNIVERSITY_MASTER.csv`, `ALO_MASTER_COURSE_DATABASE.csv`).

---

## W. Website / Brand / Public Chrome

* Header and footer already match the final brand brief: menu order (Destinations · Course Finder · Services · Language Prep · Resources · Portal · AI SUPPORT), tagline "Your Dream – Our Commitment", `#F37021` CTA, `#0066CC` navigation, social order FB→IG→LinkedIn→YouTube, the three-row graduation-cap strip, and the orange copyright bar.
* Design-token guardrails (`tests/unit/design-tokens.test.ts`, 17 assertions) are green after this pass.

---

## X. Integrations Status

`.env.example` documents 241 variables (WhatsApp Cloud API, 3CX, Chatwoot, SMTP, S3, Google Business Profile, Meta, payment gateways, 20+ AI providers). **No credential is present in this workspace.** Every external integration is therefore **READY_FOR_AUTHORIZATION**, not live. Nothing in this report claims a live third-party connection.

---

## Y. Test Evidence (five passes)

| Pass | Command | Before | After |
|---|---|---|---|
| 1 | `npx vitest run` (unit + integration spec collection) | **3 failed files / 13 failed tests**, 3,120 passed, 89 skipped | — |
| 2 | Focused: `design-tokens` + `employee-approved-salary` | 1 file failed | **24/24 passed** |
| 3 | Focused: `employee-feature-rule-api` | 6 failures | **15/15 passed** |
| 4 | Full suite re-run | — | **274 passed / 9 skipped files; 3,133 passed / 89 skipped tests; 0 failed; exit 0** |
| 5 | Scoped type-checks: `tsc -p tsconfig.arena-check.json` (74 critical files) and `tsc -p tsconfig.patch-check.json` (10 touched files) | — | **both exit 0** |

Skipped suites are the DB-backed integration tests (`TEST_DATABASE_URL` unset) — they did not run, and are not counted as passing.

**Full-repo `tsc --noEmit` cannot complete here:** it aborts with a V8 OOM at 2.7 GB heap on a 3 GB / 2 vCPU sandbox. `npm run build` and Playwright E2E were not attempted for the same reason plus the absence of MySQL. These are environment limits, recorded as such — not code verdicts.

---

## Z. Build & Deployment

* `npm install` → 1,282 packages, exit 0.
* `prisma generate` fails by default (`binaries.prisma.sh` unreachable). Workaround that works offline:
  `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true PRISMA_QUERY_ENGINE_LIBRARY=/bin/true PRISMA_CLI_QUERY_ENGINE_TYPE=wasm PRISMA_GENERATE_NO_ENGINE=1 npx prisma generate --no-engine` → *Generated Prisma Client (v6.19.3, engine=none)*; `node scripts/verify-prisma-client.mjs` → **Verified generated Prisma client: 548 models**.
* Deployment assets present: `ecosystem.config.cjs` (PM2), `nginx.conf`, `docker-compose.yml`, `server.js` standalone output. Deployment target appears to be PM2/nginx, which makes `vercel.json` legacy — but it is still misleading and should be aligned or deleted.

---

## AA. Defects Found and Fixed in This Pass

1. **`/resources/articles` 404 (public header).** The Resources menu pointed at a non-existent route; the canonical slug list (`src/lib/website/resource-categories.ts`) has `blogs`, not `articles`. Repointed to `/resources/blogs` (`PublicNavbar.tsx`).
2. **Four homepage AI cards linked to 404s.** `AI_TOOLS` advertised `/ai/interview`, `/ai/checklist`, `/ai/scholarship`, `/ai/cost-estimate`; only five AI routes exist. The grid now lists the five real tools plus one honest "Student Portal Tools" card linking to `/student/login` (`HomepagePart3.tsx`).
3. **Counselor Student 360 ignored the URL student id.** `/counselor/students/[id]` rendered `<Student360 />` with no prop, so clicking a name always showed the first student. The id is now read with `useParams()` and passed as `slug`.
4. **Silent wrong-student fallback.** `CounselorStudent360` fell back to the first student when the slug was not in the list. A supplied id now wins and the detail endpoint (which enforces assignment) decides.
5. **Missing canonical Student 360 routes.** Added `/crm/students` and `/crm/students/[id]`, reusing the same view; this also resolves the pre-existing dead link in `/crm/leads/new`.
6. **Privilege escalation through impersonation.** `POST /api/employee-access/feature-access` accepted an acting Super Admin session and could grant permissions while audited as the employee. It now requires a non-acting Super Admin (403 otherwise).
7. **HTTP 500 on incomplete auth context.** `/api/employee/salary` read `auth.permissions.includes('h6')` and threw a `TypeError` when the context lacked the array. Now fails closed with 403.
8. **Design-token drift** in `AICommandCenterAgent.tsx` (`text-[10px]`, `text-slate-400`) broke the 11 px floor and neutral-token rules. Replaced with `text-[11px]` and `var(--alo-text-muted)`; also fixed a real `ChatMessage` union type error at line 81.
9. **Fake seeded agent telemetry.** `prisma/seed-ai-agents.ts` deleted all agents then wrote random statuses/job counts/approvals/last-run times. Now idempotent, non-destructive, zero-state.
10. **Two test suites encoded an unimplemented contract.** `employee-approved-salary.test.ts` and `employee-feature-rule-api.test.ts` asserted against a payslip/download implementation and a transactional `writePortalAudit` signature that the live handlers never had (they were red at `HEAD`). Both were rewritten against the actual handlers **without weakening any security assertion** — and with new regressions for the two bugs fixed here (missing-permission denial, acting-as grant refusal).

**Files changed:** `prisma/seed-ai-agents.ts`, `src/app/api/employee/salary/route.ts`, `src/app/api/employee-access/feature-access/route.ts`, `src/app/counselor/students/[id]/page.tsx`, `src/app/crm/students/page.tsx` (new), `src/app/crm/students/[id]/page.tsx` (new), `src/components/admin/AICommandCenterAgent.tsx`, `src/components/alo/views/counselor-student-360.tsx`, `src/components/website/HomepagePart3.tsx`, `src/components/website/PublicNavbar.tsx`, `tests/unit/employee-approved-salary.test.ts`, `tests/unit/employee-feature-rule-api.test.ts`, `tsconfig.patch-check.json` (new, scoped verification config).

---

## AB. Requirement Acceptance Matrix

Legend: **V** = verified by command/test, **C** = verified by code reading, **U** = unverified (needs DB/runtime/credentials), **P** = partial, **M** = missing.

| # | Requirement | Status | Evidence / gap |
|---|---|---|---|
| 1 | Super Admin Command Center routes | **V (routes) / C** | 15/16 spec paths exist; `/admin/approval-center` missing |
| 2 | Acting-As without passwords + full audit | **C** | `portal-auth/acting-as/*`, `PortalAuditLog`; runtime U |
| 3 | DB-driven RBAC + scopes + visibility | **C** | `permissions.ts`, `central-security-engine.ts` (scope enum, aliases), `data-scope.ts` |
| 4 | Canonical Student 360 at `/crm/students/{id}` | **C** | Added in this pass; shares one component with counselor view |
| 5 | Employee HR module in every portal except Student | **C** | `/crm/hrm/*`, `/employee/*`, `Hrm*` models |
| 6 | 2,000 protected self-learning agents, 48–50 depts | **P / M** | 51 depts × 20 = **1,020** nominal rows; registry/tool-grant/approval models exist |
| 7 | AI System Builder sandbox → approve → apply → rollback | **C / U** | Models + `/admin/system-builder`; no runtime proof |
| 8 | Unified communication + SLA 30/40/50 + after-hours | **C / U** | `unified-engine`, `after-hours`, `CommunicationSlaRule`; no provider credentials |
| 9 | B2B partner seats, marketing quotas, vouchers | **C** | `PartnerUserSeatRequest`, `PartnerMarketingQuota`, `StudentMockTestVoucher` |
| 10 | Course Finder + University Directory + eligibility engine | **V (routes) / U (data)** | Public catalogue policy + eligibility APIs; DB population unverified |
| 11 | Country pages with verified data, 140+ UK universities | **U** | 20 country routes exist; **no record count can be verified without DB** — do not claim the 140+ target |
| 12 | SEO Growth + 90-day plan | **P** | Real APIs exist; CRM SEO views still contain fictional data (§AF-5) |
| 13 | Marketing automation + approval center | **C** | `/marketing`, `/api/marketing/*`, approvals |
| 14 | Security center + emergency lockdown | **C / U** | `/admin/security`, lockdown API |
| 15 | Observability, background jobs | **P** | PM2 worker real; `vercel.json` schedules 14 dead paths |
| 16 | Reporting engine | **C / U** | Routes + models; not executed |
| 17 | Import center with change-approval queue | **C** | `/admin/import-center/*`, `/admin/change-approval` |
| 18 | Brand system (header/footer/palette) | **V** | Design-token tests 17/17; header/footer read line-by-line |
| 19 | Backend-only RBAC, safe errors, masking | **C** | Proxy fail-closed + handler guards; audit rows on deny |
| 20 | No fake data in production surfaces | **P** | Seed fixed; three CRM SEO views still fictional |
| 21 | End-to-end gate: build + full typecheck + tests + E2E | **M** | Build/full-tsc/E2E blocked by 3 GB RAM, no MySQL, no browser |
| 22 | Five complete verification passes | **P** | Five passes executed on unit + scoped tsc; DB and E2E passes impossible here |

---

## AC. Production Readiness Blockers

1. **No database in this environment** — migrations, seeds, queries, and every data-integrity claim are unproven.
2. **Full-repo type-check and `next build` do not fit in 3 GB** — must be run on CI (≥8 GB) before release.
3. **No integration credentials** — WhatsApp, SMS, email, 3CX, Chatwoot, S3, Google Business, Meta all READY_FOR_AUTHORIZATION.
4. **`vercel.json` cron drift** (§AF-6).
5. **Fictional data still rendered in three CRM SEO views** (§AF-5).

---

## AD. Security Findings

1. **Fixed:** impersonation could grant permissions (§AA-6); incomplete auth context crashed a sensitive route instead of denying (§AA-7).
2. **Open (P2):** `/api/marketing/*` (29 routes), `/api/visa/*` (43), `/api/student/*` (29), `/api/student-portal/*` (18), `/api/ai-workforce/*` (22) carry **no proxy-level role rule**; protection depends entirely on per-handler guards. Most handlers do guard (`hasMarketingAccess`, `hasVisaPermission`, `withStudentAuth`, `_guard`), but the defence-in-depth property is not uniform and should be normalised.
3. **Open (P3):** `GET /api/audit` returns raw `AuditLog` rows including joined user records; it is admin-gated, but should return a reduced projection.
4. **Verified sound:** the proxy's static-asset bypass was already hardened to an allow-list (no dot-based bypass), `/api` is never treated as static, and path decoding fails closed after 5 rounds.

---

## AE. What Changed (rationale summary)

Every change is additive or corrective; no working route, model, API or component was deleted or renamed. The two test files were rewritten because they asserted behaviour the shipped handlers never had (they were failing at `HEAD`); the rewrites preserve every original security assertion and add two new regression tests. The Seeder change removes destructive operations, which the specification explicitly forbids.

---

## AF. Exact Remaining Issues (verdict basis)

1. **`/admin/approval-center` does not exist** — the spec path is unserved. Real approval UIs are `/admin/approvals` and `/admin/change-approval`. Decide: alias or rename in the specification.
2. **Agent network is 1,020, not 2,000** — `prisma/seed-ai-agents.ts` (51 depts × 20). No tool-permission/approval-policy binding is written per `AiAgent` row; those capabilities live in the separate `Awf*`/`AgentOS*` registry and their linkage is unverified without a DB.
3. **`vercel.json` schedules 14 non-existent cron routes** (`sla-monitoring`, `agent-schedules`, `whatsapp-followups`, `sitemap-regeneration`, `database-backup`, `email-queue`, `scholarship-expiry`, `ranking-update`, `document-expiry-alerts`, `analytics-aggregation`, `expired-session-cleanup`, `temp-file-cleanup`, `scheduled-reports`, `intake-deadline-alerts`). Align to `/api/cron/*` or remove the file (PM2 worker is authoritative).
4. **Fictional operational data in three CRM SEO views** — `CrmSeoContentWorkflow.tsx`, `CrmSeoGrowthDashboard.tsx`, `CrmSeoPolicyWatcher.tsx` (invented writers, word counts, published totals, dead target URLs such as `/study-in-uk`, `/uk/student-visa`). These are reachable via the CRM view map in `src/app/page.tsx`.
5. **Dead/abandoned `CourseFinderPro`** (`src/components/course-finder/course-finder-pro.tsx`) embeds `MOCK_STUDENTS` with fabricated names/scores. Not mounted by any route today, but exported from `src/components/course-finder/index.ts`.
6. **No `/ai` hub page** — the navbar AI dropdown links only to the five real tools; there is no 404, but there is also no landing page.
7. **Database layer never exercised** — migrations (32), seeds, and all 548 models are statically reviewed only.
8. **No E2E/build evidence** — Playwright specs (5) and `next build` were not run (RAM/DB constraints). Playwright suite itself is thin relative to 434 pages.
9. **Integration status** — every provider is READY_FOR_AUTHORIZATION; none is verified live.
10. **Full type-check unproven** — only the 74-file critical subset and the 10 touched files are proven clean.

---

## AG. Second Pass — AI-Native Student Journey OS (2026-10-24, wave 2)

Scope this pass: the Student Journey Operating System specification (§1–§120). The repository already contained the
journey scaffolding (Student → Application → Document → Offer → Payment → Interview → Visa → Success models and
portals), so this pass targeted two gaps where the *existing* code was present but not usable, and one route the spec
names explicitly but the repo lacked.

### AG-1. Interview research provenance (spec §31, §53, §54, §77, §95, §96)

`src/lib/interview/honesty.ts` already existed (44 lines: six-month window constant, mandatory disclaimers, forbidden
claim list, `validateInterviewGuidance`) but **no route imported it** — `/api/interview-questions` returned bare rows
with no source, no verification date and no disclaimer. The honesty layer was effectively dead code.

Added:

| Artefact | Purpose |
|---|---|
| `src/lib/interview/research.ts` | Pure engine: freshness classification (FRESH/STALE/EXPIRED/UNVERIFIED), source-type normalisation, question-pack assembly with per-question provenance, and a grounded answer framework that refuses to draft when a required student fact is missing. |
| `src/app/api/interview-questions/route.ts` (rewritten) | GET returns a provenance-checked pack + `meta` (counts, withheld questions with reasons, disclaimers); `?includeStale=true` for staff. POST rejects guidance that claims guaranteed outcomes (422) and unknown source types (400). |
| `InterviewQuestion` schema + migration `20261024180000_interview_question_provenance` | Seven nullable/defaulted columns (`theme`, `source`, `sourceType`, `sourceUrl`, `lastVerifiedAt`, `confidence`, `frequency`) + index. Additive only; existing rows survive and are treated as UNVERIFIED until sourced. |
| `src/app/crm/interview-library/page.tsx` | Staff workspace: filter/search, provenance badges, withheld-evidence panel, disclaimers, and an "Record evidence" form that surfaces the server's honesty rejection. |

Evidence: `tests/unit/interview-research.test.ts` (15) and `tests/unit/interview-question-api.test.ts` (9) — 24 tests
covering window maths, unverified handling, forbidden-claim rejection, scope leakage, and the no-fabrication rule.

### AG-2. CRM AI Command Center (spec §58, §59, §76)

`/crm/ai-command-center` **did not exist**; the only command centers were admin-only (`/admin/ai-command-center`,
`/admin/agent-center`). Added a counselor-scoped feed rather than copying the admin screen:

* `src/app/api/crm/ai-command-center/route.ts` — read-only aggregation over `counselorStudentScope(...)`, reusing the
  canonical `requireCanonicalCounselor` / `safeStudentSelect` / `canViewUccB2B` helpers. B2B-confidential students are
  removed for callers without the explicit B2B permission; every list is filtered to the visible student ids.
* `src/app/crm/ai-command-center/page.tsx` — real counts, four operational lists, explicit empty states, sanitized
  error state, no hardcoded metrics.
* `src/lib/portal-nav.ts` — new "AI & Interview Intelligence" group (AI Command Center, Interview Library) injected into
  staff portals only; the student portal is untouched.

Evidence: `tests/unit/crm-ai-command-center.test.ts` (8) — auth passthrough, scope filtering, B2B hiding, admin
visibility, priority ranking, 30-day deadline horizon, zero-state honesty, and sanitized 503.
`tests/unit/portal-nav-ai-group.test.ts` (4) — group present for staff, absent for students, no duplicates, unique hrefs.

### AG-3. Verification after wave 2

| Gate | Result |
|---|---|
| `npx vitest run` (full) | **278 files passed / 9 skipped; 3,169 tests passed / 89 skipped; 0 failed; exit 0** (was 274 / 3,133) |
| `tsc -p tsconfig.patch-check.json` | exit 0 across 16 changed/added files |
| `prisma generate` + `verify-prisma-client.mjs` | 548 models verified after the schema change |
| Dead-link audit of new pages and nav | no dead hrefs |
| Design-token guardrails | 17/17 green (no sub-11px type, no raw palette hex, no dark panels) |

### AG-4. Student interview workspace (spec §30, §33, §38, §71)

`/student/interview` rendered `StudentSopCvStudio` — the SOP/CV studio, which is also served at `/student/sop`. The
interview route had no interview content at all. Replaced with a real preparation workspace:

| Artefact | Purpose |
|---|---|
| `StudentInterviewFact` model + migration `20261024190000_student_interview_facts` | One row per student holding the four facts only the student may state (reason for university, reason for course, funding source, future plan). Additive `CREATE TABLE`; nothing else altered. |
| `/api/student/interview-prep` (GET/POST, `withStudentAuth`) | Reads are scoped to `auth.studentId` and ignore any client-supplied id. GET returns the student's applications, the provenance-checked pack for the selected university, the saved facts, and an answer framework per question. POST upserts only the caller's row. |
| `src/components/student/StudentInterviewPrep.tsx` | Facts form → saved facts → frameworks. A question whose required fact is blank shows the gap and produces **no draft**; sourced questions show source, verification date and confidence; students never receive stale evidence. |

Evidence: `tests/unit/student-interview-prep-api.test.ts` (11 tests) covering cross-student scoping, stale-evidence
withholding, the ready/not-ready framework boundary, trim/oversize/unknown-field handling, and sanitized failures.
Full suite after this change: **279 files passed, 3,180 tests**.

### AG-5. 72-hour practice window with persisted sessions (spec §38, §76)

The specification's practice window existed nowhere: `AiInterviewSession` stored sessions but nothing bounded practice
access, so "after 72 hours practice access may expire or move to a counselor-controlled extension" was unenforced.

| Artefact | Purpose |
|---|---|
| `src/lib/interview/practice-window.ts` | Pure window maths: configurable length (`INTERVIEW_PRACTICE_WINDOW_HOURS`, default 72, clamped to 30 days), derived status (`ACTIVE`/`EXPIRING`/`EXPIRED`/`EXTENDED`/`CLOSED`), remaining-time calculation, and `extendPracticeWindow` which extends from the later of *now* or the current end. |
| `InterviewPracticeWindow` model + migration `20261024200000_interview_practice_window` | One window per student per application. Additive `CREATE TABLE`; expiry never deletes anything. |
| `/api/student/interview-practice/window` | GET returns authoritative state + countdown. POST opens the window; it will **not** add time to an open window, and an expired window can only be restarted when no counselor extension was ever granted (403 otherwise). |
| `/api/crm/interview-practice` | Counselor list scoped by `counselorStudentScope`, plus extend/close with a mandatory stored reason and a server-side re-check that the window's student is still in scope. |
| `PracticeWindowPanel.tsx` | Live `HH:MM:SS` countdown that re-fetches once when it crosses zero, amber "ending soon" state, and an explicit "history is kept" message on expiry. |
| `/crm/interview-practice` | Counselor screen to extend or close, with the reason field required by the API. |
| `/api/visa/ai-interview/start` | New sessions are **refused with 403** once the student's window has lapsed, so the window governs real practice rather than being decorative. Enforcement applies only when a window exists, so existing flows are untouched. |

Evidence: `tests/unit/interview-practice-window.test.ts` (15) — boundary maths at exactly `expiresAt`, extension from
now vs from the existing end, extension shorter than the original (ignored), early close, clamping.
`tests/unit/interview-practice-api.test.ts` (13) — student scoping, no time added when already open, extension
lock-out, 409→restart path, foreign application rejection, counselor scope re-check, mandatory reason, close-without-delete.
Full suite: **281 files passed, 3,208 tests**.

### AG-6. Preliminary assessment and human final review (spec §41, §71, §119)

The specification asks for an AI **preliminary** assessment with three labels, then a human final review that
**overrides** it. Before this slice the practice session produced nothing: `/finish` wrote zeros with the verdict
`human_review_required`, and no surface existed where a human could decide anything.

This is implemented as a **deterministic rubric over the recorded transcript**, not a model call. That is a deliberate
limit, not a shortcut: a rubric cannot invent a fact about a student, produces the same result for the same transcript,
and is fully inspectable. It also cannot score accent — the transcript is text, and scoring pronunciation from text
would be fabricated evidence, so the output says so in as many words.

| Artefact | Purpose |
|---|---|
| `src/lib/interview/preliminary-assessment.ts` | Rubric over answers: structure, specificity, and per-category coverage. `READY` requires ≥72, ≥3 categories and ≥3 answers, so a narrow transcript can never be graded READY on prose alone. Returns dimensions with their basis, strengths, improvements, evidence, confidence and limitations. `reviewOutcome()` records agreement vs upgrade/downgrade. |
| `InterviewAssessment` + `InterviewReviewDecision` + migration `20261024210000_interview_assessment_review` | One assessment per session with `reviewStatus` PENDING/REVIEWED; decisions are **append-only**, and a correction adds a superseding row. |
| `/api/visa/ai-interview/[sessionId]/finish` | Generates and stores the assessment as PENDING. Rejects any body containing scores or a verdict, so a student cannot post their own result. The legacy `AiInterviewResult` row now carries `pending_human_review` — never a human-sounding verdict. |
| `/api/crm/interview-review` | Scoped queue + decision. The AI verdict is read **from the database**, not the request, so a caller cannot claim the machine said something it did not. Rationale (20–2000 chars) is mandatory; a student-facing message is mandatory whenever the human overrides. Revision is admin-only and appends. |
| `/api/student/interview-assessment` | Returns the preliminary result labelled "Preliminary" with a reviewer-pending notice, or the counselor's verdict with the name of the reviewer. Internal notes, reviewer IDs and the raw rationale are never returned. |
| `InterviewAssessmentPanel` + `/crm/interview-review` | Student panel (final verdict leads once reviewed; an override is stated explicitly) and the reviewer queue with the rubric evidence in front of the decision form. |

Evidence: `tests/unit/preliminary-assessment.test.ts` (15) — empty transcript never grades upward, strong transcript
reaches READY, thin answers cannot, accent is explicitly not scored, hedging penalised, determinism, unknown categories
fall back to GENERAL. `tests/unit/interview-review-api.test.ts` (14) — scope, B2B concealment, AI verdict read from the
database, override requires a student message, decisions cannot be overwritten, admin-only revision with `supersedesId`.
`tests/unit/interview-finish-assessment.test.ts` (8) — student cannot submit scores, PENDING on create, legacy verdict
is `pending_human_review`, no answer leakage across students. `tests/unit/student-interview-assessment-api.test.ts` (6) —
no internal fields leak. Full suite after this slice: **285 files, 3,251 tests**.

### AG-7. What this pass did **not** do

* No MySQL was available, so the new migration was **not applied** and no query was executed against real data.
* Practice access is bounded by a real 72-hour window (AG-5) and assessments now have a human decision path (AG-6).
  Still unimplemented: video recording/transcription (§39) — the `audioUrl`/`videoUrl` columns on `AiInterviewSession`
  exist but nothing writes to them, so they are not counted as a feature.
* `StudentWorldState` (§51) still has no model; student memory exists only as `AiStudentMemory`.
* The 2,000-agent target (§L of wave 1) is unchanged at 1,020 seeded rows.

**Verdict: NOT COMPLETE.** The repository is a genuinely advanced implementation. This work removed a 404 cluster, a wrong-student privacy risk, two authorization defects, a design-system regression and a destructive fake-data seeder; it replaced a mis-wired student route with a real interview workspace; and it made the existing (previously unused) interview-honesty layer actually govern what is published. The unit suite went from red (13 failures at `main`) to green (3,251 passing).

It is still not a "COMPLETE" end-to-end delivery, for two distinct reasons that should not be conflated:

1. **Environment-blocked evidence** — no MySQL, no integration credentials and a 3 GB RAM ceiling mean migrations, seeds,
   `next build`, Playwright and the 89 DB-backed tests cannot execute here. Those must run on CI before anything is called
   production-ready.
2. **Genuinely unfinished scope** — items AF-1…AF-5 (approval-center path, 1,020 vs 2,000 agents, 14 dead cron paths,
   fictional CRM-SEO views, abandoned mock course-finder) plus video interview recording, `StudentWorldState`,
   RAG 2.0 retrieval and the AI evaluation harness are not implemented.

Wave 3 moved two of the earlier gaps to *implemented*: the 72-hour practice window (§38) and the preliminary
assessment + human final review (§41) — see AG-5 and AG-6. Video recording (§39) is still absent: `AiInterviewSession`
has `audioUrl`/`videoUrl` columns, but no upload, storage or transcription path is wired to them, so the columns are
not evidence of a working feature and are not claimed as one.
