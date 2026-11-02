# 3 · UNIVERSITY & COURSE DATA INVENTORY

**Scope:** every university/course/intake/fee/scholarship/requirement dataset on disk — root masters, `docs/import-templates/*`, `data/`, `AUDIT/`, `alo-education-web-crm-final/`, `imports/*`.
**Method:** `docs/audit-2026-11-02/inventory-datasets.py` → [`datasets.csv`](datasets.csv) (2,014 dataset files, one row each) + [`dataset-summary.json`](dataset-summary.json).
**Nothing here was imported, merged or published.** No database was reachable, so **no live row counts are claimed**.

---

## 1. Headline numbers

| Measure | Value |
| --- | --- |
| Dataset files parsed (csv/json/tsv; sql/xlsx listed not parsed) | **2,014** |
| Total data rows across all files | **3,933,878** |
| …of which are redundant duplicates inside their own file | **>3.1 M** (see §3) |
| Distinct **synthetic** course entities | ~11,200 (from `courses.csv` / seed generator) |
| Distinct **synthetic** university entities | 400 (`01_ALO_UNIVERSITY_MASTER.csv`, `universities.csv` 560 incl. duplicates of the same set) |
| **Genuinely researched** institutions with official source URLs | **70** (`AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv`) |
| **Genuinely researched** universities in the verified dataset | **10** (`data/verified-2027/dataset.json`) |
| **Genuinely researched** courses in the verified dataset | **8** |
| Verified course-month rows (2027-01 → 2028-01) | **104** (15 `VERIFIED_AVAILABLE`, 52 `VERIFIED_NOT_OFFERED`, 37 `NOT_PUBLISHED`) |
| Evidence records with SHA-256 + excerpt | **30** |
| Courses verified against an official course page | **8** of 8 in the verified dataset; **0** of the generated masters |
| Datasets that pass the public visibility gate as-is | 0 files (no file carries `verificationStatus = VERIFIED` + `publicationStatus = published` + course-level URL together) |

---

## 2. The competing "masters" (all at repository root)

| File | Rows | Unique rows on natural key | Redundant rows | https source share | Assessment |
| --- | --- | --- | --- | --- | --- |
| `04_ALO_UNIVERSITY_COURSE_MASTER.csv` | 32,033 | 9,928 (uni+course+level+month+year) | **22,105** | 100% | Generated; duplicates 69% |
| `02_ALO_COURSE_MASTER.csv` | 17,653 | 5,565 (uni+course+level) | **12,088** | 100% | Generated; duplicates 68% |
| `ALO_MASTER_COURSE_DATABASE.csv` | 14,600 | — | — | 100% | Parallel master |
| `courses.csv` | 11,200 | 9,858 | 1,342 | none | Generated; every row labelled `VERIFIED_OFFICIAL` |
| `01_ALO_UNIVERSITY_MASTER.csv` | 400 | 399 | 1 | 100% | Generated (399 `NEEDS_REVIEW`, 1 `VERIFIED_OFFICIAL`) |
| `universities.csv` | 560 | 559 | 1 | 100% | Overlaps the 400 set |
| `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` | 400 uni / ~10k course objects | — | — | — | "VERIFIED" in the filename is **not** verification (see §4) |
| `03/05/07_ALO_TUITION_FEES.csv`, `tuition_fees.csv`, `03_course_intakes_fees.csv` | **145,600 each** | 11,200 | **134,400 each** | none | Cross-join explosion (11,200 courses × 13 months) |
| `06/08_ALO_APPLICATION_DEADLINES.csv`, `application_deadlines.csv` | 145,600 each | 145,600 | 0 | none | Same cross-join |
| `course_intakes.csv` | 145,600 | — | — | 100% | Same |
| `ALO_SYNTHETIC_DATA_REJECTED.csv` | 17,182 | 399 universities | 16,783 | — | **Prior rejection record of the synthetic set** |
| `06/17_ALO_MISSING_UNIVERSITY_INFO.csv`, `ALO_MISSING_UNIVERSITY_INFO.csv` | 3,600 each | 400 | 3,200 | — | 9 "missing info" rows per university |

