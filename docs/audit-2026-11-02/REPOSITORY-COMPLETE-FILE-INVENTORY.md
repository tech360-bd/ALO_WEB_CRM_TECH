# 1 · REPOSITORY — COMPLETE FILE INVENTORY

**Repository:** `tech360-bd/ALO_WEB_CRM_TECH`
**Branch audited:** `arena/ececf40c-alo-web-crm-tech` @ `7e4c3922` (base `main` = `1e30e812`)
**Audit date:** 2026-11-02 · **Mode:** read-only (nothing modified, staged or committed)
**Machine-readable companions**
- [`inventory-enriched.csv`](inventory-enriched.csv) — **the Phase 0B record**: one row per inspected file with path, area, role, ext, bytes, lines, **SHA-256**, tracked, **disposition**, **purpose**, **exports**, **internal dependencies**, **imported-by (reverse edges)** and an audit note.
- [`inventory.csv`](inventory.csv) — the base snapshot the enrichment was built from (same 9,789 rows).
- **Raw rollups:** [`inventory-summary.json`](inventory-summary.json), [`usage-analysis.json`](usage-analysis.json), [`datasets.csv`](datasets.csv), [`dataset-summary.json`](dataset-summary.json), [`git-reconciliation.json`](git-reconciliation.json), [`portal-linkage.json`](portal-linkage.json), [`api-auth-scan.json`](api-auth-scan.json), [`snapshot-comparison.json`](snapshot-comparison.json), [`doc-claims.json`](doc-claims.json)
- **Reproducible scripts:** `build-inventory.py`, `analyze-usage.py`, `inventory-datasets.py`, `enrich-inventory.py`

### Per-file audit record (Phase 0B items 1–4)

| Field | Coverage |
| --- | --- |
| Complete relative path + checksum + type + size | 9,789 / 9,789 files |
| Purpose / functionality statement | **5,075** files (all code, docs and text; datasets carry a header/keys description; binaries are labelled as binaries) |
| Internal dependency edges (resolved first-party imports) | **8,509** edges |
| Reverse edges (who imports this file) | every code file |
| Disposition (active / entry_point / orphan / data / documentation / asset / binary / stale_snapshot / nested_copy) | 9,789 / 9,789 |

Resolved dispositions: **1,575 entry points · 898 active app modules · 226 dead · 4 assets · 1 doc-in-src · 2,266 stale-snapshot · 580 nested-copy · 2,014 data · 528 documentation · 434 binary.**

**Definition used for "dead":** no importer anywhere in the project. A further **33** modules are imported *only* by `tests/` or `scripts/` — not reachable from the running app but still exercised by tooling (e.g. `src/lib/course-finder/intake-window-backfill.ts`, `src/lib/data-normalizer.ts`, `src/components/website/YouTubeEmbed.tsx`). Reporting the two separately avoids both overstating and understating dead code.

---

## 1. Coverage accounting (no silent exclusions)

| Measure | Value |
| --- | --- |
| Repository on disk | **3.8 GB** |
| Files present (all depths, excluding `.git` internals) | **149,902** |
| **First-party + data files inspected** | **9,789** (1.046 GB) |
| Third-party dependency files excluded (recorded below) | **140,183** (2.34 GB) |
| `.git` object store (not enumerated; by design) | 245 MB |
| Unreadable files | **0** |
| Files skipped **without** a recorded reason | **0** |
| Tracked / untracked among inspected | 9,784 / 5 at snapshot time (subsequent files written by this audit under `docs/audit-2026-11-02/` are naturally not inside the snapshot) |

### Every exclusion, with reason

| Path | Files | Size | Reason for exclusion | Inspected instead as |
| --- | --- | --- | --- | --- |
| `node_modules/` | 81,425 | 1,471.2 MB | Third-party npm dependency tree, not ALO source | `package.json`, `package-lock.json` (lockfileVersion recorded) |
| `imports/alo-education-full/node_modules/` | 58,758 | 866.7 MB | Third-party npm dependency tree inside an imported snapshot | that snapshot's `src/` was inspected (708 files) |
| `.git/` (objects, packs) | — | 245 MB | Git object database, not project files | branch/commit/PR analysis in report 7 |

