# Complete repository audit — 2026-10-25

**Branch:** `arena/fd119d66-alo-web-crm-tech` (HEAD `a3f3253f` + working changes)
**Method:** everything below was measured by running a command or reading a file in
this checkout. Nothing is estimated except where it is labelled as a heuristic.
**Status vocabulary:** PASS · FAIL · BLOCKED (could not run; reason given) ·
NOT RUN · N/A.

---

## 1. Size and inventory

| Metric | Value | How measured |
|---|---|---|
| Tracked files | **68 118** | `git ls-files \| wc -l` |
| Files in working tree (excl. `node_modules`, `.git`, `.next`, scratch) | **68 202** | `find . -type f` |
| Directories (same exclusions) | **8 697** | `find . -type d` |
| App routes (`page.tsx`) | **441** | `find src/app -name page.tsx` |
| API route handlers | **976** | `find src/app/api -name route.ts` |
| Layouts | 5 | `find src/app -name layout.tsx` |
| Components | **520** | `find src/components -type f` |
| Lib modules | **511** | `find src/lib -type f` |
| Prisma models | **599** | `grep -c "^model " prisma/schema.prisma` |
| Migrations | 38 (+12 legacy) | `prisma/migrations`, `prisma/legacy-migrations-20261001` |
| Scripts | 154 | `ls scripts` |
| Documentation files | 164 → 173 | `ls docs` after this pass |
| CI workflows | 4 (`ci`, `deploy-production`, `deploy-recovery`, `health-monitor`) | `.github/workflows` |

This is a large, real application, not a scaffold. Nothing in this repository is an
empty starter.

---

## 2. Gates that were actually executed

| Gate | Command | Result |
|---|---|---|
| Tests | `npx vitest run` | **PASS** — 959 suites, 3 529 tests, **3 396 passed, 0 failed, 133 skipped**, exit **0** |
| ESLint | `eslint . -f json` | **PASS** — **2 947 files, 0 errors, 1 warning** |
| TypeScript (whole repo) | `tsc --noEmit` | **BLOCKED** — exit 134 (heap OOM) at 2 560 MB |
| TypeScript (sharded) | 5 shards | components **PASS** (520 files), misc **PASS** (5 files); `lib`, `app/api`, `app/pages` shards **BLOCKED** (OOM at 2 048 MB) |
| Production build | `next build --webpack` | **BLOCKED** — worker `SIGABRT`, exit 1 (out of memory on a 3.9 GiB host); not a code failure |
| Import pipeline tests | `node scripts/test-import-pipeline.mjs` | **PASS** — formula injection, header aliasing, duplicate engine |
| Canonical CSV validation | `node scripts/test-canonical-import-validation.mjs` | **PASS** — 8/8 files, 0 errors |
| Env-var audit | `node scripts/audit-env-vars.mjs` | **PASS** — 102 unused, 166 with fallback, 20 fail-closed, 123 referenced, 12 public |
| Gateway verification | `bash scripts/verify-ai-gateway.sh` | **PASS** — 21 PASS / 0 FAIL / 1 BLOCKED / 1 NOT RUN |
| MySQL backup script | `bash -n` + real run | **PASS** — syntax OK; fails closed (`mysqldump` absent) |
| Restore test | — | **BLOCKED** — no MySQL, no dump |
| Database-dependent integration tests | 133 skipped | **BLOCKED** — no `TEST_DATABASE_URL` MySQL |

> The full type check and the production build **cannot complete on this 2 vCPU /
> 3.9 GiB sandbox**. That is an environment limit, evidenced twice (exit 134 and
> SIGABRT). It is not evidence that the code type-checks or builds — that must be
> run on the Hostinger host or a CI runner with ≥ 8 GB.

---

## 3. Checklist requested by the brief