**Four competing import packages** exist under `docs/import-templates/`: `package/` (18 files), `package-real/` (20), `package-verified/` (19), `uni-package/` (8) — plus a `course-package/` (15). Their contents are byte-identical to root masters in several cases (see report 4).

---

## 3. Duplication inside single files (measured, not estimated)

| File | Rows | Unique-key rows | Duplicate-key rows |
| --- | --- | --- | --- |
| `03_course_intakes_fees.csv` | 145,600 | 11,200 | 134,400 |
| `05_ALO_TUITION_FEES.csv` | 145,600 | 11,200 | 134,400 |
| `07_ALO_TUITION_FEES.csv` | 145,600 | 11,200 | 134,400 |
| `ALO_TUITION_FEES.csv` | 145,600 | 11,200 | 134,400 |
| `tuition_fees.csv` | 145,600 | 11,200 | 134,400 |
| `docs/import-templates/package-verified/06_ALO_ENGLISH_REQUIREMENTS.csv` | 52,959 | 17,653 | 35,306 |
| `04_ALO_UNIVERSITY_COURSE_MASTER.csv` | 32,033 | 9,928 | 22,105 |
| `02_ALO_COURSE_MASTER.csv` | 17,653 | 5,565 | 12,088 |

A row count in this repository therefore over-states real content by **up to 13×**. Any report that quotes "145,600 fee records" or "32,033 courses" is quoting duplication.

---

## 4. Synthetic vs researched — how to tell them apart (evidence)

| Signal | Synthetic masters | Researched data |
| --- | --- | --- |
| Course URL shape | `https://www.ox.ac.uk/courses/<slug-of-title>` | exact official programme page |
| URL actually resolves | **No** — fetched `https://www.ox.ac.uk/courses/foundation-certificate-in-medicine` → **HTTP 404 “Page not found”** (2026-11-02) | Yes (Aston, Manchester, Monash, TUM, Auckland …) |
| Source column | generic `https://www.ox.ac.uk/admissions` (all 400 rows per university) | course-level + evidence excerpt |
| Titles | templated ("Foundation Certificate in Medicine", "BSc (Hons) Law" for Oxford) | exact award titles |
| Fees | flat values (£28,000 / £49,000 for every Oxford course) | verbatim from fee schedule, or `NOT PUBLISHED` |
| Verification label | `VERIFIED_OFFICIAL` on generated rows | `VERIFIED` with evidence ID |
| Generator | `scripts/seed-400-universities.ts`, `prisma/seed-massive-universities.ts` | `scripts/verified-catalogue/*`, `data/verified-2027` |

**Rule applied:** a `VERIFIED_OFFICIAL` label is **not** evidence of verification. Only rows with a resolving official course URL + evidence record were counted as verified (8 courses).

---

## 5. Genuinely verified institutions already in the repo (recover, don't redo)

### 5.1 `AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv` — 70 rows

| Country | Rows | Source basis | Status in file |
| --- | --- | --- | --- |
| Australia | **44** | TEQSA National Register (TQNR API, `Category=Australian University`, all `RegistrationStatus=Active`), CRICOS codes captured | `REGULATOR_CATEGORY_AND_ACTIVE_STATUS_CONFIRMED; institution-level sources incomplete` |
| New Zealand | **8** | Universities New Zealand – Te Pōkai Tara list | `SECTOR_UNIVERSE_LISTED_AND_OFFICIAL_WEBSITE_LINKED` |
| Ireland | **18** | HEA list (7 universities, 5 technological universities, 2 institutes of technology, 2 specialist colleges, 1 learned academy, 1 private) | `HEA_LISTED; category cross-check is preliminary` |

Every row has `international_course_catalogue_source_status = NOT_SURVEYED` — **identity is settled, courses are not**.

### 5.2 `data/verified-2027/dataset.json` — the only end-to-end traced sample

