# Comprehensive Repository Audit — Baseline

**Audit snapshot:** 2026-10-28 UTC (2026-10-29 Asia/Dhaka)
**Repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Branch:** `arena/95c5f3a5-alo-web-crm-tech`
**Base/HEAD at audit:** `58971c9e61cfdbf9a763cb754ccb6b7ebd19517c`
**Audit type:** static repository review plus locally available lint, test, Prisma, dependency, and offline deployment-contract checks.
**Status:** baseline findings recorded; remediation and the second audit are pending.

> The requested artifact name is retained with the `2026-10-28` date. The inspection and report were completed on 2026-10-29. This report is about the checked-out working tree, not only the commit: it contained 38 modified tracked files and 9 untracked files before this report was added. The audit did not apply a database migration, run a seed, contact WhatsApp/Meta, deploy to a host, or change application source.

## 1. Executive outcome

**The repository is not yet verified as production-ready.** The existing Next.js/Prisma/MySQL architecture is intact, and static checks confirm substantial protections are present. However, there are release-blocking verification gaps and confirmed risks that must be addressed before claiming safe production operation:

1. A publicly consumed content catalogue contains unsubstantiated absolute claims, including a **99% visa-success/approval rate**, **100% acceptance** claims, and “100% bulletproof visa compliance.” These are in active service and language-test data, not merely in an unused archive. No supporting evidence or content-approval verification was established in this audit.
2. WhatsApp number values and an alleged 20-number “official” range are hard-coded across configuration, routing and UI/API code. They do not establish ownership or Meta connectivity; the send path does at least require a recent successful provider verification before use. No provider check or send was performed.
3. The canonical signed WhatsApp webhook is **1,285 lines** and begins with `// @ts-nocheck`. It silently suppresses several database-side-effect errors, including its inbound audit-log write and webhook-event completion. It therefore is not type-verified, and a message can be treated as processed while audit/side-effect persistence failed.
4. The full Vitest run had **17 failing tests** (12 files failed during Prisma adapter initialization; 7 files had assertion failures). The full TypeScript check ran out of memory, and the production build stopped before Next.js compilation because Prisma engine download/checksum access failed. These are not successful build/type/runtime validations.
5. A legacy Ubuntu backup script accepts an arbitrary destination root and then prunes it with `rm -rf`-based retention. A misconfigured destination can delete unrelated directories. No live backup or restore was attempted.
6. Database migration compatibility, provider connectivity, deployed hosting, SSL, production logging/alerting, and real recovery remain unverified. An offline deployment contract test passing does not verify any of those.

The UK PhD Proposal Builder is included in the audited application scope. Static inventory found 51 PhD API route files, 11 student PhD page files, and 52 `src/lib/phd` files. Its runtime/database/privacy integration could not be fully verified because the relevant Prisma-backed tests failed during client initialization and no live database was available.

## 2. Scope, method, and confidence

### Inspected

- Tracked repository inventory, active `src/` and Prisma source, route/page counts, package and lockfile state, environment templates, configuration, deployment and backup scripts, selected security-sensitive APIs, PhD modules, public static-data catalogues, database SQL, and tracked storage metadata.
- TypeScript/alias import resolution, source asset references, a canonical Markdown local-link sample, zero-byte files, symlink health, and pattern-based secret candidates.
- `npm ci`, `npm run lint`, the full Vitest suite, `npm run typecheck`, `npm run build`, Prisma schema/client operations using a temporary JavaScript-engine workaround, `npm audit`, dependency tree status, the environment-inventory check, and offline deployment/backup contract tests.

### Not verified

- No MySQL connection was available; `DATABASE_URL` and `TEST_DATABASE_URL` were unset. No migration status, live migration, production-data comparison, seed, backup, restore, or database integration was run.
- WhatsApp credentials, app secret and phone-number ID were not available in the process environment. No Meta Graph API request, webhook delivery, real send, or number-ownership check was made.
- No production host, cPanel/Hostinger account, Ubuntu server, domain, SSL certificate, production logs, monitoring endpoint, or alert recipient was accessed.
- No browser E2E, load, memory, accessibility, external-link, penetration, or live deployment test was completed. External claims in scholarship/test-prep content were not independently verified against official sources.
- The 1,088 API route files were not all reviewed line by line. Static keyword counts are indicators, not proof of per-route authorization, CSRF, validation or audit correctness.
- An exhaustive unused-export/dead-code/package analysis was not completed. Findings below distinguish verified problems from candidates and untested areas.

