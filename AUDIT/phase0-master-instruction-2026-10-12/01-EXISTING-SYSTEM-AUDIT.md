# 01 — Existing System Audit Report

**Date:** 2026-10-12 · **Commit under audit:** `be9081f` on `arena/1cf1296a-alo-web-crm-tech` (base `main` @ `e4f26a1`)
**Method:** static inventory + live test execution + cross-reference of dated prior audits. Every claim has a path or command behind it.

---

## Executive summary

The repository is not a greenfield project. It is a large, mostly-built platform: **532 Prisma models**, **407 pages**, **903 API routes**, **177 test files**, 4 GitHub workflows, PM2/Caddy/systemd and Docker deployment stacks, 14 named roles with user guides, and an AI workforce stack (orchestration, approvals, RBAC, knowledge, model registry) that already models 100 departments / 2,000 agents. The 2026-10-01 full audit (`docs/ALO-EDUCATION-FULL-AUDIT.md`) and the 2026-10-11/12 `AUDIT/` series confirm this inventory and record substantial prior remediation.

The true Phase 0 problem is **not "build it"** — it is: (1) consolidate duplicated subsystems, (2) close the remaining security/compliance gaps that Master Instruction §7/§10/§13 make non-negotiable, (3) prove the unprovable-in-sandbox gates on real infrastructure (Prisma engines, MySQL, build, Hostinger), and (4) execute the data-quality clean-up the catalogue audits demand. Today's live suite: **1911 passed / 14 failed / 35 skipped**, with every failure attributable to the sandbox's blocked Prisma engine download.

---

## A. What already works (verified with evidence)

| Area | Evidence |
|---|---|
| Test suite health after the 2026-10-12 final check | `npx vitest run` → **1911 passed / 14 failed / 35 skipped**; the 14 failures are all "Prisma client not generated" import blocks (`AUDIT/final-check-2026-10-12/full-suite-*.txt`) |
| Public website pages (home, about, services, destinations, universities, courses, scholarships, blog, events, news, FAQs, contact, policies, guides, language-prep, compare, eligibility) | `src/app/**` page inventory (407 pages); `AUDIT/ARENA-PAGE-INVENTORY.csv`; `WEB_CRM_FULL_AUDIT_20260915.md` |
| Course Finder + public catalogue policy (published + VERIFIED + https source + open-conflict exclusion) | `src/lib/public-catalog.ts`, `src/lib/course-finder/public-content-page-policy.ts`; enforced in homepage, search, sitemap, course/university pages; locked by `tests/unit/catalogue-phase1-review-publication.test.ts` (17 tests) and `sitemap-db-runtime.test.ts` |
| Sitemap/SEO runtime (dynamic, de-duplicated, policy-filtered) | `src/app/sitemap.ts`, `src/app/robots.ts`, admin `/admin/seo`; tests above |
| Student portal (46 pages: dashboard, applications, documents, visa, mock tests, SOP/CV, payments, messages, timeline) | `src/app/student/**`; `STUDENT_PORTAL_USER_GUIDE.md` |
| B2B partner portal (22 pages) + tenant isolation | `src/app/partner/**`, `partner-admin/**`; `tests/integration/partner-b2b-security.test.ts` (regression suite documents and locks the fixed tenant defects); `docs/B2B_PARTNER_TENANT_SECURITY.md` |
| CRM web (55 pages) + counsellor workspace (26) + employee portal (38) + application-manager (19) | `src/app/crm/**`, `counselor/**`, `employee/**`, `application-manager/**` |
| Admin/Super-Admin control surface (83 pages: AI command center, agent center, approvals, audit logs, security, permission matrix, import center, data review, integrations) | `src/app/admin/**`; `SUPER_ADMIN_USER_GUIDE.md`, `AI_COMMAND_CENTER_USER_GUIDE.md` |
| RBAC + session security (NextAuth + PortalSession bridge, `withAuth`/`authenticateRequest`, Permission/Role/PortalRole families, data-scope/employee-access engines) | `src/lib/auth.ts`, `auth-middleware.ts`, `src/proxy.ts`, `access-control*`, `employee-access-engine.ts`; `SECURITY-AUDIT.md`; `tests/unit/partner-marketing-api.test.ts` + catalogue security suites lock same-origin and role gates |
| Same-origin mutation enforcement pattern (`mutationOriginAllowed`) on sensitive APIs | `src/lib/request-origin.ts`; applied to import, catalogue, source-log, data-quality and (2026-10-12) partner-marketing mutations |
| AI workforce stack (departments, agents, versions, prompt versions, skills/tools grants, workflows, runs, approvals, memory, knowledge chunks, audit, test cases; deterministic engine fallback) | `src/lib/ai-workforce/*` (24 modules), `src/lib/ai-workforce/seed.ts` (idempotent seed), `prisma/schema.prisma` `Awf*` models |
| 2,000-agent registry asset | `agents/agent_registry_1020.json` (`total_agents: 2000`) |
| AI model registry + router with private-data-first local routing and deterministic fallback | `src/lib/ai-models/registry.ts`, `src/lib/model-router.ts` (`local` before cloud; `fallback` provider; no-provider error), `src/lib/ai-workforce/runtimes.ts` (alo-local-primary/secondary = Ollama/llama.cpp/vLLM-style OpenAI-compatible endpoints) |
| WhatsApp Cloud API integration modules (webhooks, media ingestion, broadcasts, follow-ups, archives, Chatwoot inbox) | `src/lib/whatsapp-*.ts`, `wacrm-broadcast.ts`, `chatwoot-inbox.ts`; schema `WhatsAppOfficialNumber`, `WhatsAppMessageArchive`, `WhatsAppRetryQueue`, `WhatsAppAnalyticsDaily` |
| Email stack (SMTP config, outbox/suppression/events, campaigns vs transactional separation in schema) | `.env.example` SMTP block; `EmailOutboxItem`, `EmailSuppression`, `EmailEvent`, `EmailCampaign` |
| Catalogue security remediation (K1–K4) and course-finder apply/review workflow | `AUDIT/catalogue-phase1-2026-10-12/PHASE1-RESULTS.md`, `AUDIT/course-finder-2026-10-12/REMEDIATION-RESULTS.md`; locked by 79 dedicated tests |
| CI (quality gates + MySQL integration job), deploy-production/recovery, health-monitor workflows | `.github/workflows/*` |
| Deployment tooling: PM2 standalone server, Caddy + systemd + backup/restore/rollback scripts, docker-compose (app + MySQL + nginx) | `ecosystem.config.cjs`, `deploy/ubuntu/*`, `docker-compose.yml`, `deploy-build/` |
| Role inventory + user guides for 14 roles | `ROLE_INVENTORY.csv`, `*_USER_GUIDE.md` |
| Ops documentation (deployment, rollback, testing, troubleshooting, security guides) | root `*.md` set; `docs/` (~100+ documents incl. prior audits) |

