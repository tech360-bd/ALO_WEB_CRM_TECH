# Phase 0D · 02 — Evidence Relink Validation

**Data:** `relink-validation.csv` (3 rows × 6 criteria), `relink-coverage-before-after.csv`,
`canonical/relink-log.csv`, `relink-validation.json`
**Script:** `build-relink-validation.py` — applies nothing; tests the six conditions the approval attached.
**Applied to:** the local recovery dataset only. No database was written. `database_written = NO` on
every relink-log row.

---

## 1. Verdicts

| Evidence | → Course | Verdict | Coverage |
|---|---|---|---:|
| `cent-biotech-admission` | Centennial Biotechnology (Fast-Track) | **APPROVE** | 4/10 → **6/10** |
| `cent-biotech-fees` | Centennial Biotechnology (Fast-Track) | **APPROVE_WITH_CAVEAT** (provenance only) | 4/10 → 4/10 |
| `mon-b6005-requirements` | Monash Master of Business | **APPROVE** (provenance only) | 4/10 → 4/10 |

Cumulative: **one course improves** (Biotechnology 4/10 → 6/10, gaining entry requirement and English
requirement). Nothing else changes status.

## 2. Two Phase 0C claims are corrected

**(a) "Both Centennial courses rise 4/10 → 6/10" was wrong.**
Phase 0C's sensitivity check matched evidence to courses by **university slug**. Evidence records name
their own `courseSlug`, and both Centennial records name
`centennial-biotechnology-fast-track`. Matching by university would have attached *biotechnology*
admission requirements to *construction project management* — a false claim about a different
programme's entry rules. Construction PM receives nothing and stays at 4/10.

**(b) `cent-biotech-fees` does not evidence a fee field.**
Its `fieldScope` is `publishedFeeBasis` and `feeAcademicYear`. Neither is a core publication field
(fee amount, currency, period). The excerpt does contain amounts
(`International $19,167.00 $2,205.81 $21,372.81`) but the record does **not** scope them as
`feeAmount`, so extracting a fee from it would exceed the evidence's own declared scope. It is linked
as provenance only, and no fee is promoted.

## 3. Criterion-by-criterion results

### 3.1 `cent-biotech-admission` → `centennial-biotechnology-fast-track` — **APPROVE**

| # | Condition | Result | Evidence |
|---|---|---|---|
| 1 | Same institution / campus | **PASS** | `universitySlug = centennial-college` on both; evidence makes no campus claim, so it cannot conflict with *Morningside Campus* |
| 2 | Same course / qualification | **PASS** | `courseSlug = centennial-biotechnology-fast-track` explicit; qualification not scoped, so no conflicting claim |
| 3 | Same academic year / intake | **PASS** | evidence states no year, so it cannot contradict the record's 2026/27 & 2027/28 |
| 4 | Correct field-level evidence | **PASS** | scopes `academicRequirement`, `englishRequirement`, `documentRequirements` → unlocks **entry_requirement** and **english_requirement** |
| 5 | Source URL and provenance | **PASS** | `https` · HTTP 200 · `retrievedAt 2026-10-29T09:30:00Z` · publisher *Centennial College* · excerpt present · official host · **identical to the course's `officialCourseUrl`** |
| 6 | No conflicting evidence | **PASS** | no currently linked record scopes the same fields |

### 3.2 `cent-biotech-fees` → same course — **APPROVE_WITH_CAVEAT**

| # | Condition | Result | Evidence |
|---|---|---|---|
| 1 | Institution / campus | PASS | as above |
| 2 | Course / qualification | PASS | `courseSlug` explicit |
| 3 | Academic year | **CAVEAT** | excerpt: *"Tuition is based on two semesters, beginning **Fall 2026**"* — a **2026/27** figure. The course record claims 2026/27 **and** 2027/28. Linking is safe; presenting this as the 2027/28 fee would not be |
| 4 | Field-level evidence | PASS (ineffective) | scopes `publishedFeeBasis`, `feeAcademicYear` → unlocks **nothing** in the 10 core groups |
| 5 | Provenance | PASS | same URL, HTTP 200, retrieved date, official host |
| 6 | No conflict | **REVIEW** | the year mismatch recorded above |

**Disposition:** linked for provenance, with `link_kind = PROVENANCE_ONLY`. The fee is **not** promoted
and must not be rendered as a 2027/28 figure.

### 3.3 `mon-b6005-requirements` → `monash-master-of-business` — **APPROVE**

| # | Condition | Result | Evidence |
|---|---|---|---|
| 1 | Institution / campus | PASS | `monash-university` on both |
| 2 | Course / qualification | PASS | `courseSlug = monash-master-of-business` explicit |
| 3 | Academic year | PASS | evidence year {2027} = course year {2027} (handbook edition) |
| 4 | Field-level evidence | PASS (ineffective) | scopes `creditPoints`, `structure` → unlocks **nothing** in the core groups |
| 5 | Provenance | PASS | `https://handbook.monash.edu/2027/courses/B6005`, HTTP 200, retrieved date, official host, identical to `officialCourseUrl` |
| 6 | No conflict | PASS | no other record scopes credit points or structure |

**Disposition:** linked for provenance. Monash stays at 4/10 and remains **HOLD**, as approved.

## 4. Before / after, with evidence ids

| Course | Evidence before | Evidence after | Δ |
|---|---|---|---|
| Centennial Biotechnology | `cent-biotech-availability`, `cent-biotech-program-details` | + `cent-biotech-admission`, `cent-biotech-fees` | **+2 groups** |
| Monash Master of Business | `mon-b6005-handbook-2027` | + `mon-b6005-requirements` | 0 |
| Centennial Construction PM | `cent-cent-cpm-*` (unchanged) | unchanged | 0 |
| Manchester, TUM, Auckland, Copenhagen, Yonsei | unchanged | unchanged | 0 |

Fields newly evidenced for Biotechnology: `entry_requirement`, `english_requirement`.
Fields still suppressed: `fee`, `start_months`, `application_deadline`, `academic_year`.

## 5. What would be needed to go further on this course

Biotechnology now covers 6/10. The four remaining gaps map to specific, publicly documented sources —
none of which was collected in Phase 0C/0D, because no new external collection is authorised:

| Missing group | Where it would come from |
|---|---|
| `fee` | the same page, but the fee section must be re-parsed with `feeAmount` in scope (currently only basis + year are scoped) |
| `start_months` | the availability table named in the course `notes` (Jan/May/Sep 2027, Jan/May 2028) — currently scoped as `intakeAvailability`, not `startMonths` |
| `application_deadline` | Centennial international admissions page (different URL from the programme page) |
| `academic_year` | derivable, but must be evidenced per row rather than inferred from the title |

That is a sourcing decision, not a relink. It is deliberately left undone.