The project has a large imported/vendor snapshot, so repository-wide counts include material that is not part of the active runtime. Active application conclusions are based on the root project, not semantic review of every vendored file.

## 3. Repository inventory and integrity

| Measure | Result | Interpretation |
|---|---:|---|
| Tracked files | 68,398 | Includes archived imports and nested vendored dependencies. |
| Tracked directories | 8,869 | Same scope as above. |
| Files under `imports/` | 61,193 | Retained source/build snapshots; not treated as the active application. |
| Tracked files under nested `node_modules/` | 58,758 | Vendored dependency material substantially inflates repository size. |
| Working-tree files/dirs, excluding `.git`, root `node_modules`, `.next`, `.cache` | 68,411 / 8,871 | Snapshot at baseline; includes untracked and ignored files in this scan. |
| Working-tree files/dirs, excluding all `node_modules` | 9,653 / 3,697 | More representative of the non-vendored tree. |
| Tracked modified / untracked / deleted paths before this report | 38 / 9 / 0 | Existing working-tree changes were included in scope. No unmerged paths were reported. |

**Import resolution:** 2,664 TypeScript-config source files and 8,198 local/alias import specifiers were scanned. No unresolved TypeScript/alias imports were found. The single resolver miss was `./globals.css`, a CSS-resolution false positive; the stylesheet exists. This is not a TypeScript typecheck.

**Empty files:** 137 tracked zero-byte files were found across the complete tree. 121 are within nested vendored `node_modules` fixtures/files; 16 remain when those vendor directories are excluded:

- Diagnostic/artifact files: `AUDIT/phase2-gates-2026-10-11/{final-focused-typecheck.txt,focused-typecheck.txt,original-source-search.txt}`, root and archived `tsc-errors-fresh.txt`.
- Empty source/audit data: `src/components/website/public-pages/index.ts`; `data/official-source-audit/aston_parsing_failures.csv` and its archived copy.
- Empty landing-image copies: `public/images/landing/Copy of pexels-george-pak-7972967.webp`, the `alo-education-web-crm-final` copy, and two `deploy-build/public/...` copies.
- Four empty `.gitkeep` files in the active/archived `mini-services` directories (expected as directory placeholders).

The canonical zero-byte landing WebP is referenced by the app, so it is a broken active asset. The empty public-pages `index.ts` has no exports; observed imports target `PublicPages.tsx` directly, so the empty barrel is not needed by those imports. No broken symlinks were found.

**Images:** 170 static image references were scanned. There are 13 missing reference occurrences across six unique missing video-engine assets: `/brand/alo-logo.png` and five `/avatars/*.jpg` assets. Three references target the zero-byte landing WebP. Dynamic URLs and assets fetched from external providers are outside this scan.

**Markdown links:** a canonical scan covered 472 Markdown files and 77 local file links. Two local candidates are missing: `docs/production-reconciliation/2026-10-01/schema-matrix.csv`, referenced by `docs/DATABASE_RECONCILIATION.md` and `docs/HOSTINGER-PRODUCTION-RECONCILIATION.md`. External URLs were not crawled.

**Archive/duplication:** the imported snapshots and nested dependency trees are tracked alongside the active project. This is a size, provenance, and maintenance risk, but they were not removed because they may be retained source/data and the instruction is to preserve existing material. The UCC WhatsApp webhook compatibility route delegates to the canonical handler rather than maintaining a second ingestion implementation.

## 4. Application architecture and feature inventory

