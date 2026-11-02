# ALO Education — Complete Repository Audit (Phase 0A–0F)

> **Phase 0C has since revised three findings in this folder.** Before acting on reports 5 or 8, read
> [`phase0c/`](phase0c/) — specifically `phase0c/07-SECURITY-AND-TEST-ROOT-CAUSE.md` and
> `phase0c/08-GO-LIVE-BLOCKER-REPORT-REVISED.md`. The "7 unauthenticated endpoints" claim is
> **withdrawn** (a fail-closed Next 16 proxy gate protects all seven), and the "31 failing tests"
> are **unmeasured** (the Prisma client cannot be generated in the audit environment). The catalogue
> finding, by contrast, got worse: **0 of 8 courses meet the field-level `VERIFIED` rule.**

**Date:** 2026-11-02 · **Branch:** `arena/ececf40c-alo-web-crm-tech` @ `7e4c3922` (base `main` @ `1e30e812`)
**Mode:** read-only. **Nothing in this folder is committed.**
**No application file, schema, database, import, branch, PR or deployment was modified, merged, reverted or executed.**

> This is the **completed** run: the nine deliverables plus the Phase 0B per-file record (purpose, dependencies, reverse edges, disposition) and a cross-directory snapshot comparison. A defect found in my own first-pass orphan metric was corrected (§ "Correction log").

## The nine deliverables

| # | Report | What it answers |
| --- | --- | --- |
| 1 | [REPOSITORY-COMPLETE-FILE-INVENTORY.md](REPOSITORY-COMPLETE-FILE-INVENTORY.md) | Every directory and file; coverage accounting; all exclusions with reasons; per-file audit record; cross-directory comparison |
| 2 | [FEATURE-IMPLEMENTATION-MATRIX.md](FEATURE-IMPLEMENTATION-MATRIX.md) | 26 capabilities × implemented / connected / tested / deploy-ready / proven |
| 3 | [UNIVERSITY-COURSE-DATA-INVENTORY.md](UNIVERSITY-COURSE-DATA-INVENTORY.md) | Every university/course dataset, exact counts, unique keys, synthetic vs verified |
| 4 | [DUPLICATE-AND-CONFLICT-REPORT.md](DUPLICATE-AND-CONFLICT-REPORT.md) | Byte-identical copies, competing implementations, conflicting values |
| 5 | [FRONTEND-BACKEND-PORTAL-AUDIT.md](FRONTEND-BACKEND-PORTAL-AUDIT.md) | 465 pages, 1,099 APIs, 12 portals, linkage, auth coverage |
| 6 | [DATABASE-SCHEMA-AND-STORAGE-AUDIT.md](DATABASE-SCHEMA-AND-STORAGE-AUDIT.md) | 618 models, 212 unused, migrations, storage, backups |
| 7 | [GIT-BRANCH-PR-RECONCILIATION.md](GIT-BRANCH-PR-RECONCILIATION.md) | 94 branches, 47 PRs, unmerged work, commit `7e4c3922` review |
| 8 | [MISSING-AND-BROKEN-FUNCTIONS.md](MISSING-AND-BROKEN-FUNCTIONS.md) | P0→P3 defects, dead surface, missing capability |
| 9 | [SAFE-GO-LIVE-READINESS-REPORT.md](SAFE-GO-LIVE-READINESS-REPORT.md) | 17 go-live gates, 3 blockers, minimum path |

## Machine-readable inventory

| File | Contents |
| --- | --- |
| `inventory-enriched.csv` | **9,789 rows** — path, area, role, ext, bytes, lines, **SHA-256**, tracked, **disposition, purpose, exports, internal dependencies, imported-by, audit note** |
| `inventory.csv` | Base snapshot (same 9,789 rows) |
| `inventory-summary.json` | Totals, per-role/per-area rollups, excluded trees, duplicate groups |
| `snapshot-comparison.json` | `src/` vs each imported snapshot: 68 identical / 324 differ / 316 only-in-snapshot |
| `doc-claims.json` | **74 documents** carrying completeness claims, for cross-checking |
| `usage-analysis.json` | Import graph: entry points, orphans, unreferenced routes, unused models |
| `datasets.csv` / `dataset-summary.json` | **2,014 dataset files**: rows, keys, duplicates, https-source share, status vocabulary |
| `git-reconciliation.json` | 47 PRs, 94 branches, per-branch compare-to-main |
| `portal-linkage.json` · `api-auth-scan.json` · `unreferenced-api-routes.txt` | Page linkage, per-route guards (1,099), uncalled routes (123) |
| `build-inventory.py` · `analyze-usage.py` · `inventory-datasets.py` · `enrich-inventory.py` | The four reproducible audit scripts |