## B. What is incomplete (Master Instruction requirements still open)

| # | Item | Section | State |
|---|---|---|---|
| B1 | **No-paid-AI-API enforcement.** Router still *configures* GROQ/OPENROUTER/ZAI/OPENAI cloud keys as fallbacks (`src/lib/model-router.ts`, env refs `GROQ_API_KEY`×15, `OPENROUTER_API_KEY`×9, `OPENAI_API_KEY`×3). Local runtimes are first-priority, but nothing fail-closes when a paid key is present. | §10 | **PARTIAL** |
| B2 | **Malware scanning before document availability** — no scanner integration found (`clamav|virusScan|scanFile` → no matches in `src/lib`). | §7 step 4 | **FAIL** (missing) |
| B3 | **Private short-lived signed URLs for documents** — no presign/signed-URL code found; presumed authenticated download service exists but download authorization is **NOT VERIFIED** end-to-end. | §7 | **PARTIAL / NOT VERIFIED** |
| B4 | **MFA** — no TOTP/MFA implementation found for admin/SUPER_ADMIN roles. | §13 | **FAIL** (missing; §13 allows optional→mandatory by risk, so this is a policy decision + build) |
| B5 | **Catalogue data quality.** Repository CSV sets are templated/fabricated (`AUDIT/course-finder-2026-10-12/UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md`, `SYNTHETIC-CATALOGUE-ARCHIVE.md`); **no verified catalogue data** has been imported. Owner decisions still pending (disposition of git-tracked fabricated CSVs). | §3, §14 | **FAIL** (data) |
| B6 | **Schema default `CoursePage.verificationStatus = "VERIFIED"`** (and `approvalStatus = "PUBLISHED"`) still unsafe-by-default; fixing needs an authorised migration. | §14 | **PARTIAL** (remediation of paths done; default not changed — migration gate) |
| B7 | **~85 routes rely on the proxy alone** (defence-in-depth incomplete after K4). | §13 | **PARTIAL** |
| B8 | **Backup authority (K6) and restore tests** on production — scripts exist (`deploy/ubuntu/backup.sh`, `restore.sh`); actual production backup verification is **NOT VERIFIED**. | §14, §17 | **NOT VERIFIED** |
| B9 | **Hostinger Cloud runtime verification** (Node version, persistent workers, connection limits, GPU) — explicitly demanded by §2.1; no Hostinger plan evidence in repo. | §2.1 | **BLOCKED** (needs host/plan facts) |
| B10 | **Self-hosted model deployment** — router/runtime support exists; no evidence of an actual Ollama/vLLM service running, no evaluation dataset results (§17 AI tests: Bangla/English quality, structured output, injection resistance …). | §10, §17 | **NOT VERIFIED** |
| B11 | **Identity-model reconciliation debt** — parallel User/PortalUser, Student/AloStudent/PortalStudentProfile families (flagged in `docs/ALO-EDUCATION-FULL-AUDIT.md`). | §14 | **PARTIAL** |
| B12 | **Live integrations** (WhatsApp Business account, Facebook/Instagram/LinkedIn, SMTP, Chatwoot) — code exists; live credential/console state **NOT VERIFIED**. | §8, §15 | **NOT VERIFIED** |
| B13 | **Merge-workflow for duplicate records**, intake unique-index migration, VERIFIED-downgrade policy — owner decisions outstanding (`AUDIT/course-finder-2026-10-12/MERGE-WORKFLOW-DESIGN.md`, `INTAKE-UNIQUENESS-PROPOSAL.md`). | §14 | **PARTIAL** (designs exist) |
| B14 | **Production `next build` / full `tsc` evidence in this environment** — blocked by Prisma engine download here; CI's mysql-integration job and a normal dev machine can clear it. | §17 | **BLOCKED** (this sandbox only) |