- Active stack is Next.js App Router, React, TypeScript, Node 22/npm, Prisma 6 and MySQL. Existing authentication, app proxy, models, APIs and deployment ownership controls remain in place. No Base44/Supabase replacement was introduced.
- `src/app` contains 1,088 `route.ts` handlers, 462 `page.tsx` files and 6 `layout.tsx` files.
- The root `src/proxy.ts` is the current request gate. The inspected proxy has explicit public-route rules and an auth/RBAC gate for other API traffic; it is not `src/middleware.ts`.
- The Prisma schema/client inventory reports 610 models. There are 44 migration directories, including the new consent/WhatsApp registry hardening migration in the working tree. That migration has not been applied.
- PhD Proposal Builder: 51 API route files under `src/app/api/phd`, 11 student PhD page files and 52 files under `src/lib/phd`. Static source shows reuse of the existing application authentication and private storage/ownership patterns; actual DB-backed access, retention and recovery behavior remains unverified.

## 5. Dependencies, environment, and configuration

- `npm ci` completed successfully and installed 1,282 packages. The package declares 94 dependencies, 9 devDependencies and 5 optionalDependencies, with Node `22.x` and npm `>=10` in `engines`.
- `npm ls --depth=0` showed no missing/invalid top-level dependencies and five extraneous local installation entries, associated with optional WASM/Sharp packages.
- Two direct-dependency declarations are duplicated between runtime and development groups: `@libsql/client` (different declared versions) and `@prisma/adapter-libsql`.
- `npm audit` reported six moderate advisories and zero high/critical. Findings include Vitest/`@vitest/mocker`, `exceljs`/`uuid`, `fast-uri` and Nodemailer. Some automated suggestions require a major change or downgrade; no blind automated fix was applied.
- Root runtime `.env` files were absent. Five environment files are tracked: three example templates and two `.env` files in imported snapshots. The imported files were inspected in redacted form and contain local `file:` database URLs, not live credentials. The process environment had no `DATABASE_URL`, `TEST_DATABASE_URL`, WhatsApp access token/app secret/phone ID, `NEXTAUTH_SECRET` or `NEXTAUTH_URL`.
- `.env.example` and `.env.production.example` contain the checked required production variable names; `.env.ai-gateway.example` is a partial gateway template by design. A pattern-based scan of 2,851 first-party source/config files found no confirmed credential; its only private-key marker was in CI scanner documentation/regex. This does not prove that all secrets or sensitive data are absent from all archived files.
- `node scripts/audit-env-vars.mjs --check` **failed with exit 1** because `docs/environment-classification.json` is stale. It was not regenerated during the baseline audit.
- Configuration is not entirely self-describing: the WhatsApp pool is not driven by the requested operator-owned number configuration, and deployment guides disagree on the intended hosting target (see §10).

## 6. APIs, authentication, privacy, consent, and security

### Positive controls observed in source

- `src/proxy.ts` uses explicit public API rules and protects other API traffic with authentication/RBAC. `tests/unit/proxy-security.test.ts` covers proxy behavior. This is a global layer, not proof every route's object-level scope is correct.
- The UCC WhatsApp webhook GET/POST route delegates to `src/app/api/whatsapp/webhook/route.ts`. The canonical route verifies provider signatures and fails closed in production when `WHATSAPP_APP_SECRET` is absent.
- WhatsApp sending is guarded by configuration and recent persisted provider verification; number rows start disconnected. The number-check path compares provider phone ID, displayed phone and business-account ID before marking a number verified. This is a control, not evidence that any ALO number is owned or connected.
- The new consent work uses append-oriented consent history and opt-out/suppression handling. Source changes distinguish service/transactional purposes from promotional consent; a message, inbound contact or `START` does not itself establish marketing consent or erase historical opt-out evidence. The pure helper tests passed in focused runs, but end-to-end DB/retry behavior was not verified.
- Contact-identity code has a review path for ambiguous matches rather than intentionally creating a duplicate student automatically. Focused identity/request-helper tests passed earlier; full UCC acceptance tests did not all pass, so this is not an end-to-end acceptance claim.
- PhD document code is outside `public/` and uses project ownership/auth checks in the reviewed path. Five PDFs exist in tracked `storage/`; their contents and every serving/backup path were not inspected. Private-document protection is therefore not fully certified.