| Item | Result | Evidence |
|---|---|---|
| Missing files | **None found** in app code | every import used by the 520-file component shard resolves |
| Missing folders | None affecting runtime | all `src/` subtrees present |
| Empty files | **1** — `src/components/website/public-pages/index.ts` | `find src -type f -empty`; no importer references it (dead barrel) |
| Files < 100 bytes | 9 | `find src -type f -size -100c` |
| Placeholder code | **1 fixed, 9 reviewed** | course page Compare button said "coming soon" → now opens the real `/compare`; `admin/courses` Duplicate button is deliberately disabled with an explanatory title; marketing n8n route logs `..._PLACEHOLDER_CREATED` honestly |
| TODO / FIXME in application code | **0** | 6 matches, all inside audit scripts describing what they search for |
| Broken imports / exports | **0 found** where the type checker could run | components + misc shards clean |
| Unused packages | **19 of 94** by heuristic | see §4 — not removed, because the heuristic false-positives on types/config-only packages and the build cannot be run to prove safety |
| Missing dependencies | None | `npm ci` completed: 1 317 packages |
| Missing environment variables | None blocking startup; 102 declared-but-unused | `scripts/audit-env-vars.mjs` |
| Missing configuration files | None | `.env.example`, `.env.production.example`, `prisma.config.ts`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `tsconfig*.json` (13) |
| Missing APIs / backend routes | **PhD module: 0 routes for 47 models** | `find src/app/api -ipath "*phd*"` → 0 |
| Missing frontend pages | **PhD module: 0 pages** | `find src/app -ipath "*phd*"` → 0 |
| Missing database tables | None identified; drift check **BLOCKED** | 599 models, 38 migrations; a real `migrate status` needs MySQL |
| Missing migrations | PhD migration exists (`20261025120000_phd_proposal_builder`, 47 tables) | file present; applied state unknown (BLOCKED) |
| Missing models | Present for catalogue, CRM, PhD, accounting, HR | schema read |
| Missing auth logic | None found | `src/lib/auth-middleware.ts` + 976 routes use `withAuth`/`getOptionalAuth` |
| Missing authorisation logic | None found in the sampled routes | `withAuth` role checks, `publicCourseWhere` gate, tenant tests in `tests/integration/partner-b2b-security.test.ts` |
| Missing validation | None found in sampled routes | Zod/custom validators present; import pipeline tested for formula injection |
| Missing security features | **Robots/rate-limit enforcement absent in crawler**; secret scan clean | `src/lib/official-crawlers/*` has UA but no `robots.txt` fetch or throttle; 0 hardcoded secrets; 0 `NEXT_PUBLIC_*` secrets |
| Missing deployment files | None — but the live path is external | Dockerfile, docker-compose, Caddyfile, nginx.conf, `deploy/ubuntu/*` all present and marked **legacy/disabled**; production is Hostinger cPanel |
| Missing Docker files | None | `.dockerignore`, `Dockerfile`, `docker-compose.yml` (legacy) |
| Missing Ubuntu scripts | None | `deploy/ubuntu/{deploy,backup,restore,rollback,health-check}.sh` (quarantined by design) |
| Missing backup system | **Partial** | `scripts/backup-mysql.sh` active and fail-safe; Hostinger schedule/retention not recorded; restore unproven |
| Missing monitoring | **Partial** | app health routes exist (`/api/health`, `/api/health/live`, `/api/cron/health`, `health-monitor.yml`); Prometheus/Grafana exist **only** for the AI gateway; not installed |
| Missing logging | Present | structured console logging across services; 103 `console.log` calls in `src/lib` are a noise/no-PII risk, not a missing feature |
| Missing SSL configuration | **Not in repo by design** | TLS terminates at Hostinger; nginx/Caddy TLS blocks are commented legacy examples |
| Missing production optimisations | Not measured | requires a successful build + runtime profiling (BLOCKED) |
| Missing documentation | **7 documents were missing → written this pass** | `docs/course-catalogue/*` (4), `docs/competitor-feature-benchmark.md`, `docs/backups/*` (2) |

---

## 4. Unused-package heuristic (not actioned)

Flagged as unreferenced by a static import scan: `@hookform/resolvers`,
`@mdxeditor/editor`, `@reactuses/core`, `@remotion/media-utils`,
`@tanstack/react-query`, `@tanstack/react-table`, `@types/fluent-ffmpeg`,
`@types/node`, `@types/react`, `@types/react-dom`, `autoprefixer`, `effect`,
`js-yaml`, `next-intl`, `react-markdown`, `react-syntax-highlighter`, `tsx`,
`tw-animate-css`, `uuid`.

`@types/*`, `autoprefixer` and `tsx` are legitimately used indirectly (type
resolution, PostCSS, npm scripts). The rest look genuinely unused. They were **not
removed**: with the build blocked by memory, removal cannot be proven safe, and the
brief forbids breaking a working system to satisfy a metric.

---

## 5. Errors by category

| Category | Result |
|---|---|
| Build errors | **Unknown** (BLOCKED by OOM). No build error was observed, because compilation never completed |
| TypeScript errors | **None found** in 525 files that were checked; the rest BLOCKED |
| ESLint errors | **0** across 2 947 files |
| Runtime errors | Not exercised: no server was started (would require a DB and a build) |
| Database errors | Not exercised (no MySQL). One real defect fixed: `tests/integration/phd` failed the whole `npm test` run when no DB was configured |
| API errors | Not exercised |
| Authentication errors | Covered by unit tests only (3 396 passing tests include auth/authorisation suites) |
| Deployment / Docker / Ubuntu / PM2 / Caddy errors | **N/A by design** — these artefacts are deliberately disabled; the throw in `ecosystem.config.cjs` and the `exit 1` in `deploy/ubuntu/*` are intentional guards, not defects |
| Security issues | 0 hardcoded secrets; 1 compliance gap (crawler has no robots/throttle); 1 misleading UX claim fixed (`"Course saved"` toast when nothing was saved) |
| Performance issues | Not measured (needs a running build) |
| Memory leaks | Not measured |
| Broken links / images | Not measured (no crawler, no network to the site) |
| Dead code | 1 empty unused barrel file; 19 possibly-unused packages; 103 `console.log` calls |
| Duplicate code | 3 overlapping SOP models (`SopDraft`, `AloSop`, `AiSop`) — a real consolidation candidate; not merged here because data may exist in all three |