Nothing else was excluded. Legacy, archived, imported, nested-project and generated directories **were** walked and classified (see §2).

---

## 2. What the repository actually contains (by area)

| Area | Files | Size | Nature | Disposition |
| --- | --- | --- | --- | --- |
| `src/` | 2,704 | 22.8 MB | **Active Next.js application** | Audited file-by-file (§4) |
| `imports/` | 2,435 | 49.2 MB | Imported snapshots: `alo-education-full`, `alo-education-source` (708 src files each), `legacy-branch-references` (735 `.txt` copies) | Classified; 316 src paths exist **only** here (report 4) |
| `alo-education-web-crm-final/` | 1,518 | 385.5 MB | **Nested full-project copy** (no `src/`, but duplicated CSVs, docs, 50 MB JSON, 46 MB txt report) | Verified as stale duplicate content |
| `storage/` | 918 | 0.1 MB | Runtime artefact area (`official/`, `outputs/`, `student-partner/`): 604 json, 301 txt, 8 html, 5 pdf | Audited (report 6) |
| `docs/` | 515 | 180.1 MB | Documentation **plus** large duplicate import packages | Audited (report 4) |
| `(root)` | 397 | 354.8 MB | 111 CSVs, 195 markdown reports, root configs, seed/fix scripts | Audited (reports 3, 4) |
| `tests/` | 353 | 2.2 MB | 326 unit + 14 integration + 6 e2e + helpers | Audited (report 9) |
| `scripts/` | 198 | 4.6 MB | Data collection, seeding, audit, deploy, backup | Audited |
| `AUDIT/`, `AUDIT-2026-09-09/`, `audit/` | 178 | 4.5 MB | **Prior audits (reusable)** incl. Phase 1 institution inventory | Recovered (reports 3, 7) |
| `public/` | 150 | 14.5 MB | Static assets (webp/png/svg/fonts) | Inventoried |
| `deploy-build/`, `deploy/` | 118 | 13.4 MB | Deployment bundles + `alo_education_production.sql` | Audited (report 6) |
| `prisma/` | 91 | 3.6 MB | Schema (618 models), 48 migrations, 12 legacy migrations, 43 seed/verify scripts | Audited (report 6) |
| `data/` | 58 | 5.7 MB | **Genuine researched data** (verified-2027, official-source-audit, catalogue-review) | Recovered (report 3) |
| `backend/`, `services/`, `mini-services/`, `monitoring/`, `agents/`, `agent-ctx/`, `database/`, `reports/`, `evidence/`, `deliverables/`, `documentation/`, `external/`, `examples/`, `fixtures/`, `public_html/`, `_original_archives/`, `test-results/`, `.github/`, `.zscripts/`, `.repair-backup-20260819/`, `delivery-evidence-20260731-043211/` | 243 | 2.9 MB | Supporting/legacy/mini-service/CI artefacts | Inventoried |

### By role (machine rollup, `inventory-summary.json`)

| Role | Files | Size |
| --- | --- | --- |
| imported snapshot | 2,435 | 49.2 MB |
| nested project copy | 1,508 | 385.5 MB |
| **api route** | **1,100** | 4.7 MB |
| dataset json | 740 | 81.1 MB |
| documentation | 628 | 23.2 MB |
| **ui component** | **555** | 10.6 MB |
| **lib module** | **554** | 5.7 MB |
| **page route** | **484** | 1.7 MB |
| text report | 410 | 71.7 MB |
| test | 363 | 2.3 MB |
| dataset csv | 296 | 371.9 MB |
| script | 198 | 4.6 MB |
| public asset | 150 | 14.5 MB |
| binary asset | 120 | 9.7 MB |
| db migration | 48 | 0.9 MB |
| db schema/seed | 43 | 2.7 MB |
| root config | 32 | 0.2 MB |
| other / app_other / other_code | 93 | 0.7 MB |
| audit artefact | 16 | 0.4 MB |
| dataset sql | 11 | 5.3 MB |
| ci config | 5 | <0.1 MB |