### Confirmed security/operational risks and limits

- `src/app/api/whatsapp/webhook/route.ts` is 1,285 lines and begins with `// @ts-nocheck`. Full TypeScript validation never completed. The route contains multiple swallowed database errors; at lines 1224–1247 the inbound `aloAuditLog.create` failure is caught and ignored, and the webhook event can still be marked processed. A failed audit record can therefore be lost without failing the webhook response. Several notifications, message writes and completion updates are also soft-failed. This conflicts with the requirement for durable audit evidence and makes partial processing difficult to detect.
- Phone references are hard-coded in `src/lib/ai-whatsapp-engine.ts`, `alo-site-info.ts`, `comprehensive-evidence-audit.ts`, `diagnose-system-status.ts`, `whatsapp-number-pool.ts`, `whatsapp-sender.ts`, and WhatsApp number/routing APIs. The pool asserts an “official” 20-number range, fixed main/COO identities, display labels and default routing. `src/app/api/whatsapp/numbers/route.ts` only accepts that range and reports `expected: 20`. These values are configuration-like assumptions, not verified ownership. No phone values are reproduced in this report.
- Static scan found 1,088 API route files, 726 with mutating handlers. Keyword pattern hits were: 700 auth/session, 485 permission/role, 275 body-schema/validator, 55 origin/CSRF and 86 audit-write patterns. Among mutating handlers, 503 matched auth patterns and 53 origin patterns. These counts can miss shared guards and custom logic; they are **not** vulnerability counts. Route-by-route scope, tenant/object authorization, CSRF, body size, validation and audit durability remain incompletely reviewed.
- The static checks do not establish protection against all retry/race cases, duplicate contacts, cross-student/partner access, unsafe uploads, unauthorized publication, or every promotional send path. Full DB-backed tests did not initialize.
- No live secrets were found by the limited pattern scan, but the committed imported `.env` files and archived storage still require appropriate exclusion/retention controls. Do not treat this scan as secret-scanning certification.

## 7. Database, migrations, seeds, and data preservation

- `prisma/schema.prisma` is MySQL-backed. Static inventory found 610 models and 44 migration directories; no Prisma enum declarations were found. The absence of enums is a modeling observation, not by itself a defect.
- The current hardening migration is additive by inspection: its SQL contains no top-level `DROP`, `DELETE` or `TRUNCATE`; migration was **not applied**. `ConsentRecord` defaults existing/unclassified records to unknown rather than retroactively asserting marketing consent. No live schema diff or MySQL compatibility test was possible.
- A temporary JavaScript-engine Prisma configuration workaround (removed after use) passed `prisma validate`, client generation and `npm run db:verify-client` (610 models). Native engine download/checksum access failed TLS. The JS-generated client cannot prove runtime DB readiness; multiple tests failed with “Missing configured driver adapter. Engine type client requires an active driver adapter.”
- Root `database.sql` is 4,288 lines / 178,780 bytes. Static scan found 212 `CREATE TABLE`, 52 `ALTER TABLE` and one `CREATE DATABASE`; it did not detect `INSERT INTO`, row-level `UPDATE ... SET`, `DELETE FROM`, `DROP TABLE`, `CREATE USER` or `GRANT`. This is a schema dump, not a verified backup of current production data.
- `prisma.config.ts` selects `prisma/seed-complete.ts`; the modified `prisma/seed.ts` is not the configured seed entry point. Any new seed logic placed only in `seed.ts` will not run through the configured Prisma seed command. No seed ran. The configured seed requires `SEED_SUPER_ADMIN_PASSWORD` (at least 12 characters); synthetic catalogue data is explicitly opt-in outside production, but must remain disabled for production and be clearly labeled as synthetic.
- No existing database data was read, changed, migrated, seeded, deleted or reset during this audit. Data preservation is therefore untested, not demonstrated by an actual backup/restore or migration rehearsal.

## 8. Public content, sample data, and claims

This is a **confirmed high-priority content-control finding** because these files are consumed by public views:

