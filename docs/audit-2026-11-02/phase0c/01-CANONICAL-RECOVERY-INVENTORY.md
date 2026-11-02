# Phase 0C · 01 — Canonical Recovery Inventory

**Generated:** 2026-11-02 · **Script:** `phase0c/build-canonical.py` (read-only, idempotent)
**Inputs:** `AUDIT/PHASE1_INSTITUTION_INVENTORY_2026-10-29.csv`, `AUDIT/PHASE1_SOURCE_REGISTER_2026-10-29.csv`,
`data/verified-2027/dataset.json`, `data/official-source-audit/*`, `data/catalogue-review/*`,
`01_ALO_UNIVERSITY_MASTER.csv`, `universities.csv`, `02_ALO_COURSE_MASTER.csv`,
`04_ALO_UNIVERSITY_COURSE_MASTER.csv`, `courses.csv`, `02_ALO_COURSE_INTAKES_2027.csv`
**Outputs:** `canonical-institutions.csv` (593), `canonical-courses.csv` (8,746), `canonical-intakes.csv` (927),
`canonical-dataset.json`, `recovery-summary.json`, `conflicts.csv` (159), `coverage-by-destination.csv`

Nothing was deleted, overwritten or merged. Every source file is still byte-identical; this report
only *describes* what a consolidation would produce, so that a decision can be made before one is run.

---

## 1. Headline numbers

| Record type | Total rows | Verified | Synthetic / unsupported | Out of scope |
|---|---:|---:|---:|---:|
| Institutions | 593 | **79** identity-verified | 514 synthetic-only | 302 out of scope |
| Courses | 8,746 | **7** (`VERIFIED`) + 1 `PARTIALLY_VERIFIED` | 8,735 synthetic | 4 non-synthetic unverified |
| Intake / course-month records | 927 | **104** from the verified dataset | 823 synthetic | — |
| Evidence records | 76 | — | — | 30 catalogue · 32 universe-source · 14 URL-check |

Two figures in earlier reports need correcting:

* **"8 verified courses" is not one status.** The dataset holds 7 `VERIFIED`, 1 `PARTIALLY_VERIFIED`
  (Yonsei) and 3 `NEEDS_REVIEW` (Aston). Publishing "8 verified" would have overstated by one and
  silently included a partially-evidenced record.
* **"70 identity-verified institutions" understated the recovered set.** The authoritative count from
  the Phase 1 inventory plus the verified dataset is **79** rows — but that is 79 *rows*, not 79
  institutions, because of duplicates (§5). The distinct count is **78**, and at most **76** if the
  two remaining suspicious pairs are confirmed.

## 2. What "recovered" means here

Recovery is **inventory-level only**. No record was promoted, rewritten, re-scraped or re-labelled.

| Recovered | Provenance preserved as |
|---|---|
| 79 identity-verified institutions | per-row `provenance` listing every contributing file, `identity_evidence`, `regulator_identifier` |
| 8 non-synthetic courses | `source`, `evidence_ids`, `last_verified_at`, original `verification_status` kept verbatim |
| 104 course-month records | `status` kept as recorded (`VERIFIED_AVAILABLE` 15, `VERIFIED_NOT_OFFERED` 52, `NOT_PUBLISHED` 37) |
| 30 catalogue evidence records | full row: `sourceUrl`, `excerpt`, `fieldScope[]`, `retrievedAt`, `httpStatus` |
| 32 universe-source + 14 URL-check records | kept in `evidence-manifest.csv` as supporting, non-publishable evidence |
| 823 synthetic intakes | retained and **flagged**, never mixed into the verified subset |

`canonical-dataset.json` contains **only** the verified subset, copied verbatim from
`data/verified-2027/dataset.json` and stamped `containsSyntheticData: false`. The synthetic masters
were *not* merged into it — they remain separate files that the application can keep ignoring.

## 3. The recovered verified set, in full

**Institutions with identity evidence (79 rows).** By country, after the Ireland label fix:

