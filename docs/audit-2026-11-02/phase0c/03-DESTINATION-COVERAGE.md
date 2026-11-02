# Phase 0C · 03 — UK & Other Destination Coverage

**Generated:** 2026-11-02 · **Source:** `coverage-by-destination.csv`, `canonical-institutions.csv`,
`canonical-courses.csv`, `canonical-intakes.csv`, `data/catalogue-review/*`
**Scope:** six live destinations (UK, Australia, New Zealand, Ireland, Canada, United States) plus the
secondary synthetic-only destinations (Germany, Denmark, Japan, South Korea)

---

## 1. Coverage table

| Destination | Known rows | Identity-verified | Catalogue surveyed | Verified courses | Course-months | Evidence records | Synthetic courses on disk |
|---|---:|---:|---:|---:|---:|---:|---:|
| **United Kingdom** | 141 | **2** | 2 | 1 | 13 | 8 | 5,618 |
| **Australia** | 54 | **44** | 1 | 1 | 13 | 2 | 776 |
| **New Zealand** | 27 | **9** (8 distinct) | 1 | 1 | 13 | 4 | 595 |
| **Ireland** | 28 | **19** | 1 | 0 | 0 | 1 | 530 |
| **Canada** | 21 | **1** | 1 | 2 | 26 | 6 | 628 |
| **United States** | 20 | **0** | 0 | 0 | 0 | 0 | 588 |

The synthetic column explains the illusion: 8,735 synthetic courses across six destinations, against
8 courses with any evidence. The live Course Finder is empty because the data is empty, not because
the filter is broken.

## 2. United Kingdom — the largest gap, and the most misrepresented

**What exists.** 141 rows. Two identity-verified institutions (Manchester, and one further row), one
verified course (Manchester MSc Accounting, 6/10 field groups, 13 course-months), 8 evidence records.
`uk-university-profile-review-queue.csv` holds 140 rows (`UNI-UN-0086`…) — a **worked sample**, not a
provider universe.

**What does not exist.** Any enumeration of UK providers from OfS / Scottish Funding Council / Welsh
or NI registers. The registers are authoritative and public; nobody has extracted them. So the UK is
the one destination where the repository has *codes that look authoritative and a population that was
never counted*.

**The specific trap.** A 140-row file named "review queue" covering UK universities invites exactly
one wrong conclusion — "the UK universe is 140". It is not. The UK has ~160 OfS-registered providers
alone, before Scotland, Wales and NI, and before alternative providers. And of those 140 rows, only
2 carry identity evidence.

**What this permits today.** One publishable UK course (Manchester MSc Accounting), with campus, start
months, deadline and English requirement suppressed as unknown. That is the honest UK payload.

**What it does not permit.** Any UK destination page claiming coverage, any "140 UK universities"
marketing statement, any count derived from the synthetic master.

## 3. Australia — best identity coverage, worst course coverage

44 of 54 rows identity-verified from the TEQSA National Register, restricted to the **"Australian
University" category**. Other TEQSA categories (University College, Institute of Higher Education,
Overseas University) were not enumerated, so "44 of 54" is "44 of the rows we happened to hold", not
44 of Australia's providers.

One verified course (Monash Master of Business) and it is the *thinnest in the whole verified set*:
one evidence record, 2/10 field groups, no duration, no fee, no deadline. Monash is a well-documented
public catalogue (`handbook.monash.edu/2027/courses/B6005`); the shortfall is collection effort, not
availability.

Also the only destination with an explicit **coverage-count disagreement**: Australia appears as 20
rows in `01_ALO_UNIVERSITY_MASTER.csv` and 40 in `universities.csv`. Two files, two answers, one
country — recorded as `COVERAGE_COUNT_DISAGREEMENT` (MEDIUM).

## 4. New Zealand — the one destination whose universe is actually complete

Universities New Zealand publishes exactly **8** universities, and all 8 are in the identity-verified
set — but the set contains **9 rows** because Auckland is recorded twice (English name from
`dataset.json`, Māori name `Waipapa Taumata Rau` from the Phase 1 inventory). The corpus also carries
Māori/English dual names for Lincoln, Massey, Canterbury and Otago as separate rows pending merge
(report 01 §5).