10 universities / 8 courses / 104 course-months / 30 evidence records / 10 catalogue traversals / 17 research-queue items.
Includes Manchester, Ulster, Monash, Centennial College, Auckland, Dublin Business School, TUM, Copenhagen, Kyoto, Yonsei.
**Caveat:** 4 institutions are outside the six declared destinations (Germany, Denmark, Japan, South Korea). Coverage of the declared destinations in this dataset: UK 2, AU 1, NZ 1, IE 1, CA 1, **US 0**.

### 5.3 `data/official-source-audit/`

| File | Rows | Use |
| --- | --- | --- |
| `aston-course-discovery-candidates.csv` (also `data/catalogue-review/`) | 471 | Aston discovery candidates |
| `aston_courses_parsed.csv` | 3 | Parsed Aston courses (19 cols) |
| `URL_validation_report.csv` | 7 | Prior URL checks |
| `aston_verification_report.{json,md}`, `final_database_audit.json`, `duplicate_merge_report.csv` | — | Prior verification evidence |
| `courses_discovered.csv`, `courses_verified.csv`, `rankings_verified.csv`, `rejected_records.csv` | **0 rows** | Empty — previous collection stopped early |

### 5.4 `data/catalogue-review/`

| File | Rows | Use |
| --- | --- | --- |
| `uk-university-profile-review-queue.csv` | **140** | The "140 UK institutions" list — a **review queue**, not verified eligibility |
| `bangladesh-destination-review-shortlist.csv` | 24 | BD-relevance shortlist |
| `aston-course-discovery-candidates.csv` | 471 | Discovery candidates |

---

## 6. Coverage by destination (honest position)

| Destination | Institution universe | Identity-verified rows | Course-level verified | Coverage statement |
| --- | --- | --- | --- | --- |
| Australia | TEQSA/TQNR accessible | **44** | 1 (Monash) | Identity complete for "Australian University" category; courses 1 of thousands |
| New Zealand | 8 (Universities NZ) | **8** | 1 (Auckland) | Universe complete; courses 1 of thousands |
| Ireland | HEA list | **18** | 1 (Dublin Business School) | Universe captured; courses 1 |
| United Kingdom | OfS 425 registered providers / Scotland 19-18 / Wales 11 / NI 4+17 (recorded in the Phase-1 report) | **0** | 2 (Manchester, Ulster) | **Universe NOT verified**; 140-row list is a review queue |
| United States | College Navigator identified, not extracted | **0** | 0 | Not started |
| Canada | DLI list identified, not extracted | **0** | 1 (Centennial) | Not started (1 course sample only) |

**No destination can be described as "courses collected".** The only complete universes are NZ (8) and, for the "Australian University" category, AU (44).

---

## 7. Where the data is broken even as synthetic data

1. `01_ALO_UNIVERSITY_MASTER.csv` has 399/400 rows at `NEEDS_REVIEW` → cannot pass any public gate.
2. `02_ALO_COURSE_INTAKES_2027.csv` has all 823 rows at `REQUIRES_REVIEW` (a label no gate recognises).
3. `05_ALO_TUITION_FEES.csv` (145,600 rows) has **no** `verification_status` column at all → unusable for a fee publication decision.
4. Course URLs are templated and 404 — they would create dead links on public pages.
5. Two different intake label vocabularies (`intake_month` as text month vs `intake_month` as number) appear across files; `parseIntakePeriodToken` in `src/lib/course-finder/intake-window.ts` handles both, but the CSVs do not agree.

---

## 8. Recommended disposition (proposal only — no action taken)

| Dataset | Proposal |
| --- | --- |
| `AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv` | **Adopt as the Phase-1 institution baseline**; extend with UK/US/CA universes |
| `data/verified-2027/dataset.json` | **Keep as the pilot dataset**; it already flows through ingest → approval → publish |
| `data/official-source-audit/*`, `data/catalogue-review/*` | Keep; merge into one source register |
| Root synthetic masters (111 CSVs) | **Quarantine**: archive read-only, never import, never count. `ALO_SYNTHETIC_DATA_REJECTED.csv` shows they were already rejected once |
| `docs/import-templates/*` (5 packages) | Collapse to one package after a line-by-line mapping review |
| `alo-education-web-crm-final/*` duplicates | Delete from history-free scope after approval (550 MB reclaimable; see report 4) |