- `src/lib/services-data.ts` contains a “99% visa success rate” in the service description and SEO fields, and a “99%+” visa approval answer. It contains no evidence/provenance record for that statistic.
- `src/lib/test-prep-data.ts` is imported by public English-test pages and contains absolute/quantified claims such as “100% universal acceptance,” 99–100% acceptance rates, “100% accepted” visa claims, and “100% bulletproof visa compliance.” Those statements are not substantiated or time-stamped in the data catalogue. Acceptance rules vary by provider, course, route and date; they cannot safely be represented as universal guarantees without authoritative evidence.
- `src/lib/scholarships-data.ts` is consumed by public pages and contains detailed amounts, eligibility, dates and “fully funded” coverage. Some entries include a generic official URL, but no field-level source, verified-at date or audit state was established. Accuracy was not checked against current official programme material.
- `src/components/alo/views/marketing-ai.tsx` includes a canned response asserting ALO’s visa approval rate is “strong” without supporting evidence. `src/components/admin/super-admin-command-center/sections/Governance.tsx` includes hard-coded success-rate series and a 100% compliance score. `src/components/crm/pages/CrmReportsPage.tsx` has fixed report timestamps from 2025 and a visa-success-rate report description. These may be demo/presentation values, but are not marked as mock values in the inspected source.

**Disposition:** do not promote these statements as factual marketing, regulatory or operational claims until they are removed or reviewed by an authorized human against dated, authoritative evidence. Do not replace them with invented statistics. Public success stories are fetched through an API, but the actual published rows, consent and runtime publication controls were not inspected against a live database.

## 9. Build, type, tests, and quality checks

| Check | Result | What it proves / does not prove |
|---|---|---|
| `npm ci` | Pass | Lockfile dependencies install in this environment. |
| `npm run lint` | Pass | ESLint completed on the working tree; took about 123 seconds. Not type/runtime proof. |
| Full Vitest run | **Fail:** 3,421 passed, 17 failed, 38 skipped/pending (3,476 total); 19 files failed | See failure roster below. Not all failures are necessarily application defects, but all remain unresolved. |
| `npm run typecheck` | **Blocked/fail:** `db:verify-client` passed, TypeScript then ran out of memory near the environment heap limit | No successful whole-project typecheck. `@ts-nocheck` webhook is additionally suppressed from checking. |
| `npm run build` | **Blocked/fail:** Prisma native engine/checksum TLS failure before Next compilation | No production bundle, server start or browser E2E verified. |
| Prisma validate/generate with temporary JS-engine workaround | Pass | Schema/client generation succeeds in that mode only; no native engine or live DB readiness proof. |
| `npm run db:verify-client` | Pass | Generated client reports 610 models; not a database connection test. |
| `npm audit` | Six moderate; zero high/critical | Advisories remain unresolved. |
| `npm ls --depth=0` | No missing/invalid; five extraneous local entries | Does not prove every package is used or safe. |
| `node scripts/audit-env-vars.mjs --check` | **Fail, exit 1** | Generated environment classification file is stale. |
| `node scripts/validate-deployment-config.mjs` | Pass: 16/16 contract subtests | Explicitly offline repository-contract check only; no host/build/database test. |
| Focused backup/deployment tests | Pass: 14 tests in 2 files | Script contract/safety tests only; no real backup/restore. |
| Playwright/E2E | Not run | Production build did not complete. |

### Full-suite failure roster

**12 test files failed during Prisma client initialization** with `Missing configured driver adapter. Engine type client requires an active driver adapter`: integration tests for `communication-ownership`, `content-publication-security`, `employee-access-live-db`, `language-prep-catalog-live-db`, `owner-ai-chat-live-db`, `partner-b2b-security` and `webhook-security-live-db`; unit tests `application-risk-score` and `student-success-score`; and PhD tests `services`, `auth-access` and `storage-security`.

**Seven files had assertion failures (17 failed tests total):**

