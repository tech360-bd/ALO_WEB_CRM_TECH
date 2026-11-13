# Why not every university / course shows on the website and Course Finder

The website, `/courses`, `/course-finder`, `/universities`, `/destinations` and the student
portal all read the **same** `CrmUniversity` / `CrmCourse` tables — but they only show rows
that pass the *public catalogue gate*. The gate is one function pair in
`src/lib/public-catalog.ts` (`publicUniversityWhere`, `publicCourseWhere`).

A row is public only when **all** of the following are true:

| Gate | Field | Required value |
| --- | --- | --- |
| Live | `status` | exactly `active` |
| Verified | `verificationStatus` | exactly `VERIFIED` |
| Published | `publicationStatus` | `published` (or `PUBLISHED`) |
| Sourced | `sourceUrl` **or** `officialUrl` | starts with `https://` |
| International | `internationalEligibility` | not `closed` / `domestic` / `home only` |
| Parent (courses) | `university` | the university must pass the gate itself |

Fees, intake dates, deadlines and IELTS minimums have their **own** gates
(`publicIntakeWhere`, `publicRequirementWhere`): an intake/requirement row must be
`VERIFIED` and carry an `https://` source URL. That is why an already visible course can
still show “not published” for its tuition or intakes.

## Where each status comes from

| Writer | Verification written | Publication written | Visible? |
| --- | --- | --- | --- |
| `scripts/seed-400-universities.ts`, `universities.csv`, `courses.csv` | `VERIFIED_OFFICIAL`, `CROSS_SOURCE_VERIFIED`, `NEEDS_REVIEW` | `published` | **No** — the gate wants the literal `VERIFIED` |
| `POST /api/admin/import/universities` / `courses` (CSV upload) | `NEEDS_REVIEW` | `draft` | No |
| `01_ALO_*` / `04_ALO_UNIVERSITY_COURSE_MASTER.csv` (`verification_status`) | `NEEDS_REVIEW` / `REQUIRES_REVIEW` | not set → `draft` | No |
| `src/lib/verified-catalogue/ingest.ts` (researched dataset) | `VERIFIED` / `PARTIALLY_VERIFIED` | `draft` + approval-queue item | Only after a Super Admin approves |
| `src/lib/verified-catalogue/publish.ts` (Super Admin approval) | `VERIFIED` | `published` + `status: active` | **Yes** |

So a database with 400 seeded universities and 17,000 generated courses can legitimately
show only a handful of records: everything except approved, researched data is held back by
design, and rows labelled `VERIFIED_OFFICIAL` / `CROSS_SOURCE_VERIFIED` never pass the
literal `VERIFIED` check.

## The two writer bugs that were fixed

1. **Approved courses kept `status: 'published_verified'`** while the gate requires
   `'active'`, so a Super Admin could approve a course and it still never appeared.
2. **The parent university stayed on ingest’s `verified_pending_approval`** status, and
   `publicCourseWhere()` requires a public university — so every course of that university
   stayed hidden too.

Both are fixed in `src/lib/verified-catalogue/publish.ts` (`coursePublicationPatch`,
`universityPublicationPatch`) and locked by
`tests/unit/public-catalogue-publish.test.ts`.

## Diagnose a real database

```bash
npm run catalogue:diagnose                       # read-only funnel + blockers
npm run catalogue:diagnose -- --json             # machine readable
npm run catalogue:diagnose -- --apply            # repair rows published by the approval flow
npm run catalogue:diagnose -- --apply --normalize-verification
```

The report prints the stored vocabulary (`status`, `verificationStatus`,
`publicationStatus` counts), the funnel per gate, and a blocker table such as
“verified + active but `publicationStatus=draft` → needs an approval/publish step”.

`--apply` never marks anything verified and never publishes a draft. It only rewrites the
non-canonical statuses written by the old approval flow (`published_verified`,
`verified_pending_approval`) to `active` for rows that are already published.
`--normalize-verification` is a separate, explicit opt-in that maps
`VERIFIED_OFFICIAL` / `CROSS_SOURCE_VERIFIED` to `VERIFIED`; only use it if your team accepts
that those labels mean the same thing.

## Making more data public (in the intended order)

1. **Verify** the record against the official page and store that URL in `sourceUrl` /
   `officialUrl` (both must be `https://`).
2. **Publish** it: `publicationStatus = 'published'` **and** `status = 'active'`.
3. Do the same for the parent university, otherwise its courses stay hidden.
4. Add **verified** intake/fee and requirement rows (own source URL) so fees, intakes,
   deadlines and IELTS minimums are allowed out of `publicIntakeWhere` /
   `publicRequirementWhere`.
5. Never “fix” visibility by loosening the gate for `NEEDS_REVIEW` data — the site’s
   promise is that published facts are source-backed.
