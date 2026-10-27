# Phase 1 — Read-only audit report (2026-10-27)

**Scope:** `tech360-bd/ALO_WEB_CRM_TECH` at `e74d145e4fbab57fe3225734498276e75dae0e85` (branch `main`), audited from branch `arena/1bb65ae0-alo-web-crm-tech`.
**Mode:** read-only. No database, volume, migration, seed, deployment or production configuration was changed. `git status` was clean at the end of every experiment.
**Companion documents:** `ARCHITECTURE_AUDIT.md`, `DATABASE_AUDIT.md`, `DEPLOYMENT_AUDIT.md`, `SECURITY_AUDIT.md`, `AI_AND_SPEECH_AUDIT.md` (this folder); target-state designs in `docs/architecture/`, `docs/operations/`, `docs/testing/`.

---

## 1. Environment used for this audit

| Item | Value |
| --- | --- |
| Node / npm | v22.22.3 / 10.9.8 (matches `engines.node = 22.x`) |
| Dependencies | `npm ci` → 1,282 packages, exit 0 |
| Database | **none available in the audit sandbox** (no `mysqld`, `mariadbd`, `docker`, `podman`) |
| Prisma engine binaries | **cannot be downloaded** — `binaries.prisma.sh` is not reachable from the sandbox |
| Consequence | `prisma generate` and therefore `next build`, `tsc --noEmit` and DB-backed tests **could not be executed here**; CI evidence from GitHub Actions is used instead (§3). |

This restriction is reported, not worked around: the generated client is a placeholder that throws `@prisma/client did not initialize yet`, so 18 of the 20 failing test files below are **environment artefacts**, not repository defects.

---

## 2. What the repository actually is

| Metric | Value | Evidence |
| --- | --- | --- |
| Tracked files | 68,387 | `git ls-files \| wc -l` |
| Working tree (excl. `.git`, `node_modules`) | ~1.0 GB | `du -sh` |
| `.git` object store | 242 MB | `du -sh .git` |
| App routes (`page.tsx`) | 462 | `find src/app -name page.tsx` |
| API routes (`route.ts`) | 1,088 | `find src/app/api -name route.ts` |
| Prisma models | 610 | `prisma/schema.prisma` |
| Migrations | 43 (+ 11 in `prisma/legacy-migrations-20261001/`) | `ls -d prisma/migrations/*/` |
| `src/lib` modules | 525 | `find src/lib -name '*.ts'` |
| React components | 542 | `find src/components -name '*.tsx'` |
| Test files | 324 (321 collected by Vitest) | `find tests -name '*.test.*'` |
| Vendored `node_modules` **tracked in Git** | 58,758 files under `imports/` | `git ls-files \| grep -c node_modules/` |
| Root-level CSV exports | 111 files, 214 MB | `du -ch *.csv` |

The product is a large multilingual education-consultancy ERP/CRM (admissions, applications, HRM, accounting, marketing, partner B2B, super-admin), **not** a call-center product today. The call-center, voice and long-term-memory capabilities are the extension this programme must add.

---

## 3. CI / quality-gate status (the three known failures)

Latest completed CI runs (GitHub Actions, `ci.yml`):

