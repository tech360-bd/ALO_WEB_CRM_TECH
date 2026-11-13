# Phase 0C — Catalogue Recovery, Evidence Validation & Blocker Analysis

**Completed:** 2026-11-02 · **Branch:** `arena/ececf40c-alo-web-crm-tech` · **Base:** `1e30e812`
**Status:** deliverables prepared, **uncommitted**, awaiting approval.
**Nothing was deleted, renamed, restored, overwritten or merged. No application code changed.
No database connection was opened. No seeds, migrations, imports, updates or deletes were prepared.**

---

## What Phase 0C established, in five lines

1. **Zero courses meet the field-level `VERIFIED` rule.** 8 real courses exist; the best covers 6 of 10
   core field groups, and none covers fee *and* English requirement *and* academic year together.
2. **79 identity-verified institutions are 78 distinct** — identity proves a university exists, never
   that a course runs.
3. **The "7 unauthenticated endpoints" finding was wrong.** A fail-closed Next 16 proxy gate protects
   all of them; the real gap is one latent route behind dead navigation.
4. **The "31 failing tests" are unmeasured**, not failed: the Prisma client cannot be generated in this
   sandbox, and every sampled failure is that missing module.
5. **Navigation is wired to a view registry that exists only in an archive** — eight files call
   `onNavigate("public-country")` and nothing in `src/` maps that name.

## Deliverables

| # | File | Contents |
|---|---|---|
| 01 | `01-CANONICAL-RECOVERY-INVENTORY.md` | 593 institutions · 8,746 courses · 927 intakes · 76 evidence records; duplicates; 159 conflicts; limits |
| 02 | `02-EVIDENCE-AND-PROVENANCE-MANIFEST.md` | evidence classes, `fieldScope` coverage matrix, 7 unlinked records, Aston block |
| 03 | `03-DESTINATION-COVERAGE.md` | UK / AU / NZ / IE / CA / US coverage, what may and may not be claimed |
| 04 | `04-VERIFICATION-LABEL-RESOLUTION.md` | legacy-label policy, 8 course decisions, 79 institution decisions, migration plan |
| 05 | `05-SNAPSHOT-ONLY-RECONCILIATION.md` | 316 snapshot-only files, the four flagged areas, per-group recommendations |
| 06 | `06-REMAINING-FILE-PURPOSE-AUDIT.md` | 4,714 → **0** purpose gaps, with the honest documented/structural/type-only split |
| 07 | `07-SECURITY-AND-TEST-ROOT-CAUSE.md` | authz matrix (1,099 routes), the security correction, test root cause |
| 08 | `08-GO-LIVE-BLOCKER-REPORT-REVISED.md` | revised blockers, schema incompatibility, staging-DB plan |

## Data artifacts

| File | Rows | What it is |
|---|---:|---|
| `canonical-institutions.csv` | 593 | every institution with provenance, identity evidence, public status |
| `canonical-courses.csv` | 8,746 | every course, synthetic flag preserved |
| `canonical-intakes.csv` | 927 | 104 verified course-months + 823 synthetic, labelled |
| `evidence-manifest.csv` | 76 | 30 catalogue + 32 universe-source + 14 URL-check records |
| `conflicts.csv` | 159 | 154 label · 3 alias-bundle · 1 count · 1 course-level |
| `coverage-by-destination.csv` | 6 | per-country coverage with count-derived gap statements |
| `field-level-evidence-matrix.csv` | 8 | course × 10 core field groups, with evidence ids |
| `label-resolution-proposal.csv` | 87 | 8 courses + 79 institutions, asserted vs proposed status |
| `duplicate-candidates.csv` | 33 | 12 confirmed aliases + 21 suspects, each with its rule |
| `authz-matrix.csv` | 1,099 | every API route: public / role-gated / handler-gated / auth-only |
| `canonical-dataset.json` | — | verified subset only, `containsSyntheticData: false` |
| `recovery-summary.json`, `label-analysis-summary.json`, `duplicate-summary.json`, `authz-summary.json` | — | machine-readable counts |

## Scripts (all read-only, all re-runnable)

| Script | Purpose |
|---|---|
| `build-canonical.py` | merges the catalogue sources into the canonical CSVs; never mutates inputs |
| `build-label-analysis.py` | applies the field-level rule course by course, field by field |
| `build-duplicates.py` | duplicate/alias detection with explicit, auditable rules |
| `build-authz-matrix.py` | mirrors `src/proxy.ts` logic + handler guards into a per-route verdict |

## Staging database (prepared, not executed)

`staging-db/00-preflight-identity.sql` — proves a database is not production (host, replication peers,
table existence, row scale, real-customer markers, read-only grants).
`staging-db/01-recovery-verification.sql` — compares the database against the canonical inventory.
Both are `SELECT`-only. Neither was run. **Owner confirmation of non-production identity is still
outstanding and cannot be automated.**

## Corrections this phase makes to earlier reports

| Earlier claim | Correction |
|---|---|
| "7 endpoints with no auth at all" | Withdrawn — all 7 are proxy-gated and role-allow-listed (report 07 §1) |
| "31 tests fail, pre-existing" | Unmeasured — Prisma client cannot be generated here (report 07 §6) |
| "8 verified courses" | 7 `VERIFIED` + 1 `PARTIALLY_VERIFIED` + 3 `NEEDS_REVIEW`; 0 field-complete |
| "153 label conflicts" | 159 conflicts, 154 of them label disagreements |
| "4,714 files without purpose" | 0 remain; 4,645 of the 5,679 first-party purposes are inferred, not documented |
| Ireland counted as two countries | Merged: 19 Irish institutions, not 18 + 1 |
| "226 dead files" | 226 orphans + **32 test-only**, reviewed separately; none deleted |

## Approval requested for

1. Label policy in report 04 (demote 7 courses to `PARTIALLY_VERIFIED`, hold Monash, keep Aston
   unpublished, publish institutions as `IDENTITY_VERIFIED_COURSE_UNVERIFIED`).
2. Three evidence relinks (no new collection).
3. The snapshot decisions in report 05 — especially `lib/view-registry` and `lib/offline`.
4. Whether Phase 0D may attempt a staging connection, after owner confirmation of non-production
   identity.
