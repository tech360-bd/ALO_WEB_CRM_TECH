# ALO WEB CRM TECH — Unified Project Baseline Audit

**Date:** 2026-10-27
**Canonical repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Canonical branch (this session):** `arena/00d5c43f-alo-web-crm-tech`
**Base commit:** `e4e3d75a02c0c42604693a47b02cd4d6e1d17fd7` (merge of PR #37)
**Auditor:** Arena Agent Mode
**Method:** Actual file inspection + real command execution. No assumptions from READMEs or prior reports.

> **Scope note.** Outbound network in this sandbox is restricted to `github.com`,
> `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`,
> `files.pythonhosted.org`. Marketing/reference websites in the brief
> (osom.global, speak.com, osam.ai, bdtechlabs.com, etc.) could **not** be fetched.
> The user's own `engralaminn-collab/*` GitHub repos returned **"Repository not found"**
> (private/deleted/renamed) and could not be inspected. Everything below reflects the
> repository actually checked out, which is the authoritative codebase.

---

## 1. Executive summary

| Dimension | Status | Evidence |
|---|---|---|
| Repository integrity | ⚠️ PASS (structure) | 68,289 tracked files; clean tree except 14 new untracked files |
| TypeScript type check | ❌ **FAIL** | `tsc --noEmit` → **91 errors in 31 files** (exit 2) |
| ESLint | ❌ **FAIL** | `eslint .` → **2 errors** (both introduced by this session's new code) |
| Unit/integration tests | ❌ **FAIL** | `vitest run` → **19 files / 25 tests failed**, 3400 passed |
| Production build | ❌ **FAIL** | `next build --webpack` → **OOM + SIGABRT** (reproducible, 88 s) |
| Prisma client generation | ⛔ **BLOCKED** | `prisma generate` needs `binaries.prisma.sh` (network-blocked) |
| Database | ⛔ **BLOCKED** | No live DB; MySQL required; 604 models but client is a stub |
| Environment config | ⚠️ **MISSING** | 242 documented vars; **no `.env` file present** |
| Auth / security gate | ✅ Present | `src/proxy.ts` (662 lines) fail-closed route gate |

**Overall status: NOT production-ready.** The application is a very large, feature-rich
monolith (457 pages, 1,034 API routes, 604 Prisma models) whose compile-time and
build-time gates are currently red. Three independent, reproducible failure modes block
a green build: (1) stale/ungenerated Prisma client, (2) 91 TypeScript errors, (3) a
production build that exhausts memory on a 4 GB host.

---

## 2. Inventory

### 2.1 Git
- Branches: `main`, `arena/00d5c43f-alo-web-crm-tech` (+ `origin/main`)
- Tags: **0**
- HEAD: `e4e3d75a` — "Merge pull request #37 from tech360-bd/codex/language-prep-catalog-20261026"
- Remote: `origin = https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git`

### 2.2 File counts (method: `find`/`git ls-files`, excluding `.git`, `node_modules`, `.next`)
| Metric | Count |
|---|---|
| Tracked files | **68,289** |
| Files on disk (excl. node_modules/.next/.git) | 68,303 |
| Directories | 8,796 |
| Untracked, non-ignored | 14 (all new super-admin command-center files from this session) |
| Ignored files reported by git | 0 (node_modules is gitignored but was absent at audit start) |

### 2.3 Route inventory
| Type | Count |
|---|---|
| `src/app/**/page.tsx` | **457** |
| `src/app/**/layout.tsx` | 6 |
| `src/app/api/**/route.ts` | **1,034** |
| `route.tsx` (API) | 0 |
| `src/proxy.ts` (route gate) | 1 (662 lines) |
| `next.config.ts` | 1 |

Top API groups: `admin` (94), `crm` (87), `phd` (51), `visa` (43), `employee-access` (40),
`employee` (37), `marketing` (34), `student` (32), `brains` (28), `counselor` (26),
`partner` (24), `applications` (23), `ai-workforce` (22), `communications` (21),
`student-portal` (18), `integrations` (16), `course-finder` (16), `hrm` (14),
`cron` (14), `whatsapp` (13), `seo` (13), `university-monitoring` (12), `agentos` (11),
`website` (10), `video-engine` (10).

### 2.4 Database (Prisma)
- `prisma/schema.prisma`: **604 models**, 13,649 lines
- Datasource: `provider = "mysql"`, `url = env("DATABASE_URL")`
- Migrations: **41** directories under `prisma/migrations`
- Seed scripts: **25** (`prisma/seed*.ts`)
- Generated client at audit time: `node_modules/.prisma/client/index.d.ts` = **3,989 bytes**
  → a **stub**, not the real 604-model client. Cause: `prisma generate` could not download
  the query engine (`binaries.prisma.sh` blocked).

### 2.5 Dependencies
- dependencies: **94**, devDependencies: **9**
- Runtime: Node **v22.22.3** (engines require `22.x`), npm 10.9.8
- Key stack: Next.js **16.4.2**, React 19, Prisma 6, Tailwind CSS, webpack (build)
- `recharts@2.15.4` is declared but deliberately not used by new chart code (OOM protection)

### 2.6 Environment variables
- `.env.example` documents **242** variables (names only — values redacted here).
- `.env.production.example` (14,289 B) and `.env.ai-gateway.example` (4,178 B) also present.
- **No actual `.env` file exists** in the checkout → the app cannot boot without
  configuration. Examples span: `DATABASE_URL`, `AUTH_SECRET`, `ALO_CRON_SECRET`,
  many AI provider keys (`AI21_API_KEY`, `CEREBRAS_API_KEY`, …), WhatsApp numbers, etc.

### 2.7 Documentation
- `docs/` exists with prior audits/reports (e.g. `ALO-EDUCATION-FULL-AUDIT.md`,
  `ALO-EDUCATION-PRODUCTION-COMPLETION-REPORT.md`, `ALO_PLATFORM_CURRENT_GAP_AUDIT.md`,
  `ALO_WEB_CRM_100X_COMPLETE_READY.md`). These will be reconciled by the merge map.

---

## 3. Quality-gate results (actual commands)

### 3.1 TypeScript — ❌ FAIL
Command: `./node_modules/.bin/tsc --noEmit -p tsconfig.json`
Result: **exit 2**, **91 errors in 31 unique files** (105 s).

Breakdown:
- **31 errors** reference the Prisma namespace / client types
  (`Prisma.InputJsonValue`, `PartnerMarketingRequest`, `EnglishPrepRequirementWhereInput`,
  `FileMetadataWhereInput`, `CrmCourseRequirementWhereInput`). **Root cause: stub Prisma
  client** — all five models **do exist** in `schema.prisma`, so these clear once
  `prisma generate` succeeds. Marked **environmental / BLOCKED**, not code defects.
- **60 errors** are genuine source issues: property access on `{}`-typed values,
  `Type '{}' is not assignable to type 'number'`, `Untyped function calls may not accept
  type arguments`, null-assignment to `Date | null`. Affected:
  `api/assets`, `api/crm/communications/inbox`, `api/crm/interview-practice`,
  `api/crm/interview-review`, `api/hr/analytics`, `api/rules/active`,
  `api/visa/sensitive-review/[caseId]`, `api/webhooks/deliveries`,
  `lib/accounting/ledger.ts`, `lib/ai-workforce/telemetry.ts`, and more.

### 3.2 ESLint — ❌ FAIL
Command: `./node_modules/.bin/eslint . --max-warnings=-1`
Result: **exit 1, exactly 2 errors, 0 warnings** — and **both are in this session's new
code** (the rest of the repo is lint-clean):
1. `src/components/admin/super-admin-command-center/charts.tsx:33` —
   `react-hooks/immutability`: "Cannot reassign variable after render completes" (`acc += fraction`).
2. `src/components/admin/super-admin-command-center/ai-eos/AiEosMasterBlueprint.tsx` —
   `react-hooks/use-memo`: flagged `React.useMemo(buildRoadmap, [])`.

### 3.3 Tests — ❌ FAIL
Command: `./node_modules/.bin/vitest run`
Result: **19 test files failed / 298 passed / 4 skipped (321 files)**;
**25 tests failed / 3,400 passed / 38 skipped (3,463 tests)** (80 s).

Failing files:
- `tests/unit/{accounting-ledger, ai-security-remediation, application-risk-score, business-hours-policy, cms-revisions, critical-safety-remediation, design-tokens, journal-integrity, student-success-score}.test.ts`
- `tests/unit/phd/{auth-access, storage-security}.test.ts`
- `tests/integration/{communication-ownership, content-publication-security, employee-access-live-db, language-prep-catalog-live-db, owner-ai-chat-live-db, partner-b2b-security, webhook-security-live-db}.test.ts`
- `tests/integration/phd/services.test.ts`

Caveat: several failures (e.g. `cms-revisions` DMMF checks, `journal-integrity`
"instanceof", and all `*-live-db` integration tests) are confounded by the **stub Prisma
client** and the absence of a live database. They cannot be fully triaged without
`prisma generate` + a MySQL instance.

### 3.4 Production build — ❌ FAIL
Command: `ALO_BUILD_HEAP_MB=3072 SKIP_CMS_DB=1 ./node_modules/.bin/next build --webpack`
Result: **exit 1**, ~88 s, **OOM**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
Next.js build worker exited with code: null and signal: SIGABRT
```
This reproduces the OOM previously documented. The build never reached the "Compiling
routes" summary. On a 4 GB host, a 457-page / 1,034-API-route monolith cannot complete.
**Note:** `npm run build` additionally runs `prisma generate` first, which is separately
BLOCKED, so the build fails even earlier in the canonical script.

### 3.5 Prisma generate — ⛔ BLOCKED
Command: `./node_modules/.bin/prisma generate`
Result: **fails** — `request to https://binaries.prisma.sh/.../schema-engine.gz.sha256 failed`
(network allowlist). The query engine binary cannot be fetched, so the real client cannot
be generated. This blocks type-checking fidelity, tests, and the canonical build.

---

## 4. Architecture & security observations

- **Route gate:** `src/proxy.ts` (662 lines) is a fail-closed Next.js server-proxy that
  whitelists public routes and gates portal/admin/API routes behind JWT auth. Comments show
  deliberate fixes (e.g. `/course/[slug]`, `/apply/[course-slug]`, `/guides` added to the
  public list so SEO/crawlers work; `/visa-support` legacy alias removed).
- **Auth providers:** `next-auth/jwt` used (`getToken`); portal auth via
  `/api/portal-auth/{login,register,forgot-password}`.
- **AI agent surface:** `api/ai-workforce`, `api/agentos`, `api/brains`, `api/ai-command`
  exist; a prior audit asserted schema-mutation endpoints are disabled (confirmed by a
  `critical-safety-remediation.test.ts` suite, currently failing — needs triage).
- **No live DB/Docker/Playwright** in this sandbox → database, e2e, and container checks
  are **NOT RUN**.

---

## 5. Defect register (prioritized)

| # | Severity | Defect | Evidence | Repair plan |
|---|---|---|---|---|
| D1 | **Critical** | Production build OOM/SIGABRT | `next build` log | Reduce route/API surface, split monoliths, raise CI heap — **large, needs plan** |
| D2 | **Critical** | Prisma client is a stub; `prisma generate` blocked | `index.d.ts` 3,989 B | Requires engine download (network) or vendored engine — **blocked** |
| D3 | **High** | 60 genuine TypeScript errors | `tsc` log | Type-annotate API handlers/libs; small, mechanical fixes |
| D4 | **High** | 19 failing test files | `vitest` log | Triage env-vs-real after D2; fix real assertions |
| D5 | **Medium** | 2 ESLint errors in new code | `eslint` log | Fix `charts.tsx` immutability + `AiEosMasterBlueprint` useMemo (do now) |
| D6 | **Medium** | No `.env` present | filesystem | Document required vars; do not commit secrets |
| D7 | **Low** | `recharts` declared but unused | package.json | Keep or remove deliberately |
| D8 | **Low** | Sibling repos inaccessible | `git ls-remote` → "not found" | Request access or confirm canonical repo |

---

## 6. Blockers requiring action

1. **Prisma engine download** — sandbox blocks `binaries.prisma.sh`. Needs either network
   access or a vendored engine to generate the client and run real DB tests.
2. **Live MySQL database** — required for `*-live-db` integration tests and runtime checks.
   None available in the sandbox.
3. **Memory** — 4 GB host cannot build the current monolith. Needs a larger CI runner or
   route-count reduction.
4. **Reference-site access** — marketing sites and the user's `engralaminn-collab/*` repos
   are unreachable from this sandbox; they could not be reviewed.

---

## 7. Proposed changes (next phase)

**Safe, immediate (no destructive action):**
- Fix D5 (2 lint errors in new code).
- Fix D3's 60 type errors in a reviewable, additive way (no behavior change).
- Produce the merge map, repair log, env-var doc, test matrix, deployment/rollback doc.

**Larger / needs authorization:**
- D1 build fix: reduce route count, modularize imports, raise CI heap — **not safely
  completable in-place without a plan**; will be proposed, not silently executed.
- D2/D4: cannot be fully resolved without engine download + live DB.

**Explicitly avoided:** deleting routes/tables, overwriting `.env`, running destructive
migrations, force-pushing, disabling security checks.

---

## 8. Verification commands used (actual results)

| Command | Result |
|---|---|
| `git rev-parse HEAD` | `e4e3d75a…` |
| `git ls-files \| wc -l` | 68,289 |
| `find src/app -name page.tsx \| wc -l` | 457 |
| `find src/app/api -name route.ts \| wc -l` | 1,034 |
| `grep -c '^model ' prisma/schema.prisma` | 604 |
| `tsc --noEmit -p tsconfig.json` | exit 2, 91 errors / 31 files |
| `eslint . --max-warnings=-1` | exit 1, 2 errors (new code) |
| `vitest run` | 19 files / 25 tests failed; 3,400 passed |
| `next build --webpack` | exit 1, OOM + SIGABRT |
| `prisma generate` | FAIL (network blocked) |
| `git ls-remote …/engralaminn-collab/*` | Repository not found |

*(Machine, OS, and command outputs are reproducible from this checkout.)*