| Country | Identity-verified | Known rows | Identity source |
|---|---:|---:|---|
| Australia | 44 | 54 | TEQSA National Register (TQNR) |
| Ireland | 19 | 28 | HEA list |
| New Zealand | 9 | 27 | Universities New Zealand list |
| United Kingdom | 2 | 141 | OfS / Scottish / Welsh / NI registers (universe not extracted) |
| Canada | 1 | 21 | DLI list (not extracted) |
| Germany, Denmark, Japan, South Korea | 1 each | — | `dataset.json` official-site traversal |
| United States | 0 | 20 | College Navigator (not extracted) |

**Courses with any non-synthetic evidence (11 rows):** 7 `VERIFIED` (Manchester MSc Accounting,
Centennial ×2, Monash Master of Business, TUM MSc Informatics, Auckland MDataSci, Copenhagen MSc CS),
1 `PARTIALLY_VERIFIED` (Yonsei BSc CS), 3 `NEEDS_REVIEW` (Aston — all unpublishable, see report 02 §5).

**Course-month records (104):** 15 `VERIFIED_AVAILABLE`, 52 `VERIFIED_NOT_OFFERED`, 37 `NOT_PUBLISHED`.
The 52 verified-negative rows are a genuine asset: they are *proof a programme does not run in that
month*, which prevents the "intake every month" fiction the synthetic set is full of.

## 4. Ireland was silently split in two — fixed

The Phase 1 inventory writes Ireland two ways: `Ireland` and `Ireland (Republic of Ireland)`. The
first consolidation treated them as different countries, producing 18 Irish institutions and a second
one-row country. Normalising the regulator's label merged them to **19**.

This is exactly the class of defect the consolidation must not ship: two country rows for one country
would have created two destination pages, two sets of filters and an inconsistent count on the public
site. Recorded as fixed in `build-canonical.py` (`IRELAND_LABELS`).

## 5. Duplicates: 12 confirmed alias pairs, 21 suspects

Name-keyed consolidation cannot see that two rows are one provider. `phase0c/build-duplicates.py`
finds them and classifies each pair by an explicit rule.

**12 CONFIRMED_ALIAS pairs** (identical distinctive tokens; safe to merge):

| Country | Keep | Merge |
|---|---|---|
| AU | Australian Catholic University | Australian Catholic University |
| AU | Bond University Limited | Bond University |
| AU | RMIT University | RMIT University |
| AU | The University of Adelaide | University of Adelaide |
| AU | The University of Melbourne | University of Melbourne |
| AU | The University of Queensland | University of Queensland |
| AU | The University of Western Australia | University of Western Australia |
| AU | University of Notre Dame Australia | University of Notre Dame Australia |
| AU | University of Sydney | University of Sydney |
| IE | Dún Laoghaire Institute of Art, Design and Technology | … Design & Technology |
| NZ | The University of Auckland | University of Auckland |
| UK | The University of Manchester | University of Manchester |

These are verified-vs-unverified twins, so they inflate the **row** count (593) but not the verified
count. The synthetic masters duplicate 10 of Australia's 44 identity-verified institutions and the
UK's only verified course-bearing institution.

**21 DUPLICATE_SUSPECT pairs need a human decision** — they are *not* merged. The material ones:

* **Auckland appears three times**: `University of Auckland` (synthetic), `The University of Auckland`
  (verified, from `dataset.json`), `Waipapa Taumata Rau, University of Auckland` (verified, from the
  Phase 1 inventory). Two verified rows, one university → **verified count 79 → 78**.
  This also explains New Zealand's "9 verified" against the 8 universities that actually exist.
* Māori/English dual names in NZ: `Lincoln University` / `Te Whare Wānaka o Aoraki Lincoln University`;
  `Massey University` / `Te Kunenga ki Pūrehuroa Massey University`; `University of Canterbury` /
  `Te Whare Wānanga o Waitaha | University of Canterbury`; `University of Otago` /
  `University of Otago - Ōtākou Whakaihu Waka`. These are one institution each, but the Māori name is
  the *official* name and the English one is what students search — both must survive as aliases of a
  single record, not as separate institutions.
