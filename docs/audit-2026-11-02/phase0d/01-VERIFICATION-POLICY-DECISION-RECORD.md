# Phase 0D · 01 — Verification & Publication Policy Decision Record

**Decision date:** 2026-11-02 · **Owner approval:** granted (Phase 0C decisions, 2026-11-02)
**Recorded by:** audit run on branch `arena/ececf40c-alo-web-crm-tech` @ `7e4c3922`
**Scope of this record:** the **recovery dataset and export layer only**. It is **not** authority to
update production, staging or any database.

---

## 1. Approved decisions (verbatim intent) and how each was implemented

| # | Approved decision | Implementation | Artefact |
|---|---|---|---|
| 1 | Reclassify seven insufficiently evidenced courses as `PARTIALLY_VERIFIED` | Applied to 7 rows whose legacy label was `VERIFIED`; the 8th (`Yonsei`) was already `PARTIALLY_VERIFIED` | `canonical/canonical-courses.csv` |
| 2 | Keep Monash on hold at its reported 2/10 coverage | HOLD applied. **Coverage corrected to 4/10** — see §3 | same |
| 3 | Keep Aston unpublished | 3 rows remain `NEEDS_REVIEW`, `publication_decision = UNPUBLISHED_INSUFFICIENT_EVIDENCE` | same |
| 4 | Represent verified identity as `IDENTITY_VERIFIED_COURSE_UNVERIFIED` | Applied to 79 identity-verified rows in the export layer | `canonical/canonical-institutions.csv` |
| 5 | Do not assume an existing Prisma enum; map only after compatibility review | Compatibility review performed (§4). **No schema mapping written.** Value is a string in the export only | §4 |
| 6 | No course/intake/fee/deadline/eligibility field becomes publicly verified without matching official evidence | Every course row carries `field_groups_evidenced` and `field_groups_suppressed`; nothing sets `VERIFIED` | same |
| 7 | Preserve previous labels, source values and audit history | `legacy_verification_status`, `legacy_source`, `decision_record`, `decided_at`, `scope_of_decision` on every row | same |

Everything is additive. No row was deleted and no source file was modified:
`data/verified-2027/dataset.json` and the Phase 0C CSVs are byte-identical to their pre-decision state.

## 2. The eleven non-synthetic courses, decided

| Course | Legacy | Approved | Coverage before → after | Publication decision |
|---|---|---|---:|---|
| Manchester MSc Accounting | `VERIFIED` | `PARTIALLY_VERIFIED` | 6/10 → 6/10 | `PENDING_PUBLIC_GATE` |
| Centennial Biotechnology (Fast-Track) | `VERIFIED` | `PARTIALLY_VERIFIED` | **4/10 → 6/10** | `PENDING_PUBLIC_GATE` |
| Centennial Construction Project Mgmt | `VERIFIED` | `PARTIALLY_VERIFIED` | 4/10 → 4/10 | `PENDING_PUBLIC_GATE` |
| Monash Master of Business | `VERIFIED` | `PARTIALLY_VERIFIED` | 4/10 → 4/10 | **`HOLD`** |
| TUM MSc Informatics | `VERIFIED` | `PARTIALLY_VERIFIED` | 6/10 → 6/10 | `PENDING_PUBLIC_GATE` |
| Auckland Master of Data Science | `VERIFIED` | `PARTIALLY_VERIFIED` | 5/10 → 5/10 | `PENDING_PUBLIC_GATE` |
| Copenhagen MSc Computer Science | `VERIFIED` | `PARTIALLY_VERIFIED` | 4/10 → 4/10 | `PENDING_PUBLIC_GATE` |
| Yonsei BSc Computer Science | `PARTIALLY_VERIFIED` | `PARTIALLY_VERIFIED` | 4/10 → 4/10 | `PENDING_PUBLIC_GATE` |
| Aston Foundation Programmes | `NEEDS_REVIEW` | `NEEDS_REVIEW` | — | `UNPUBLISHED_INSUFFICIENT_EVIDENCE` |
| Aston 3D printing of ocular films | `NEEDS_REVIEW` | `NEEDS_REVIEW` | — | `UNPUBLISHED_INSUFFICIENT_EVIDENCE` |
| Aston Advancing episignature analysis | `NEEDS_REVIEW` | `NEEDS_REVIEW` | — | `UNPUBLISHED_INSUFFICIENT_EVIDENCE` |

