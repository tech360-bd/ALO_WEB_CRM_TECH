# ALO verified catalogue dataset — 2027/28 cycle

`dataset.json` is the staging dataset produced by the official-source research
pass of **2026-10-29**. It is validated by
`src/lib/verified-catalogue/validation.ts` and ingested by
`scripts/verified-catalogue/ingest.ts`.

## Schema

```jsonc
{
  "schemaVersion": "1.0.0",
  "datasetId": "alo-verified-2027-2028-cycle-2026-10-29",
  "generatedAt": "2026-10-29T09:30:00Z",
  "window": { "startYear": 2027, "startMonth": 1, "endYear": 2028, "endMonth": 1 },
  "evidence":   [ /* official page excerpts */ ],
  "universities": [ /* verified institutions */ ],
  "courses":    [ /* verified programmes */ ],
  "coverage":   [ /* one row per course-month (13 per course) */ ],
  "traversals": [ /* catalogue traversal checkpoints */ ],
  "researchQueue": [ /* outstanding university-by-university work */ ]
}
```

## Evidence rules

1. `sourceUrl` must be `https:` and, for course/university records, on the
   institution's own domain (validated before ingest).
2. `excerpt` is a short, verbatim quote from that page. Whitespace is collapsed
   and table cell separators become single spaces; word order is untouched.
3. `retrievedAt` is the real collection timestamp. `publishedAt` is only filled
   when the source states a publication date.
4. At ingest the normalised excerpt is hashed with SHA-256 and stored on
   `CrmOfficialEvidence.contentHash`. Changing one character produces a new
   evidence row instead of overwriting history.

## Coverage rules

* Every course has exactly 13 rows (January 2027 … January 2028).
* `VERIFIED_AVAILABLE` rows carry an intake name or start date plus a source URL.
* `VERIFIED_NOT_OFFERED` is only used where the programme publishes an explicit
  intake enumeration; the enumeration basis is written into `conflictNote`.
* `NOT_PUBLISHED` is used when the page does not answer the question. It is
  never converted into “not offered”.
* A fee is only present on a row whose `academicYear` actually covers that
  month. The shipped dataset deliberately leaves Centennial’s 2027-start fees at
  zero because the official tuition table is explicitly based on two semesters
  beginning **Fall 2026** — copying that figure into September 2027 would be a
  fabricated 2027 fee.

## Current contents (2026-10-29)

| Item | Count |
| --- | --- |
| Evidence records | 18 |
| Universities with verified official sources | 6 (UK ×2, Canada, Australia, Ireland, Japan) |
| Courses verified at course level | 4 |
| Course-month coverage rows | 52 |
| VERIFIED_AVAILABLE | 9 |
| VERIFIED_NOT_OFFERED | 18 |
| NOT_PUBLISHED | 25 |
| Research-queue items | 14 |

Everything not in this dataset is **outstanding research**, not “no intake”.
See `researchQueue` and the `CrmResearchQueueItem` table.
