# Phase 0D — Verification Policy Applied, Blockers Re-Scored, Staging Gate Prepared

**Date:** 2026-11-02 · **Branch:** `arena/ececf40c-alo-web-crm-tech` @ `7e4c3922`
**Mode:** read-only, local files only. **Uncommitted.**
**No application change, database connection, database write, commit, push, merge, deployment or
publication.** Phase 0C artefacts are untouched and serve as the "before" record.

---

## Deliverables requested vs delivered

| # | Requested | File |
|---|---|---|
| 1 | Updated verification-policy decision record | `01-VERIFICATION-POLICY-DECISION-RECORD.md` |
| 2 | Corrected canonical recovery CSVs | `canonical/canonical-courses.csv`, `canonical/canonical-institutions.csv` (+ `relink-log.csv`, `coverage-before-after.csv`) |
| 3 | Three evidence-relink validation results | `02-EVIDENCE-RELINK-VALIDATION.md`, `relink-validation.csv`, `relink-coverage-before-after.csv` |
| 4 | Snapshot navigation & offline integration plan | `03-SNAPSHOT-NAVIGATION-AND-OFFLINE-PLAN.md` |
| 5 | Remaining mutating-route security analysis | `04-MUTATING-ROUTE-SECURITY.md` |
| 6 | Prisma test blocker analysis + remediation | `05-PRISMA-TEST-BLOCKER.md`, `test-blocker-analysis.csv` |
| 7 | Phase 0D staging preflight checklist | `06-STAGING-PREFLIGHT-CHECKLIST.md` (+ `../phase0c/staging-db/*.sql`) |
| 8 | Updated go-live readiness matrix | `07-GO-LIVE-READINESS-MATRIX.md` |

## Four findings that change decisions

1. **`PARTIALLY_VERIFIED` cannot be public.** `passesPublicPagePolicy` requires
   `verificationStatus === 'VERIFIED'` **and** `approvalStatus === 'PUBLISHED'`. The approved
   reclassification is therefore export-only; **zero courses can be published without a code change.**
   This is the single most consequential discovery of Phase 0D.
2. **Only one relink promotes anything.** Evidence records name their own `courseSlug`, so the match must
   be per-course. Phase 0C's university-level matching would have attached biotech admission rules to
   construction project management. Result: Biotechnology **4/10 → 6/10**; everything else unchanged;
   `cent-biotech-fees` evidences no core field and cites a **2026/27** fee against a 2026/27–2027/28 record.
3. **Monash is 4/10, not 2/10.** The `2/10` came from an exploratory script; both formal definitions say
   4/10. The HOLD stands on substance — no duration, fee, deadline, entry or English requirement.
4. **Only 10 of 31 test failures are Prisma-proven; 16 are genuine.** Per-test table in
   `test-blocker-analysis.csv`. Blanket-labelling all 31 as infrastructure would have been false.

Plus two corrections in the other direction: the 8 `onNavigate("public-country")` components are **all
orphans** (B2 P1 → P3), and no registry restore is possible because **0 of 49** registry targets exist in
`src/`.

## Data artefacts

| File | Rows | Notes |
|---|---:|---|
| `canonical/canonical-courses.csv` | 8,746 | adds `legacy_verification_status`, `approved_verification_status`, `publication_decision`, `public_gate_result`, `field_groups_evidenced/suppressed`, decision refs |
| `canonical/canonical-institutions.csv` | 593 | adds `legacy_identity_verification`, `approved_export_status`, `duplicate_flag` |
| `canonical/relink-log.csv` | 3 | every relink with `database_written = NO` |
| `canonical/coverage-before-after.csv` | 2 | before/after field coverage + evidence ids |
| `relink-validation.csv` | 3 | six criteria per relink, with the deciding evidence |
| `relink-coverage-before-after.csv` | 3 | per-record and cumulative deltas |
| `test-blocker-analysis.csv` | 19 | 10 assertion-level + 9 file-load failures, each with cause and first error |

## Scripts (read-only, re-runnable)

| Script | Purpose |
|---|---|
| `build-relink-validation.py` | tests the 6 relink conditions; imports Phase 0C's field definitions so "coverage" has one meaning |
| `build-recovery-v2.py` | applies approved classifications, preserves legacy labels, never touches inputs |
| `build-test-blocker.py` | classifies each test failure from its own error message |

## Approved classifications applied

8 `PARTIALLY_VERIFIED` (Monash `HOLD`) · 3 Aston `NEEDS_REVIEW` unpublished · 8,735 `UNVERIFIED_SYNTHETIC`
(unchanged) · 79 `IDENTITY_VERIFIED_COURSE_UNVERIFIED` (export layer only, **not** a Prisma enum) ·
514 `UNVERIFIED_NOT_PUBLIC`. Legacy labels, sources and decision metadata preserved on every row.

## Phase 0E gate

`06-STAGING-PREFLIGHT-CHECKLIST.md` Part A lists the 8 owner attestations that must be answered in
writing before any connection. No credentials were requested, none were stored, and no connection was
attempted. Any write (migration, seed, import, update, delete) needs a separate approval under Part F.

## Open decisions for the owner

1. **Publication of `PARTIALLY_VERIFIED`** — extend the public gate, or launch with an empty catalogue?
2. **Offline** — correct the page copy (recommended), or restore the sync engine and its data-at-rest risk?
3. **Duplicate eligibility route** — retire it (recommended) or authorise and keep it?
4. **NZ dedupe** — merge the Auckland triple and the four Māori/English pairs now, or in a later data pass?

---

## Superseded / corrected by `../proposals/` (2026-11-02)

The four decisions above are **closed** and the implementation proposals now live in
[`../proposals/`](../proposals/README.md). Read those reports alongside this record; three
things stated here are corrected there:

1. **"16 genuine failures"** was measured on a 22-file subset. The full-suite baseline on
   this branch is **31 failing tests + 20 files that cannot load**; three of the repaired
   ones were a product defect, not configuration. See `proposals/04-sectionD-test-corrections.md`.
2. **Two of the "configuration" failures** (`official numbers are exactly 20`, `keeps
   provider state unverified`) were caused by `toBdDisplayPhone()` slicing the country code
   with `slice(2)`, corrupting every configured number to `0018…`. Fixed in
   `proposals/patches/3002-whatsapp-display-phone-slice.patch`.
3. **The eight owner attestations, A1–A8, remain unanswered.** `proposals/06-sectionF-approval-record-template.md`
   reproduces them verbatim and adds the per-change record. Nothing in `proposals/` is
   approved by being written.