* **Adelaide University vs The University of Adelaide** — deliberately *not* merged. Adelaide
  University is the 2026 merged entity that replaced the University of Adelaide; they are distinct
  legal providers and the older one may still hold live records.
* `Torrens University Australia` vs its 24-alias bundle row (see §6).
* `Arden University` vs `Arden University – Birmingham/Bristol/Leeds/Manchester` — one provider,
  four campuses. These must become a parent institution with campus children, not five institutions.

**Rejected false positives** (shared generic words only): `Australian Catholic University` vs
`Australian National University`, `Queensland University of Technology` vs `University of Queensland`,
`University of Birmingham` vs `University College Birmingham`, `University of Milan` vs `Polytechnic
University of Milan`, `University of Cyprus` vs `Open University of Cyprus` / `American University of
Cyprus` / `European University of Cyprus`, `University of Malta` vs `American University of Malta`,
`University of Sharjah` vs `American University of Sharjah`, `University of São Paulo` vs `Pontifical
Catholic University of São Paulo`, `Sorbonne University` vs `Pantheon-Sorbonne University`.
An earlier iteration of the script merged all of these; the rule set was tightened until it did not.

## 6. Conflicts (159) — full breakdown

| Type | Count | Severity | Meaning |
|---|---:|---|---|
| `VERIFICATION_LABEL_DISAGREEMENT` | 154 | HIGH | one institution carries two labels across files: `CROSS_SOURCE_VERIFIED | NEEDS_REVIEW` (79) and `NEEDS_REVIEW | VERIFIED_OFFICIAL` (75) |
| `ALIAS_BUNDLE_NEEDS_SPLIT` | 3 | MEDIUM | one row holds many aliases: Torrens (24 comma-separated aliases in `display_name`), Atlantic TU (`formerly IT Sligo`), Munster TU (`formerly Cork IT`) |
| `COVERAGE_COUNT_DISAGREEMENT` | 1 | MEDIUM | Australia 20 (`01_ALO_UNIVERSITY_MASTER.csv`) vs 40 (`universities.csv`) |
| `SYNTHETIC_COURSE_LEVEL_AMBIGUITY` | 1 | LOW | synthetic rows mix study levels for the same course key |

The 154 label disagreements are the reason report 04 exists. They are **not** auto-converted: a
`VERIFIED_OFFICIAL` claim is not evidence, and neither is `CROSS_SOURCE_VERIFIED` when both sources are
the same synthetic seed.

## 7. Limits of this recovery — stated, not hidden

1. **The synthetic set is untouched and still large**: 8,735 synthetic courses (99.9% of all course
   rows) and 823 synthetic intakes remain on disk. `canonical-dataset.json` excludes them, but nothing
   prevents another import from reading the CSVs directly.
2. **UK is the biggest gap and the hardest to close**: 141 known rows, 2 identity-verified, 1 course.
   The 140-row `uk-university-profile-review-queue.csv` is a *sample*, not a provider universe.
3. **No new external collection was performed** (Phase 0C constraint). Australian TEQSA, NZ, Canadian
   DLI and US College Navigator enumeration remain undone.
4. **Course-month coverage is thin and honest**: 104 rows for 8 courses, mostly 13 months each, all
   `2027` (96) and `2028` (8). That is what the evidence supports; the synthetic set's implied
   "every month available" is the opposite of it.
5. **`NOT_PUBLISHED` (37) is not "available"**: it means the university publishes no such intake. Any
   UI that renders "no intake" as "closed" rather than "not offered" is misreading the data.
6. **Institution identity ≠ course verification.** 79 institutions are known to exist. Exactly 1 has a
   verified course in the UK, 1 in Australia, 1 in NZ, 2 in Canada. Knowing a university is real says
   nothing about whether its MSc runs in September.