- `tests/unit/ai-security-remediation.test.ts` — unknown-action default-risk expectation.
- `tests/unit/brand-chrome-partner-footer.test.ts` — footer landmark/component count.
- `tests/unit/business-hours-policy.test.ts` — two persisted-policy cases.
- `tests/unit/critical-safety-remediation.test.ts` — seven schema-mutation-disabled expectations.
- `tests/unit/design-tokens.test.ts` — metadata floor and neutral-scale tokens.
- `tests/unit/employee-access-acceptance.test.ts` — WhatsApp identity-upsert contract.
- `tests/unit/ucc-acceptance-steps.test.ts` — unmatched contact review, authorized review roles, inbound receiver fields/document-slot review.

Focused helper tests passed in earlier runs, but do not cancel the complete-suite failures or prove DB-backed flows. Each failing assertion must be compared with the intended current contract; do not merely weaken or delete a test to get a green result.

## 10. Deployment, Docker, backup, monitoring, logging, SSL, and documentation

- Deployment-related assets exist for Node startup, Docker, Caddy/Nginx, Ubuntu and host-specific workflows. Static ownership/contract tests pass (16/16). Docker was not built or started; Ubuntu scripts and a live host were not exercised. The contract deliberately avoids automatic schema migration at container startup.
- Deployment documentation is inconsistent: the current ownership/deployment matrix describes a Hostinger Node 22/npm path, while other README/deployment guides describe managed cPanel. The actual authorized host, domain and promotion path therefore need a single owner-approved source of truth.
- `scripts/validate-deployment-config.mjs` says it checks repository contracts only; it does not verify a live host, build/start, database or restore. `scripts/full-deploy-check.sh` appears stale: it requires `src/middleware.ts` and `prisma/schema.mysql.prisma`, while the inspected active gate/schema paths are `src/proxy.ts` and `prisma/schema.prisma`. It was not run and should not be used as a readiness signal until corrected.
- `scripts/backup-mysql.sh` has focused safety tests, but no database dump was made. **`deploy/ubuntu/backup.sh` is a separate unguarded legacy script:** it accepts arbitrary `$BACKUP_ROOT` and line 73 prunes older directories with `ls ... | tail ... | xargs rm -rf`. If an operator supplies an incorrect root (for example, an overly broad filesystem directory), retention can remove unrelated data. Its backup is also not encrypted or restore-tested. It packages application source, which may contain `.env`, `storage` or uploaded documents. Do not run it with an unreviewed destination.
- Five tracked PDFs are in `storage/`, outside `public/`; file contents, access controls in each serving path, deployed volume persistence and backup exclusions/encryption were not verified. Do not infer they are safe to publish or that private documents survive deployment.
- Health-check, logging and monitoring files exist, but there was no production process or host to validate log retention, alert delivery, uptime probes, resource limits or sensitive-data redaction. No memory/load benchmark was run.
- Caddy/Nginx configuration was inspected as repository content only; no parser, certificate, DNS, HTTPS redirect, renewal or live SSL test was performed.
- The Markdown scan found two missing local CSV links (see §3). The repository also has legacy deployment and audit documents that may describe older paths; no external links or operational runbooks were verified end to end.

## 11. Prioritized finding register