## Headline numbers

- **3.8 GB** repository · **149,902** files · **9,789** inspected · **140,183** third-party files excluded (2.34 GB) · **0** unreadable · nothing skipped without a reason.
- **3,372** redundant duplicate files (**550.7 MB** reclaimable) in **1,576** hash groups.
- **2,699** first-party code files: **465** pages, **1,099** API routes, **555** components, **554** lib modules; **8,509** resolved internal dependency edges.
- Dispositions: **1,575** entry points · **898** active modules · **226 dead** · **33 test-only** · **2,266** stale-snapshot · **580** nested-copy · **2,014** data · **528** docs · **434** binary.
- **95** portal pages nothing links to · **123** API routes nothing calls · **212 of 618** Prisma models unused · **4** competing Super-Admin dashboards · **132-file** parallel UI library.
- **817/1,099** routes have a recognised guard; **7** routes have **no authentication at all**; **102** mutating routes need triage.
- Tests: **3,447 pass / 31 fail** (22 files, verified pre-existing) · integration & e2e **not run** · ESLint **0 errors**.
- Data: **3.9 M** dataset rows, almost all duplication; **70** identity-verified institutions (AU 44, NZ 8, IE 18); **8** verified courses; **0** destinations with course coverage.
- Git: **0 open PRs**; **47 of 48** non-PR branches are 0 commits ahead of `main`; the only unmerged code is `7e4c3922`.

## Correction log (self-audit of my own metrics)

| Issue found in first pass | Correction |
| --- | --- |
| "258 orphan modules" quoted without a checkable definition | Re-measured with reverse-edge tracing: **226 imported by nothing at all**, **33 imported only by tests/scripts**. Both reported separately. |
| An intermediate version of my enrichment script counted importers **inside** `imports/*/src` (where `@/` resolves onto the current `src/`), which wrongly "revived" 82 dead files | Fixed: importer edges are counted only from `src/`, `tests/`, `scripts/`. The 82 files were restored to *dead*. |
| "7 endpoints with no auth at all" (report 8, B1) | **Withdrawn in Phase 0C.** A regex over handlers cannot see `src/proxy.ts`, which is the Next 16.4.2 middleware and returns 401/403 for all seven. See `phase0c/07` §1. |
| "31 tests fail, pre-existing, CI is red" (report 8, B2) | **Unmeasured, not failed.** Every sampled failure is `Cannot find module '.prisma/client/default'`; `prisma generate` needs `binaries.prisma.sh`, unreachable in the audit sandbox. See `phase0c/07` §6. |
| "8 verified courses" | 7 `VERIFIED` + 1 `PARTIALLY_VERIFIED` + 3 `NEEDS_REVIEW`, and **0 of 8** cover all 10 core field groups. See `phase0c/02` §2 and `phase0c/04` §2. |
| 4,714 files "without a purpose" | 0 remain after the purpose ladder; 4,645 of 5,679 first-party purposes are inferred (`structural`/`type_only`), only 1,034 are documented. See `phase0c/06`. |
| Ireland counted as two countries | Regulator label normalised: **19** Irish institutions, not 18 + 1. See `phase0c/01` §4. |
| Non-code files inside `src/` (1 README, 2 PNG assets) were briefly classified as orphans | Reclassified as `documentation` / `asset`. |

## What could not be verified (and why)

| Item | Reason |
| --- | --- |
| Live database rows, schema validity, migration drift | No `DATABASE_URL`, no MySQL, Prisma engine download blocked |
| Typecheck | Needs generated Prisma client |
| Integration tests (14 suites) | Require `TEST_DATABASE_URL` |
| E2E tests (6 specs) | Require running server + Playwright browsers |
| Production/staging identity and deployment pipeline | Not determinable from the repository |
| Contents of 140,183 `node_modules` files | Third-party dependencies, excluded by design |

**Next action is an owner decision, not more code.** The three go-live blockers and the eight-step minimum path are in report 9; the three snapshot families needing a keep/retire decision are in report 1 §6.