---

## 3. Active application shape (first-party, `src/`)

| Measure | Value | Method |
| --- | --- | --- |
| `src/` code files (.ts/.tsx/.js/.jsx/.mjs/.cjs) | **2,699** | walk + `usage-analysis.py` |
| Page routes (`page.tsx`) | **465** | path match |
| API route handlers (`route.ts`) | **1,099** | path match |
| Layouts | **6** | path match |
| Entry points (page/layout/route/notFound/error + `proxy.ts`) | 1,575 | import-graph roots |
| Components | 555 files in 20 directories | `components/alo` 132, `crm` 64, `website` 51, `ui` 50, `student` 44, `admin` 35, `marketing` 32, `employee` 24, `partner` 23, `communication` 21, `course-finder` 20, `phd` 13, `diagrams` 11, `auth` 6, `language-prep` 6, `analytics` 4, `counselor` 3, `shared` 3, `portals` 2, `visa` 2 |
| Lib modules | 554 files; largest families: `phd` 52, `video-engine` 47, `ai-workforce` 26, `course-finder` 17, `email-marketing` 12, `communication` 11, `ucc` 11 |
| Prisma models | **618** total, **212 referenced by no code** | regex over `src/`+`scripts/` |
| ESLint (2,699 files) | **0 errors, 1 warning** | `npx eslint src` (run 2026-11-02) |

---

## 4. File-by-file audit dispositions

Every inspected file has a machine row in `inventory.csv`. Dispositions applied:

| Disposition | Meaning | Count (representative) |
| --- | --- | --- |
| **ACTIVE** | Entry point reachable from the app or imported by an active module | 2,441 src files, 353 tests, 5 workflows |
| **ACTIVE-DATA** | Genuine researched data, reusable | `data/verified-2027` (10 uni / 8 courses / 104 months / 30 evidence), `data/official-source-audit`, `data/catalogue-review`, `AUDIT/PHASE1_*` |
| **ORPHAN (dead)** | First-party module imported by nothing anywhere | **226** (`src/components/alo` 100, `src/components/ui` 20, communication 13, course-finder 8, video-engine 7, website 6, …) |
| **ORPHAN (test-only)** | Imported only by `tests/` or `scripts/`, never by the app | **33** |
| **UNLINKED-ROUTE** | Page/API that no first-party code references | 95 portal pages; **123** API routes |
| **DUPLICATE** | Byte-identical copy elsewhere (SHA-256 match) | 3,372 redundant files; 550.7 MB reclaimable |
| **STALE-SNAPSHOT** | Imported copy of an older/newer project state | `imports/alo-education-full` 708, `imports/alo-education-source` 708, `imports/legacy-branch-references` 735 |
| **NESTED-COPY** | Full project duplicated inside the repo | `alo-education-web-crm-final/` 1,518 files / 385.5 MB |
| **GENERATED** | Produced by scripts/seeds, not hand-authored source of truth | root CSV masters (111 files), `FULL_PROJECT_MASTER_REPORT.txt` (46 MB), `tsc-errors.txt` |
| **THIRD-PARTY** | Excluded dependency code | 140,183 files |
| **DOCUMENTATION** | Reports/plans/audits (628 files + 410 txt reports) | Includes 195 root `.md` + 141 `docs/*.md` |

---

## 5. Prior audits recovered (do not redo)