| Run | Commit | Result | Failing step(s) |
| --- | --- | --- | --- |
| [40449196873](https://github.com/tech360-bd/ALO_WEB_CRM_TECH/actions/runs/40449196873) | `e74d145e` (main, merge of #39) | **cancelled** by concurrency group | — (so main is currently *unverified*) |
| 40439393932 | `b79135f0` (PR #39 head) | failure | `Environment variable classification is current`; `No drift between migrations and schema.prisma` |
| 40428024839 | earlier main | failure | `Tests (blocking; …)` → `tests/unit/design-tokens.test.ts:184` |
| 40275541354 | `main` 2026-10-26 | success | last fully green main run |

Because the post-merge `main` run was cancelled, **three regressions are now on `main` without a red gate**: two design-token test failures, one footer-ownership test failure, a stale generated environment document, and migration drift.

### 3.1 `Environment variable classification is current` — reproduced locally

```
$ npm run audit:env -- --check
::error::docs/environment-classification.json is stale. Run: node scripts/audit-env-vars.mjs
```

Regenerating into a scratch copy and diffing gave **only two changes**:

* `filesScanned` 2,729 → 2,814
* one variable's `referenceCount` 16 → 17

**Severity: Low.** Root cause: a `process.env` reference and 85 source files were added without re-running the generator. The committed file was restored immediately; `git status` clean.
**Correction:** `node scripts/audit-env-vars.mjs` and commit the regenerated JSON (no manual edits).
**Risk:** none — generated documentation. **Approval needed:** no (Phase 2, non-production).

### 3.2 `No drift between migrations and schema.prisma` — root cause identified

The failing step runs `prisma migrate diff --from-migrations … --to-schema-datamodel …` against a shadow MySQL 8.4 database, then `scripts/ci/filter-lob-default-drift.mjs`. The annotation published by the step (retrieved from the GitHub check-runs API) is explicit:

> `Migration chain does NOT reproduce schema.prisma — 6 of 108 drift statement(s) are real.`

All six are `MODIFY … DEFAULT ''` on TEXT/LONGTEXT columns introduced by the three hand-written migrations dated 2026-10-27:

| Table.column | Migration | Prisma declaration |
| --- | --- | --- |
| `permission_groups.description`, `.permissions` | `20261027120000_super_admin_operating_models` | `@default("")`, `@default("[]") @db.Text` |
| `permission_group_grants.reason` | same | `@default("") @db.Text` |
| `system_settings.value`, `.description` | same | `@default("") @db.Text` |
| `reports.filters`, `.payload` | `20261027140000_…build_requests` | `@default("{}") @db.Text`, `@default("") @db.LongText` |
| `module_build_requests.plan`, `.proposedFiles`, `.patchProposal`, `.sandboxResult`, `.decisionNote` | same | `@default("{"/"[]"}") @db.LongText/@db.Text` |
| `user_permission_overrides.reason` | `20261027160000_…overrides` | `@default("") @db.Text` |

**Root cause:** the normaliser accepts only `@default(dbgenerated("(_utf8mb4'…')"))` as proof that a LOB expression default is already declared. These six models instead use the ordinary `@default("…") @db.Text` form, which Prisma renders as a MySQL *expression* default. MySQL therefore round-trips one representation and Prisma's diff re-asserts the other. The filter classifies that as real drift; it is a **false positive in the guard**, not a schema/data discrepancy (verified independently in §3.3).

**Severity: High (release-blocking gate), data risk: none.**
**Correction (recommended, Phase 2):** teach `filter-lob-default-drift.mjs` that a plain `@default("X")` on a `@db.Text|LongText|MediumText|TinyText` field equals the asserted `DEFAULT 'X' / DEFAULT (_utf8mb4'X')`, keeping every other check (type, nullability, payload byte-equality) fatal. Do **not** rewrite applied migrations; do **not** add a new DDL migration just to please the diff.
**Alternative rejected:** converting those fields to `@default(dbgenerated(...))` changes Prisma Client input types (field becomes required) across six models — an API-breaking change for cosmetics.
**Verification:** the step must pass with `0 real drift` and the filter's unit behaviour must be pinned by a new test with three fixtures (benign literal form, benign expression form, genuine payload mismatch).

### 3.3 Independent static drift check (no MySQL required)

Method: parse all 610 models (`@@map` and `@map` aware) and compare every scalar column against `CREATE TABLE` + `ALTER TABLE … ADD/MODIFY COLUMN` in all 43 migrations, statement-aware (multi-column `ALTER` handled).

* Models with no `CREATE TABLE`: **0**
* Columns in the schema with no migration: **0**
* Tables created by migrations but not mapped by the schema: **1** — `_EmployeeToOffice`, Prisma's implicit join table (expected, not drift).

So the only discrepancy the CI gate can be reacting to is the LOB-default representation of §3.2 — consistent with the annotation.

### 3.4 Test suite — 20 failing files, 2 genuinely broken

`npx vitest run` (sandbox): **297 passed / 20 failed / 4 skipped** (321 files); **3,398 passed / 27 failed / 38 skipped** (3,463 tests).

| Group | Files | Cause |
| --- | --- | --- |
| Environment | 18 files (8 `tests/integration/*`, plus `accounting-ledger`, `journal-integrity`, `cms-revisions`, `ai-security-remediation`, `application-risk-score`, `business-hours-policy`, `critical-safety-remediation`, `phd/auth-access`, `phd/storage-security`, `student-success-score`) | `@prisma/client did not initialize yet` / `Prisma.sql is not a function` — the client was never generated in this sandbox. They would run in CI. |
| **Real defect** | `tests/unit/design-tokens.test.ts` | 2 assertions fail: (a) `text-[10px]` in 6 files — `src/app/student/compare/page.tsx`, `src/components/admin/super-admin-command-center/{SuperAdminCommandCenter,AiEosMasterBlueprint,charts}.tsx`, `src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx`, `src/components/student/TestStudentView.tsx`; (b) `text-slate-500` in `super-admin-operating/{SuperAdminOperatingDashboard,primitives}.tsx` |
| **Real defect** | `tests/unit/brand-chrome-partner-footer.test.ts` | "exactly one public footer and one portal footer component": a **third** `<footer>` exists in `src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx` |

**Severity: Medium (blocks `npm test`, blocks the merge gate).** All three regressions share one origin — the super-admin operating dashboard merged through PR #39 while its own `main` CI run was cancelled.

**Note on the brief's "workforce-provisioning test failure":** no such failure exists in the repository or in CI history. The Tests-step failure recorded on `main` was the design-token assertion above. The AI Workforce suites (`tests/unit/ai-workforce-*.test.ts`, 6 files) passed in this sandbox and in CI. This is recorded as a **disproved premise**, not silently dropped.

### 3.5 Dependency security

`npm audit --omit=dev`: **4 moderate, 0 high, 0 critical** — `fast-uri` (scheme injection), `nodemailer@10.0.13` aliased as `smtp-mailer` (3 address-parser advisories), `uuid < 11.1.1` via `exceljs`. CI blocks high/critical only, so it passes today. Severity: Low; remediation plan in `SECURITY_AUDIT.md` §8.

---

## 4. Findings summary

| # | Severity | Finding | Location | Blocking? |
| --- | --- | --- | --- | --- |
| F1 | Critical (programme) | No speech stack exists: no ASR, TTS, VAD, streaming audio, barge-in or telephony. A `transcribeWithWhisperLocal()` that returns the literal string `"Mock transcription from local Whisper"` is committed as if it were ASR. | `src/lib/video-engine/captioning/videocaptioner.ts:236-249` | Yes, for the product goal |
| F2 | Critical (programme) | No SIP/IVR/queue/hand-off. Telephony is a single boolean `TELEPHONY_PROVIDER_API_KEY` and demo UI. | `src/app/api/crm/ucc/phone/route.ts:8`; `src/components/alo/views/phone-call-center.tsx` (`counselor-demo`) | Yes, for the product goal |
| F3 | High | Migration-drift gate fails on 6 false positives (guard limitation, not data drift). | `scripts/ci/filter-lob-default-drift.mjs`, 3 migrations dated 2026-10-27 | Yes (CI) |
| F4 | High | `main` is unverified: merge #39's CI run was cancelled; 3 real regressions are now on `main`. | `tests/unit/design-tokens.test.ts`, `tests/unit/brand-chrome-partner-footer.test.ts` | Yes (CI) |
| F5 | High | Only 2 locales exist (`en`, `bn`); no `hi`, no `ar`, and no locale-aware speech/CRM vocabulary layer. | `src/i18n/dictionaries.ts` | Yes, for multilingual goal |
| F6 | Medium | 58,758 vendored `node_modules` files and 214 MB of CSVs are tracked in Git; CI's secret scan explicitly excludes that tree, so a real credential committed there would be undetected. | `imports/alo-education-full/`, `*.csv` | No, but it caps auditability |
| F7 | Medium | The AI Workforce verification harness (`npm run awf:*`) is **not executed by CI**, so the offline SQLite acceptance gates never run. | `.github/workflows/ci.yml` (no `awf:` step) | No |
| F8 | Medium | No durable queue/job runtime in production: cron + in-process logic only; `mini-services/*` require Bun and are not deployed. | `ecosystem.config.cjs` note; `src/cron`, `mini-services/` | Yes, for reliability goals |
| F9 | Medium | Local inference is designed but unproven: no Ollama/vLLM provisioning, no model artefact manifest, no health probe, no measured latency. | `.env.example:325`, `src/lib/model-router.ts` | Yes, for AI goal |
| F10 | Medium | Restore path is a refusal stub; no evidence in-repo that a backup has ever been restored. | `deploy/ubuntu/restore.sh` (exits 1) | Yes, before any migration |
| F11 | Low | `docs/environment-classification.json` stale. | `docs/environment-classification.json` | No |
| F12 | Low | 4 moderate npm advisories. | `package-lock.json` | No |
| F13 | Low | `ecosystem.config.cjs` starts with a `throw` — the historical PM2 config below it is unreachable dead code (deliberate quarantine, but confusing). | `ecosystem.config.cjs:1` | No |

---

## 5. The documented SQLite/MySQL mismatch — resolved

The question was whether production generates a SQLite or a MySQL Prisma client. **Answer: MySQL, in every production path.** Evidence in `DATABASE_AUDIT.md` §2. In short:

* `prisma/schema.prisma` → `provider = "mysql"`; `prisma/migrations/migration_lock.toml` → `provider = "mysql"`; `prisma.config.ts` points at that schema, and `npm run build` runs plain `prisma generate` against it.
* The SQLite path is an **offline verification mirror**: `prisma/verification-mirror/schema.sqlite.prisma` (generated mechanically by `scripts/ai-workforce/mirror-schema.mjs`) plus `ALO_DB_DRIVER=sqlite` in `src/lib/db.ts`, which additionally refuses any `DATABASE_URL` that is not `file:`.
* I regenerated the mirror from the current schema: **byte-identical to the committed mirror** (`mirror in sync: true`).
* No production artefact, Dockerfile or deploy script sets `ALO_DB_DRIVER`. The Dockerfile is disabled anyway (`CMD … exit 1`).

**Conclusion:** the mismatch is documented, deliberate and correctly bounded — not a live misconfiguration. It becomes a risk only if `ALO_DB_DRIVER=sqlite` is ever set in a production environment, which `src/lib/db.ts` already fails closed against. Recommendation: add a CI assertion that `ALO_DB_DRIVER` is absent from `.env.production.example` (it is absent today) and a startup log line naming the active driver.

Also disproved: the claim that the production image generates the SQLite client. It cannot — the Dockerfile's entrypoint is disabled and the build script generates from the MySQL schema.

---

## 6. Capability matrix — claimed vs verified

Legend: **Verified** = exercised in this audit; **Present, unverified** = code exists, needs a DB/model/hardware to prove; **Absent** = no implementation found.

| Capability | State | Evidence |
| --- | --- | --- |
| Auth (NextAuth v4 + portal sessions) | Present, unverified (DB required) | `src/proxy.ts`, `src/lib/auth/*`, `src/lib/session-roles.ts` |
| RBAC / central authorization | Present, unverified | `src/lib/access-control/central-security-engine.ts`, `src/lib/rbac/*` |
| CRM entities (leads, students, applications, partners, HRM, accounting) | Present | 610-model schema |
| Call records | Present (flat) | `CallLog`, `PhoneCallLog`, `PhoneCallRecord`, `CallOutcome` |
| Recording consent guard | **Verified** (unit tests pass) | `src/lib/communication/call-consent.ts`, `tests/unit/call-recording-consent.test.ts` |
| AI provider abstraction + local-first routing | Present, unverified (no model host) | `src/lib/ai.ts`, `src/lib/model-router.ts` |
| Cloud-AI hard gate (`PAID_AI_API_ALLOWED`) | **Verified** by unit tests | `src/lib/ai-providers/resolve.ts:36`, `tests/unit/ai-provider-policy.test.ts` |
| Standalone AI gateway with `local_only` routes | Present, unit-tested | `services/ai-gateway/gateway.mjs`, `tests/unit/ai-gateway/` |
| Permission-aware memory (5 scopes, confidentiality, approval, expiry) | Present, unit-tested | `src/lib/ai-workforce/memory.ts`, `AwfMemory` |
| Knowledge retrieval with citations (lexical BM25-style) | Present, unit-tested | `src/lib/ai-workforce/knowledge.ts`, `AwfKnowledgeChunk.termIndex` |
| Embeddings / vector store | **Absent** (lexical only) | no embedding code in `src/lib` |
| ASR | **Absent** (mock only) | see F1 |
| TTS | **Absent** | no TTS library, model or endpoint |
| VAD / streaming audio / barge-in | **Absent** | no implementation |
| Telephony / SIP / IVR / queues | **Absent** | see F2 |
| Bangla UI strings | Present | `src/i18n/dictionaries.ts` (`en`, `bn`) |
| Hindi / Arabic | **Absent** | same file |
| Local model runtime (Ollama etc.) | Config hooks only | `LOCAL_AI_URL`, `LOCAL_AI_MODEL` |

---

## 7. Deliverables produced in Phase 1

| Document | Purpose |
| --- | --- |
| `docs/audit/ARCHITECTURE_AUDIT.md` | Structure, layering, AI subsystem map, structural risks |
| `docs/audit/DATABASE_AUDIT.md` | Provider/client resolution, drift analysis, constraints, tenant isolation, migration safety |
| `docs/audit/DEPLOYMENT_AUDIT.md` | Real production topology, disabled paths, env contract, backups, capacity |
| `docs/audit/SECURITY_AUDIT.md` | AuthN/AuthZ, secrets, uploads, rate limits, AI-specific security, dependency position |
| `docs/audit/AI_AND_SPEECH_AUDIT.md` | What exists, the mock-ASR finding, verified licences, language readiness, resource plan |
| `docs/architecture/SELF_HOSTED_AI_CALL_CENTER.md` | Target architecture and component decisions |
| `docs/architecture/MULTILINGUAL_VOICE_AND_MEMORY.md` | Language/voice evaluation protocol, memory taxonomy and mapping |
| `docs/operations/BACKUP_AND_RESTORE.md` | Current position and the restore drill that must pass before any migration |
| `docs/operations/DEPLOYMENT_RUNBOOK.md` | Safe deployment/rollback procedure for the current and future stack |
| `docs/testing/ACCEPTANCE_TEST_PLAN.md` | Executable acceptance criteria for every phase |

---

## 8. Approval requests (nothing has been changed)

| # | Action | Destructive? | Why approval is needed |
| --- | --- | --- | --- |
| A1 | Fix the three `main` regressions (`text-[10px]`, `text-slate-500`, extra `<footer>`) and regenerate `docs/environment-classification.json` | No | Code changes on a shared branch |
| A2 | Extend `scripts/ci/filter-lob-default-drift.mjs` for plain-string LOB defaults + add unit fixtures | No | It loosens a drift guard; must be reviewed |
| A3 | Add a CI job that runs `npm run awf:mirror`/`awf:ddl`/`awf:verify`/`awf:audit` | No | New CI gate, adds runtime |
| A4 | Provision a disposable MySQL 8.4 (CI service or local) to re-run the drift step and the 8 DB-integration suites | No (disposable DB only) | Needs infrastructure outside the sandbox |
| A5 | Any `prisma migrate` / `db push` / production restore | **Yes** | Explicitly forbidden in Phase 1 |
| A6 | Introduce the speech/telephony stack (asterisk or FreeSWITCH, ASR/TTS services) | No (new, isolated services) | Architecture decision with licence implications |

**Recommended immediate next step:** approve A1+A2+A3 as Phase 2 — they restore a trustworthy green gate on `main` without touching data, and every later phase depends on that gate existing.

---

## 9. Explicit non-claims

* No ASR/TTS/Bangla voice quality has been measured. Nothing in this repository supports a claim about Bangla speech accuracy or naturalness today.
* No end-to-end call has been placed. There is no telephony integration to place one through.
* No local LLM inference was executed. `LOCAL_AI_URL` is a hook, not proof.
* No production database was inspected; all database reasoning is from schema, migrations and CI evidence.
* `main` is currently **not** green. It must not be treated as a verified baseline.