---

## 6. Catalogue integrity — the most consequential finding

| Measure | Value |
|---|---|
| Institutions in the bulk master | 400 |
| Courses in the bulk master | 17 653 |
| Rows whose provenance is `Seeded Template Website` | **17 581 (97.4 %)** |
| Rows verified from an official source | **472 (2.6 %)** |
| Institutions whose catalogue is reachable | **1 of 400** |
| Courses publicly visible from that set | only the 472 verified rows pass `publicCourseWhere()` |

URLs in the bulk master follow `https://<domain>/courses/<slug-of-title>`
(2 464 of 4 000 sampled match the pattern exactly), and their provenance row is the
institution homepage with the note "Seeded ranking-based metadata". That is
constructed data, not captured data — it violates `source-policy.md` and must not be
imported as verified. Full measurements: `docs/course-catalogue/import-validation-results.md`.

**Mitigation already in place and verified:** the public API, detail pages and
sitemap all filter on `publicCourseWhere()` (published + VERIFIED + source-linked +
public university), so the seeded rows are not exposed to visitors or search engines.

---

## 7. Fixes applied during this audit

| # | Fix | Evidence |
|---|---|---|
| 1 | `tests/integration/phd/services.test.ts` now skips cleanly when no database is configured (matching the repo's `describe.skipIf(!HAS_TEST_DB)` convention) instead of failing the whole run | before: exit 1 with 1 failed suite; after: **exit 0** |
| 2 | Course page "Compare" no longer says "coming soon": it adds the course to the real compare list and navigates to `/compare?courses=…` | `src/components/alo/views/public-course.tsx`; components shard type-checks, ESLint clean |
| 3 | Course page "Save" no longer claims the course was saved: it states that signing in is required | same file |
| 4 | Seven missing deliverable documents written | `docs/course-catalogue/*`, `docs/backups/*`, `docs/competitor-feature-benchmark.md` |
| 5 | Verification-DB script no longer uses `--accept-data-loss` (earlier in this branch) | `tests/unit/critical-safety-remediation.test.ts` 46/46 |

---

## 8. Phased plan for what remains

**Phase A — make the gates runnable (blocks everything else).**
Run `tsc --noEmit` and `next build` on a machine with ≥ 8 GB RAM (or CI); fix whatever
surfaces. Until then no one can honestly claim "zero build errors".

**Phase B — PhD application surface (the largest functional gap).**
47 models and 45 service files exist with no route or page. Deliver, in order:
API routes guarded by `withAuth` (projects, topics, literature, proposals, funding,
applications, documents, commission), then `/student/phd/*` pages
(overview → profile → topics → comparison → evidence → proposal → funding →
applications → documents → outreach → timeline → sources). Acceptance criteria are
already written in the PhD brief; none can be marked done until its test runs.

**Phase C — research-degree catalogue in the public directory.**
Join `PhdProgramme`/`PhdSupervisor`/`PhdFundingOpportunity` to public routes behind
`publicCourseWhere()`-style gating, with the three separate deadline fields.

**Phase D — catalogue remediation.**
Delete the seeded provenance claims (not the rows) or mark every one
`NEEDS_REVIEW` in the database; add robots.txt + throttling to the crawler; add
per-field provenance; wire the scheduled link checker.

**Phase E — SOP consolidation.**
Merge `AloSop`/`AiSop` into `SopDraft` with export + review-status fields; verify
DOCX/PDF generation from saved content.

**Phase F — operations.**
Record the Hostinger backup schedule and perform a real restore drill; then, and
only then, state an RPO/RTO.

---

## 9. Honest summary

* The application is large, structured, and in good static health: **0 ESLint
  errors, 0 failing tests, no hardcoded secrets, no TODO/FIXME in app code**.
* It **cannot be built or fully type-checked in this environment**; those two gates
  are BLOCKED, not passed.
* Its largest functional gap is the **PhD module's missing API/UI surface**.
* Its largest data-integrity problem is the **97 % seeded catalogue**, which is
  already quarantined from the public site but still present in the repository.
* Backup recoverability is **unproven**.