| Artefact | Contents | Reuse |
| --- | --- | --- |
| `AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv` | **70 institutions with official sourcing**: Australia 44 (TEQSA/TQNR), New Zealand 8, Ireland 18 | Phase-1 baseline; extend, don't restart |
| `AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv` | 32 official sources with access evidence | Source register seed |
| `AUDIT/PHASE1_OFFICIAL_SOURCE_VERIFICATION_2026-10-29.md` | UK OfS 425 / Scotland 19-18 / Wales 11 / NI 4+17, TEQSA vs data.gov.au count discrepancy, Adelaide merger conflict | Factual findings to carry forward |
| `AUDIT/ARENA-ROUTE-INVENTORY.csv` | **818 routes** with class/methods/auth | Drift baseline (see report 7) |
| `AUDIT/ARENA_FILE_MERGE_MANIFEST.csv` (5,287 rows), `ARENA-FINAL-FILE-MANIFEST.csv` (104) | Prior file manifests | Cross-check with `inventory.csv` |
| `AUDIT/catalogue-phase0|1-2026-10-12`, `course-finder-2026-10-12`, `final-blockers-2026-10-11`, `historical-catalogue-reports-2026-10-12` | Prior catalogue audits | Read before new catalogue work |

**Drift measured:** prior route inventory 818 files → current **1,099** (**+281 added, 0 removed**). Prior manifest lists 5,287 files; current tracked set is 68,542 paths (the prior manifest covered only the app package).

---

## 6. Cross-directory comparison (Phase 0B item 5)

`src/` was compared file-by-file against both imported snapshots ([`snapshot-comparison.json`](snapshot-comparison.json)):

| Snapshot | Identical to current | Differs | **Present only in snapshot** |
| --- | --- | --- | --- |
| `imports/alo-education-full/src` | 68 | 324 | **316** |
| `imports/alo-education-source/src` | 68 | 324 | **316** |

The **316 snapshot-only paths** by family: `components/alo` 121, `app/api` 105, `components/platform` 38, `lib/ai` 14, `components/diagrams` 9, `lib/offline` 8, `lib/view-registry` 4, plus singles (including two committed `app/page.tsx.bak` / `.bak2` backups).

Sampling confirms **structural successors exist** for most API families — `api/ai/agents|chat|approvals` → current `agentos/*`, `ai-agents`, `ai-command/agents`, `ai-workforce/agents` — so they were renamed/refactored rather than lost. Three families have **no same-name successor** and need per-file confirmation before being declared superseded: `components/platform` (38), `lib/offline` (8), `lib/view-registry` (4). Current `components/pwa` and `components/realtime` are the likely successors but this is unverified.

## 7. Documentation claims vs measured reality

[`doc-claims.json`](doc-claims.json): **74 documents** in the repository contain completeness claims ("100 % complete", "production-ready", "all universities collected", …). They are cross-checked in report 3 and report 8 §E; the measured position is 70 identity-verified institutions and 8 verified courses. These documents must not be cited as evidence of coverage.

## 8. What this inventory does **not** cover (explicit limits)

1. **`node_modules` contents** — excluded by design (140,183 files). Dependency risk is covered by `package-lock.json`, `npm audit` in CI, and `scripts/ci/npm-security-audit.mjs`.
2. **`.git` object internals** — not enumerated; branch/commit analysis is in report 7 via `git` + GitHub API.
3. **Runtime/database state** — no `DATABASE_URL`, no MySQL client; **0 live rows were read**. Anything about live data in these reports is a **file-level** statement and is labelled as such.
4. **Semantic review of every sentence in 628 documents + 410 txt reports** — dispositions and claim detection are automated; the 74 documents carrying completeness claims are listed, but not every line of every report was re-read.
5. **Compiled/binary assets** — 434 binary files were checksummed and sized, not visually reviewed.
6. **Per-file purpose for binaries and opaque datasets** — described at the file-type level, not line-by-line.

**Coverage claim:** every first-party and data file on disk (9,789) now has path, checksum, type, size, disposition and audit note; 5,075 carry a purpose statement and 8,509 internal dependency edges are resolved. No required file remains uninspected. The six limits above are the only exceptions and each is named.
