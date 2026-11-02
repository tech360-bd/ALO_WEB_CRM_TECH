# Phase 0C · 04 — Verification-Label Conflict Resolution Proposal

**Status:** PROPOSAL — requires approval. No label was changed, converted or removed.
**Inputs:** `conflicts.csv` (159), `label-resolution-proposal.csv`, `field-level-evidence-matrix.csv`,
`label-analysis-summary.json`
**Rule applied:** `VERIFIED` is the canonical public status. Legacy labels are **not** auto-converted.
A record reaches `VERIFIED` only when its official evidence is independently validated **at field level**.

---

## 1. The 154 label disagreements

Two label pairs account for every one of them:

| Pair | Count | Where it comes from |
|---|---:|---|
| `CROSS_SOURCE_VERIFIED` \| `NEEDS_REVIEW` | 79 | synthetic master claims `CROSS_SOURCE_VERIFIED`; Phase 1 inventory says `NEEDS_REVIEW` |
| `NEEDS_REVIEW` \| `VERIFIED_OFFICIAL` | 75 | synthetic master claims `VERIFIED_OFFICIAL`; Phase 1 inventory says `NEEDS_REVIEW` |

Both are the same structural error: **a bulk synthetic loader stamped strong verification labels on rows
nobody had surveyed.** `VERIFIED_OFFICIAL` on 75 Oxford/Cambridge/Imperial-class rows is not a claim
that a catalogue was read; it is a default value in an import script.

### Proposed resolution (no auto-conversion)

| Legacy label | Proposed action | Public status |
|---|---|---|
| `VERIFIED_OFFICIAL` on a row with no `CATALOGUE_EVIDENCE` | **Do not convert.** Strip to `NEEDS_REVIEW`, keep the original string in a `legacy_label` audit column | not public |
| `CROSS_SOURCE_VERIFIED` where both sources are the synthetic master | **Do not convert.** Strip to `NEEDS_REVIEW` | not public |
| `CROSS_SOURCE_VERIFIED` where one source is real but there is no field-level evidence | Strip to `PARTIALLY_VERIFIED` *only* if the real source validates specific fields; otherwise `NEEDS_REVIEW` | field-level only |
| `NEEDS_REVIEW` | unchanged | not public |
| `VERIFIED` (dataset) with field evidence for **all** core fields | retain `VERIFIED` | public |
| `VERIFIED` (dataset) with partial field evidence | **demote to `PARTIALLY_VERIFIED`** | evidenced fields only |
| `UNVERIFIED_SYNTHETIC` | unchanged | never public |

The label text itself is evidence of nothing. `VERIFIED_OFFICIAL` and `CROSS_SOURCE_VERIFIED` are
*claims about process*; only `evidence.fieldScope[]` is a fact about a field.

## 2. The eight courses: what the field-level rule actually yields

| Course | Asserted | Field groups | Proposed status |
|---|---|---:|---|
| Manchester MSc Accounting | `VERIFIED` | 6/10 | `PARTIALLY_VERIFIED` |
| TUM MSc Informatics | `VERIFIED` | 6/10 | `PARTIALLY_VERIFIED` |
| Auckland MDataSci | `VERIFIED` | 5/10 | `PARTIALLY_VERIFIED` |
| Centennial Biotechnology | `VERIFIED` | 4/10 | `PARTIALLY_VERIFIED` |
| Centennial Construction PM | `VERIFIED` | 4/10 | `PARTIALLY_VERIFIED` |
| Copenhagen MSc CS | `VERIFIED` | 4/10 | `PARTIALLY_VERIFIED` |
| Monash Master of Business | `VERIFIED` | 2/10 | `PARTIALLY_VERIFIED` |
| Yonsei BSc CS | `PARTIALLY_VERIFIED` | 4/10 | `PARTIALLY_VERIFIED` |

**Result: zero courses qualify for full `VERIFIED` under the field-level rule.**