## C. What is duplicated (consolidation candidates — do NOT rebuild)

| # | Duplication | Evidence | Disposition proposal (Phase 1 decision) |
|---|---|---|---|
| C1 | **AI agent registries ×6 families:** `AiAgent`, `AiAgentRegistry`, `AgentDefinition`(+AgentRuntime/Task/Memory/…), `AwfAgent`(+Awf* workforce), `AiEmployee`/`EnterpriseDepartment` (100×20=2,000 seeded), `AgentDepartment`. | `prisma/schema.prisma` model list | Designate `Awf*` as canonical runtime + keep one registry view; others become read-models/aliases. Decision required before any new registry is created (§9). |
| C2 | **Historical parallel trees:** `alo-education-web-crm-final/` (1,521 files, export), `alo-cpanel/` PHP legacy (self-declared legacy), `backend/` Python AgentOS, `mini-services/` (3 Bun services). | `docs/ALO-EDUCATION-FULL-AUDIT.md` §A; tree listing | Not deployment authority. Quarantine/document; exclude from scans/CI; remove only with explicit approval. |
| C3 | **Route/page proliferation across old+new portal shells** (counselor legacy + CRM dashboards; two compare surfaces now unified; legacy communication endpoints delegating to canonical). | `tests/unit/partner-marketing-compatibility.test.ts` (legacy URLs delegate to canonical route); `tests/unit/legacy-lead-surfaces.test.ts` | Keep delegation pattern; finish routing table (§05 plan) so every legacy URL delegates or 410s. |
| C4 | **Report/audit doc sprawl** — dozens of overlapping READY/AUDIT/REPORT docs at repo root. | root listing | Archive to `docs/archive/` in a later, approved housekeeping change (not Phase 0). |

## D. What is insecure (open or recently remediated — regression-locked)