Totals: 8 `PARTIALLY_VERIFIED` · 3 `NEEDS_REVIEW` · 8,735 `UNVERIFIED_SYNTHETIC` (unchanged).

Institutions: **79** `IDENTITY_VERIFIED_COURSE_UNVERIFIED` · **514** `UNVERIFIED_NOT_PUBLIC`.
58 institution rows carry `duplicate_flag = REVIEW` (the confirmed-alias and suspect pairs from Phase 0C).

## 3. One approved figure was wrong and is corrected here

The approval says *"keep Monash on hold with its reported 2/10 evidence coverage."* **Monash is 4/10**,
under both the grouped and the flat field definitions:

| Evidence linked to Monash | `fieldScope` | Field groups it satisfies |
|---|---|---|
| `mon-b6005-handbook-2027` | campus, courseCode, handbookYear, studyMode | identity (via `courseCode`), campus, academic year (via `handbookYear`), study mode |

The `2/10` came from the exploratory Phase 0C script whose flat field list omitted `courseCode` and
`handbookYear`. The Phase 0C scripts themselves computed 4/10; only the narrative quoted 2/10. Both
definitions agree at 4/10, so the scripted value stands.

**The HOLD decision is retained**, on substance rather than on the number: Monash has no evidenced
duration, fee, entry requirement, English requirement, start month or application deadline. Those are
the six fields a student needs, and all six are unevidenced. A 4/10 that is missing every decision
field is not publishable, and the difference between 2/10 and 4/10 does not change that.

## 4. Schema compatibility review — why nothing was mapped

The approved instruction was explicit: do not assume `IDENTITY_VERIFIED_COURSE_UNVERIFIED` (or
`PARTIALLY_VERIFIED`) is an existing Prisma enum. Findings:

| Check | Result |
|---|---|
| Is there a verification enum? | **No.** `enum *Verification*` does not exist in `prisma/schema.prisma` |
| `CrmCourse.verificationStatus` | `String @default("NEEDS_REVIEW")` — free text, so any value *stores* |
| `CrmCourse.publicationStatus` | `String @default("draft")` |
| Public gate predicate | `passesPublicPagePolicy`: `approvalStatus === 'PUBLISHED'` **and** `verificationStatus === 'VERIFIED'` **and** an acceptable `sourceUrl` |
| International course gate | also requires `internationalEligibility` ∈ `VERIFIED_INTERNATIONAL_ELIGIBILITY_VALUES` (`eligible`, `yes`, `true`, …) |
| Edit-time behaviour | `verificationAfterEdit()` demotes `VERIFIED` → `NEEDS_REVIEW` whenever a factual field changes |

**Consequence — the most important operational finding of Phase 0D:**

> No approved status equals `VERIFIED`. Therefore **zero courses can be publicly visible** under the
> current gate. `PARTIALLY_VERIFIED` is export-only until an application change extends the public
> policy — and that change is not authorised by this approval.

So the approved policy and the shipped gate are in tension. The safe default, applied here, is that
the classification is recorded but nothing is promoted to public. Publishing evidenced fields requires
a separate, explicitly approved change to `passesPublicPagePolicy` (plus UI that can render
"not confirmed" instead of a blank or a zero).

Two further schema facts that must shape any future import:
`verificationStatus` is an unconstrained `String`, so a typo silently creates a new status; and the
international gate means even a `VERIFIED` course stays hidden unless `internationalEligibility` is one
of nine accepted literals.

## 5. What this record does NOT authorise

1. Any write to production, staging or any database.
2. Any change to `prisma/schema.prisma`, the public gate, or any application file.
3. Promotion of any record to `VERIFIED`.
4. Publication of the synthetic set (8,735 courses, 823 intakes) — unchanged and still never public.
5. Deleting the legacy labels. They are preserved, not migrated.
6. Treating `IDENTITY_VERIFIED_COURSE_UNVERIFIED` as a database value. It is an export-layer value.

## 6. Reversal

Everything in this phase is file-based and additive. To reverse: discard
`docs/audit-2026-11-02/phase0d/canonical/` and re-run `build-recovery-v2.py` — no source file, schema
or database state is involved. Phase 0C artefacts remain untouched as the "before" record.