So NZ is simultaneously the **most complete** destination (8/8 real universities) and the one whose
count is most visibly wrong (9). Fixing it is a dedupe, not a collection task — the cheapest accuracy
win available.

One verified course: Auckland Master of Data Science, 5/10 field groups, 13 course-months.

## 5. Ireland — universe captured, zero courses

19 identity-verified institutions from the HEA list (after merging the `Ireland` /
`Ireland (Republic of Ireland)` label split, report 01 §4). **Zero verified courses, zero course-month
records.** Dublin Business School holds one `UNIVERSITY`-level evidence record about international
intake months — that is evidence about a *process*, not about a programme, so it cannot publish a
course.

Ireland therefore has 19 institutions that are known to exist and nothing to show a student. QQI
providers were never enumerated; `educationinireland.com/en/universities/` returns 404 today (recorded
in the Phase 0A web notes), so the correct Enterprise Ireland source must be located before any Irish
collection.

## 6. Canada — best course data, worst identity data

The inversion of everywhere else: **2 verified courses** (Centennial Biotechnology Fast-Track and
Construction Project Management) with **26 course-months** — the most course-month depth of any
destination — and only **1** identity-verified institution.

The DLI (Designated Learning Institution) list was not extracted, so Canada cannot state how many
designated institutions exist, which of them are public, or which are eligible for a post-graduation
work permit. For a Bangladeshi student audience, PGWP eligibility is a decision field, and it is marked
`pgwpAligned` in the evidence scope without an authoritative list behind it.

The two Centennial courses are also the ones with 4/10 field coverage that could reach 6/10 by
relinking orphaned evidence (report 02 §3).

## 7. United States — synthetic only, and must stay unpublished

20 rows, **0** identity-verified, 0 courses, 0 evidence, 588 synthetic courses. College Navigator was
not extracted. There is no honest US claim to make; the destination should be presented as
"not yet available" rather than with synthetic placeholders.

## 8. Secondary destinations (Germany, Denmark, Japan, South Korea)

Each holds 1 identity-verified institution from the verified dataset and 20 synthetic rows in the
master CSV:

| Destination | Identity-verified | Verified course | Course-months |
|---|---|---|---|
| Germany | TUM | MSc Informatics (6/10) | 13 |
| Denmark | University of Copenhagen | MSc Computer Science (4/10) | 13 |
| Japan | (Kyoto, university-level evidence only) | 0 | 0 |
| South Korea | Yonsei | BSc CS (`PARTIALLY_VERIFIED`, 4/10) | 13 |

These four sit outside the six named destinations but each contributes real evidence. Japan has
university-level calendar evidence (`semesterOneStart`, `semesterTwoStart`) and no course — the same
pattern as Ireland.

## 9. What "coverage" may and may not be claimed

| Statement | Truthful? |
|---|---|
| "We have 8 verified courses across 6 destinations" | **Yes** — 8 courses with evidence, in 6 countries |
| "We have 79 verified universities" | **No** — 79 rows, 78 distinct, and "verified" means *identity only* |
| "UK: 140 universities reviewed" | **No** — 140-row sample; 2 identity-verified |
| "Australia: 44 universities verified" | **Yes, with the caveat** — 44 in the Australian University category |
| "New Zealand: all 8 universities" | **Yes** — the only complete universe, once the 9th row is merged |
| "Ireland: 19 universities" | **Yes for identity, No for courses** — zero course evidence |
| "Canada: DLI-listed institutions" | **No** — the DLI list was never extracted |
| "USA: universities available" | **No** — 20 synthetic rows |

## 10. Ordered gaps, cheapest first

1. **Dedupe NZ (Auckland triple + 4 dual-name pairs)** — 0 collection, fixes a visibly wrong count.
2. **Relink 3 orphaned course evidence records** — 3 row edits, lifts 2 courses from 4/10 to 6/10.
3. **Deepen the 7 already-verified courses** (Monash 2/10 → 10/10 is a single public handbook).
4. **Enumerate Ireland QQI + UK OfS registers** — turns "sample" into "universe".
5. **Enumerate Canada DLI** — needed before any PGWP claim.
6. **Enumerate TEQSA non-university categories** — extends Australia beyond 44.
7. **US College Navigator** — lowest priority; no evidence exists at all today.