**Remediated and locked by tests (2026-10-11/12 series, merged PR #4, verified again today):** approval paths could mark content VERIFIED (K1); mass-assignment of `verificationStatus` on CoursePage (K2); source-log/data-quality readable/writable by any student (K3); dotted-path proxy bypass (K4); import endpoints trusted client role claims; partner-marketing: prompt-claim sanitization gaps, provider-error leak, no same-origin mutation check, no optimistic-concurrency approve, fabricated schedule/publish success (fixed in `be9081f`, all 11 tests green). Details: `AUDIT/final-check-2026-10-12/FINAL-CHECK-REPORT.md`, `AUDIT/catalogue-phase1-2026-10-12/PHASE1-RESULTS.md`.

**Still open:**

| # | Issue | Severity | Where |
|---|---|---|---|
| D1 | Schema defaults make any create path that omits verification fields inherit `VERIFIED`/`PUBLISHED` (incl. the AI `DEPLOY_CONTENT` fallback branch). | High | `prisma/schema.prisma` CoursePage; `AUDIT/catalogue-phase1…PHASE1-RESULTS.md` remaining risk 1–2 |
| D2 | Legacy published-but-unverified `*Page` rows still surface on `approvalStatus=PUBLISHED`-only listings (homepage/search use the strict policy now; other legacy surfaces may not). | Medium | same report, remaining risk 4 |
| D3 | No malware scanning on uploads (see B2). | High (§7) | Document Center |
| D4 | No MFA on privileged roles (see B4). | Medium–High (§13) | auth |
| D5 | Origin checks depend on `NEXTAUTH_URL` matching the real deployment origin. | Medium | `src/lib/request-origin.ts` |
| D6 | Existing data may contain rows marked VERIFIED by the old code; needs a read-only DB audit (was BLOCKED without DB). | Medium | needs DB access |
| D7 | Fabricated CSVs remain in git and could be re-imported by future tooling (runtime loaders are guarded by `synthetic-data-guard.ts`, seed by `ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED`). | Medium | repo root CSVs |
| D8 | AI tool permissions: workforce RBAC exists (`ai-workforce/rbac.ts`, `security.ts`, tool grants), but live enforcement evidence under adversarial tests (prompt-injection, cross-tenant retrieval) is **NOT VERIFIED** (§17 AI tests). | Medium (until proven) | AI stack |

## E. What cannot be verified in this environment

| Item | Why | Command/procedure to clear |
|---|---|---|
| `prisma generate` → `next build` → full `tsc` | `binaries.prisma.sh` unreachable from audit sandbox | On CI/dev: `npx prisma generate && npm run typecheck && npm run build` (CI `mysql-integration` job also covers) |
| MySQL integration suites (35 skipped) + transaction/isolation proof | no disposable MySQL here | `npm run test:integration` against ephemeral MySQL (CI job exists) |
| Production backup/restore, deploy/rollback runbooks | no production access (and none permitted in Phase 0) | Phase 6 checklist with owner-approved window |
| Hostinger runtime constraints | no hosting facts provided | Owner supplies plan/spec; Phase 1 verification task |
| Live WhatsApp/Meta/SMTP/Chatwoot consoles | no credentials/console access | Phase 3 with owner-supplied credentials in a secure store |
| Self-hosted model quality (Bangla/English), latency, licenses | no GPU/runtime here | Phase 4 evaluation protocol (§05 plan) |
| Real catalogue data correctness | none imported; repo datasets fabricated | Owner decision + Phase 2 data pipeline with sources |

## F. Status board (Master Instruction §19 format)

| Major feature | Status | Evidence / next action |
|---|---|---|
| Public website + CMS + SEO | **PARTIAL** | Pages/CMS exist and tested; content-scheduling/redirect/history workflow needs evidence pass (§05 Phase 2) |
| Course Finder + detail pages | **PARTIAL** | Policy + tests green; **data** is unverified/fabricated (B5) |
| Student portal + application lifecycle | **PARTIAL** | 46 pages + lifecycle models exist; stage-configurability and isolation tests need staging sign-off |
| B2B partner portal + isolation | **PASS** (regression-locked) | `tests/integration/partner-b2b-security.test.ts`; live staging re-run pending |
| Staff workspace + HR | **PARTIAL** | Modules exist (HRM models/pages); §6 privacy limits (salary/HR records) need permission-matrix evidence pass |
| Document Center | **PARTIAL** | Workflows/models exist; malware scan (D3) and signed-download proof (B3) outstanding |
| WhatsApp + social management | **PARTIAL** | Cloud-API modules + schemas exist; live integration **NOT VERIFIED** |
| AI Command Center + registries | **PARTIAL** | Registries exist but duplicated (C1); consolidation decision needed |
| AI model strategy (no paid API) | **PARTIAL** | Local-first router exists; fail-closed enforcement + licenses + evaluation outstanding (B1, B10) |
| AI orchestration (tasks/approvals/tools) | **PARTIAL** | `ai-workforce` stack present; adversarial evaluation evidence outstanding (D8) |
| Knowledge base + permissioned retrieval | **PARTIAL** | `ai-workforce/knowledge.ts`, RAG models present; query-time permission proof needs tests (§17 AI) |
| Security controls (§13 checklist) | **PARTIAL** | Most controls present (RBAC, rate-limiter, cookies, audit, CSRF/origin); MFA + scanning missing |
| MySQL/data management | **PARTIAL** | 532 models + migration tooling; defaults (D1), duplicate-data merge (B13), restore tests outstanding |
| Email + domain preservation | **PARTIAL** | SMTP template/sending code exists; DNS/SPF/DKIM/DMARC cutover checklist **NOT VERIFIED** (Phase 6 gate) |
| Reporting & analytics | **PARTIAL** | Dashboard/report pages exist; metric-definition review (derived-only, period-labelled) pending |
| Testing & acceptance (§17) | **PARTIAL** | 1911 passing tests today; AI evaluation suite + staging E2E + accessibility evidence pending |

**Bottom line:** the platform is substantially implemented and actively tested; the critical path to "production ready" under this Master Instruction is consolidation, the §7/§10/§13 hard gaps, verified data, and the infrastructure-gated evidence — not a rewrite.