| ID | Priority | Finding and evidence | State / required action |
|---|---|---|---|
| A-01 | **P1 — content/public safety** | Public static service/test-prep data contains unsupported 99%/100% visa, acceptance and compliance claims; scholarship details lack verification timestamps; hard-coded admin/demo metrics are not labeled as such. | Confirmed in source. Remove or hold unsupported statements; require human approval plus authoritative, dated evidence for any retained factual claim. Re-audit rendered public pages. |
| A-02 | **P1 — WhatsApp identity/config** | A 20-number “official” pool, main/COO assignments and fallback sender are hard-coded; the API only accepts that range. Requested numbers are not proof of ownership. | Confirmed in source. Replace assumptions with operator-configured, ownership/Meta-verified records; do not seed fictitious “official” values or send until verified. |
| A-03 | **P1 — auditability/type safety** | 1,285-line signed webhook has `@ts-nocheck`; critical audit/event writes and multiple side effects swallow errors, then processing may be marked complete. | Confirmed in source; runtime consequence untested. Remove suppression, model errors, make audit/claim state durable/fail-safe, and add failure-injection tests before production. |
| A-04 | **P1 — backup/data loss** | Legacy `deploy/ubuntu/backup.sh` lets callers choose arbitrary root and prunes it using `rm -rf`; archive contains sensitive app material and restore is unverified. | Confirmed by static inspection. Add canonical-path/ownership/symlink guards, safe retention scoped to a dedicated backup root, restrictive permissions/encryption policy and tests. Do not execute the legacy script meanwhile. |
| A-05 | **Release blocker — correctness** | Full test suite has 17 failed tests; 12 DB-adapter initialization failures and 7 assertion-failure files remain. | Observed. Fix the client/test harness and investigate every assertion without weakening safety contracts; rerun full suite. |
| A-06 | **Release blocker — build/type** | Typecheck OOM; build stops during Prisma native engine TLS fetch before Next compilation. | Observed. Establish a reproducible supported CI build/typecheck path and record separate success; current status is blocked, not passed. |
| A-07 | **P1 — database/data preservation** | Additive migration not applied or tested against MySQL; no backup/restore rehearsal. Configured Prisma seed is `seed-complete.ts`, not modified `seed.ts`. | Confirmed configuration and absent live verification. Reconcile seed entry point and test a staged additive migration with backup/restore before production. No production reset/push. |
| A-08 | **P1 — access/security review** | Per-route object scope, consent, CSRF, validation, audit and upload controls across 726 mutating route files are not comprehensively verified. | Incomplete audit. Continue targeted route review/tests; static counts and proxy gate are not closure. |
| A-09 | **P1 — operations ownership** | Hostinger and cPanel guides conflict; actual target and authorized deploy path are not proven. | Confirmed docs conflict. Obtain one owner-approved deployment contract and verify actual target, rollback, SSL and backups. |
| A-10 | **P2 — dependency risk** | Six moderate npm advisories; duplicate direct dependency-group declarations; five extraneous install entries. | Confirmed tool output. Review compatible fixes and regression-test; do not take major/downgrade suggestions blindly. |
| A-11 | **P2 — stale config/checks** | Environment classification check fails stale; legacy deploy checker requires obsolete files. | Confirmed. Regenerate/review classification and update or retire stale readiness script after the baseline report is recorded. |
| A-12 | **P2 — broken assets/docs** | One active landing image is zero bytes; six missing video-engine image paths (13 references); two missing docs CSV links. | Confirmed by static reference scan. Replace with approved existing assets or remove references; restore/repair documentation links. |
| A-13 | **P2 — archive and dead-code candidates** | 61,193 tracked files under `imports/`; 58,758 tracked nested `node_modules`; empty barrel and stale diagnostic artifacts. | Counts confirmed; archive purpose/unused exports not fully reviewed. Preserve until provenance/retention is approved; do not delete blindly. |
| A-14 | **P1 — PhD feature verification** | PhD routes/pages/lib exist in the integrated app, but three PhD tests failed before assertions due Prisma adapter initialization; private-storage deployment/restore was not tested. | Static implementation present, runtime unverified. Fix adapter/test harness and run ownership, signed-download, retention, backup and human-review tests against a disposable DB/storage fixture. |

## 12. Baseline closeout and next verification gate

This document is the **pre-remediation baseline**. It does not certify the application as safe, complete or deployable. Before the second audit, the high-priority claims, WhatsApp number configuration, webhook audit durability/type checking, backup retention safety, test failures and environment/deployment inconsistencies require changes or explicit owner decisions.

The follow-up audit should rerun, at minimum: import and asset scans; full lint/typecheck/build; complete Vitest and E2E where supported; Prisma validate/generate and migration status on a disposable MySQL instance; migration + backup + restore rehearsal; WhatsApp consent/STOP/retry/identity/ownership tests with mocked provider and separately authorized live verification; PhD ownership/private-document tests; environment inventory; npm audit; deployment ownership/SSL/monitoring checks on the approved staging host. Live Meta and production host claims must remain explicitly blocked unless actually tested.

**No production data or live service was touched during this baseline audit.**
