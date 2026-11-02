# Phase 0C · 02 — Evidence & Provenance Manifest

**Generated:** 2026-11-02 · **Sources:** `data/verified-2027/dataset.json`, `data/official-source-audit/*`,
`data/catalogue-review/*`, `AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv`
**Outputs:** `evidence-manifest.csv` (76 rows), `field-level-evidence-matrix.csv`, `label-resolution-proposal.csv`

---

## 1. The three evidence classes, and what each can carry

| Class | Records | What it proves | May it publish a field? |
|---|---:|---|---|
| `CATALOGUE_EVIDENCE` | 30 | a specific catalogue page said a specific thing at a specific time, with an excerpt and a field list | **Yes**, only the fields in its `fieldScope` |
| `UNIVERSE_SOURCE` | 32 | the provider exists / the institution list is real | **No** — proves identity, never a course fact |
| `URL_CHECK` | 14 | a URL responded (or 404'd) at a moment in time | **No** — a 200 is not a fact |

Every one of the 30 catalogue records carries `sourceUrl`, `publisherName`, `pageTitle`,
`retrievedAt`, `httpStatus`, a verbatim `excerpt`, `fieldScope[]` and a `confidence`. This is a better
provenance model than most commercial catalogues, and it is the only asset in the repository that
justifies publishing anything.

## 2. `fieldScope` is the load-bearing field — and it is incomplete

The dataset's own rule is that a record is `VERIFIED` at course level. Phase 0C's rule is stricter:
a *field* is publishable only if some evidence record lists that field in `fieldScope`. Applying the
stricter rule to the 10 core field groups a course page must state:

**No course has all 10 core field groups evidenced.** Coverage by course:

| Course | Asserted | Evidence records | Field groups covered | Missing |
|---|---|---:|---:|---|
| Manchester MSc Accounting | VERIFIED | 6 | 6/10 | campus, startMonths, applicationCloses, englishRequirement |
| TUM MSc Informatics | VERIFIED | 3 | 6/10 | qualification, studyMode, academicRequirement, englishRequirement |
| Auckland MDataSci | VERIFIED | 4 | 5/10 | qualification, studyMode, academicRequirement, englishRequirement, academicYear |
| Centennial Biotechnology | VERIFIED | 2 | 4/10 | fee, academicRequirement, startMonths, applicationCloses, english, academicYear |
| Centennial Construction PM | VERIFIED | 2 | 4/10 | (same as above) |
| Copenhagen MSc CS | VERIFIED | 3 | 4/10 | qualification, duration, studyMode, campus, fee, academicYear |
| Monash Master of Business | VERIFIED | 1 | 2/10 | qualification, duration, fee, academicRequirement, startMonths, applicationCloses, english, academicYear |
| Yonsei BSc CS | PARTIALLY_VERIFIED | 2 | 4/10 | qualification, duration, studyMode, campus, fee, academicYear |

Field availability across the 8 courses:

| Field group | Evidenced | Not evidenced |
|---|---:|---:|
| identity (qualification / code / catalogue title) | 4 | 4 |
| duration | 5 | 3 |
| study mode | 4 | 4 |
| campus | 5 | 3 |
| **fee** | **3** | **5** |
| entry requirement | 3 | 5 |
| **English requirement** | **2** | **6** |
| start months | 4 | 4 |
| application deadline | 4 | 4 |
| **academic year** | **3** | **5** |

Fee, English requirement and academic year are the weakest — and they are precisely the three fields
a prospective student makes a decision on. Monash is the thinnest: one evidence record covering a
handbook code, year, mode and campus, with no duration, no fee and no deadline.

## 3. Seven evidence records exist but are linked to nothing

The provenance graph links evidence to courses through `coverage[].evidenceIds`. Seven records are
referenced by no coverage row:

| Evidence | Entity | University | `fieldScope` |
|---|---|---|---|
| `cent-biotech-fees` | COURSE | centennial-college | publishedFeeBasis, feeAcademicYear |
| `cent-biotech-admission` | COURSE | centennial-college | academicRequirement, englishRequirement, documentRequirements |
| `mon-b6005-requirements` | COURSE | monash-university | creditPoints, structure |
| `man-masters-catalogue-2027` | UNIVERSITY | university-of-manchester | catalogueTitle, entryYear, courseListing |
| `kyoto-academic-calendar-2027` | UNIVERSITY | kyoto-university | semesterOneStart, semesterTwoStart |
| `dbs-international-intakes-2027` | UNIVERSITY | dublin-business-school | institutionIntakeMonths, applicationStatus |
| `ulster-pg-2027-28-filter-empty` | UNIVERSITY | ulster-university | postgraduate2027_28ListingCount |

**Consequence, bounded:** if the three COURSE records were relinked, both Centennial courses would rise
from 4/10 to 6/10 — fee, entry requirement, English requirement and academic year. They would still
not reach 10/10. This is the single cheapest evidence improvement available (three row edits, no new
collection), and it is a *relink*, not a judgement call: the records name their university and their
fields, and `cent-biotech-fees`/`cent-biotech-admission` plainly belong to
`centennial-biotechnology-fast-track`.

`ulster-pg-2027-28-filter-empty` is worth naming separately: its evidence is that a filter returned
**zero** results. A verified-empty listing is evidence of absence for that exact query, and must never
be cited as evidence that Ulster offers no postgraduate courses.

## 4. Traversal completeness is honestly recorded — and it is `PARTIAL`

The Manchester traversal records `coursesDiscovered: 34`, `coursesVerified: 1`, `paginationComplete:
false`, `completeness: PARTIAL`. That is the correct, self-incriminating record. Any report claiming
"Manchester catalogue collected" on the strength of 1 verified course out of 34 discovered, with
pagination incomplete, would be false. The dataset says so itself; this manifest repeats it.

## 5. The Aston block cannot be published

`data/official-source-audit/aston_courses_parsed.csv` (3 rows) records "Foundation Programmes" with
`studyLevel: Research`, `campus: London`, `deliveryMode: Online` — three fields that contradict each
other for that programme type — and carries `parseWarnings`. Aston is a real university (the source
checks confirm the pages exist; `URL_validation_report.csv` has 7 rows), but these three parsed rows
are parser output, not verified facts. They stay `NEEDS_REVIEW` and out of `canonical-dataset.json`.

## 6. Evidence integrity checks that were run

| Check | Result |
|---|---|
| Every catalogue record has a non-empty `excerpt` | 30/30 |
| Every catalogue record has ≥1 `fieldScope` entry | 30/30 |
| Every catalogue record has `httpStatus` | 30/30 |
| Evidence referenced by a coverage row | 23 of 30 catalogue records |
| Evidence referenced by no coverage row | 7 (§3) |
| Coverage rows referencing a non-existent evidence id | 0 |
| Synthetic rows present in `canonical-dataset.json` | 0 |

## 7. What must happen before anything is published

1. **Relink the 3 orphaned COURSE evidence records** (§3) — no new collection.
2. **Demote all 8 courses to `PARTIALLY_VERIFIED`** and publish only evidenced fields, with
   unevidenced fields rendered as unknown. Never backfill a missing fee from a different page.
3. **Keep 23 (`NOT_PUBLISHED`) and 37 `NOT_PUBLISHED` distinct from "closed"** in the UI vocabulary.
4. **Do not treat a `UNIVERSE_SOURCE` or `URL_CHECK` record as course evidence.** 46 of the 76 records
   are one of those two classes.
5. **Do not promote Aston** until its parser is fixed and the output re-derived.