That is a finding, not a script failure. The dataset is internally consistent — it labels a *course
record* verified when its source page was read — but Phase 0C's rule is per-field, and no course has
evidence for all of qualification, duration, mode, campus, fee, entry requirement, English
requirement, start months, deadline and academic year.

**Recommended handling (choose one, do not do both):**

* **Option A — publish as `PARTIALLY_VERIFIED`.** Show evidenced fields; render the rest as "not yet
  confirmed". Keeps 8 real courses visible and honest. Requires the UI to support an unknown state
  rather than a blank or a zero.
* **Option B — publish nothing until 10/10.** Safest, but leaves the public catalogue completely empty
  and gives the synthetic data no replacement.

Recommendation: **Option A for the 7 courses with ≥4/10**, and hold Monash (2/10) back — at 2/10 it is
a course code, a campus and a mode, with no duration, fee or deadline, which is not a usable listing.

## 3. The 79 institutions: identity is true, everything else is unknown

Institution identity verification is a **separate axis** and must never be read as course verification.

| Axis | State | Public meaning |
|---|---|---|
| Institution exists | 79 rows, regulator-confirmed (TEQSA, HEA, Universities NZ, official sites) | "This university is real" |
| Course catalogue surveyed | 6 institutions (`catalogue_survey_status` partial) | "We read part of its catalogue" |
| Course field validated | 0 institutions at 100% | "We know a course fact" |
| Admissions requirement validated | 0 | — |

Proposed public status for these rows: `IDENTITY_VERIFIED_COURSE_UNVERIFIED` — publish name, country,
official website, regulator identifier; publish **no** course, fee, intake or deadline claim until it
has its own evidence.

Two of the 79 are not distinct institutions (report 01 §5), so the true figure is **78**, and **76** if
the two remaining suspects are confirmed. Any announcement should use 78 and say "identity-verified".

## 4. The 3 `ALIAS_BUNDLE_NEEDS_SPLIT` rows

| Row | Problem | Proposal |
|---|---|---|
| Torrens University Australia | `display_name` holds **24 comma-separated aliases** (APM College, Billy Blue, BMIHMS, Chifley, Media Design School, …) | keep `official_name` = "Torrens University Australia Ltd"; move all 24 strings to an alias table; publish one institution |
| Atlantic Technological University (formerly IT Sligo) | former name in `display_name` | official name + alias row for "IT Sligo" |
| Munster Technological University (formerly Cork IT) | former name in `display_name` | official name + alias row for "Cork IT" |

Both former-name cases matter for students: searches use "IT Sligo" and "Cork IT" long after the
rename, so the alias must exist — as an alias, not as a second institution.

## 5. Severity reassessment

| Previous characterisation | Corrected characterisation |
|---|---|
| "153 universities have contradictory verification labels" (HIGH) | **159 conflicts total: 154 label disagreements, 4 alias-bundle/coverage issues, 1 course-level ambiguity.** All 154 are the same root cause: synthetic bulk labels. Severity remains HIGH for *publication* because any row that keeps a strong label can leak into a public surface |
| "8 verified courses" | 7 `VERIFIED` + 1 `PARTIALLY_VERIFIED` + 3 `NEEDS_REVIEW`; **0 at full field-level `VERIFIED`** |
| "synthetic labels are wrong" | Not quite — they are **claims without evidence**. The fix is evidence, or demotion, never a silent relabel |

## 6. Migration plan (to run only after approval, and never as a bulk `UPDATE`)

1. Add `legacy_label` (string) and `evidence_backed_status` (enum) columns — no destructive change.
2. Backfill `legacy_label` from the current value; backfill `evidence_backed_status` from
   `label-resolution-proposal.csv` (8 courses, 79 institutions).
3. Run a **dry-run report** that lists every row whose public status would change, and the field
   evidence that justifies each change.
4. Gate publication on `evidence_backed_status`, not on the legacy column.
5. Only after the dry run is reviewed: apply per-record, with the evidence id recorded on the row.

No seeds, migrations, imports, updates or deletes were executed during Phase 0C.
