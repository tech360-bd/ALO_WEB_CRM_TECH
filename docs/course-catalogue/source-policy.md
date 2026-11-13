# Course catalogue — source and licence policy

**Applies to:** the university/course catalogue consumed by the public directory
(`/universities`, `/courses`, `/course-finder`) and the CRM (`CrmCourse`,
`CrmUniversity`).
**Status:** binding for any import performed after 2026-10-25.
**Owner:** data verification team (see `docs/course-catalogue/schema-and-provenance.md`
for the record-level controls).

## 1. Purpose

State exactly which sources ALO Education may use, for what, under which licence,
and what must never be done. This exists because the repository currently contains
a large volume of catalogue rows whose provenance is a seeded template rather than
an official page (measured in `import-validation-results.md`), and because
"found in a search result" is not evidence.

## 2. Source hierarchy

| Tier | Source type | May be used to | May **not** be used to |
|---|---|---|---|
| 1 | Official university course page | Confirm title, level, duration, mode, fees, entry requirements, deadline | Infer a course exists because a similar one does at another institution |
| 2 | Official university department / admissions / funding / supervisor page | Confirm department, research area, studentship, supervisor affiliation | Prove a supervisor is accepting students |
| 3 | Government / regulator / official dataset (OfS register, HESA Discover Uni, GOV.UK guidance) | Verify provider status, undergraduate KIS facts, official guidance | Fill postgraduate or doctoral coverage that the dataset does not contain |
| 4 | Reputable discovery sites (FindAPhD, Prospects, aggregators) | Discover candidate records, then verify at the official page | Import facts, copy descriptions, treat a listing as confirmation |
| 5 | Partner feeds / authorised APIs | Facts within the contractual scope of that feed | Anything outside the licence |

A record built only from Tier 3–5 evidence is stored as `NEEDS_REVIEW` or
`PARTIALLY_VERIFIED`; only Tier 1–2 evidence can produce `VERIFIED`.

## 3. Licence register

| Source | Licence / terms | What ALO may do | Attribution required |
|---|---|---|---|
| **HESA Discover Uni dataset** (formerly Unistats) | CC BY 4.0 — *"free to copy, use, share, and adapt for any purpose… You must give appropriate credit (HESA, www.hesa.ac.uk), provide a link to the licence, and indicate if any changes have been made."* ([hesa.ac.uk discover-uni-dataset](https://www.hesa.ac.uk/data-and-analysis/discover-uni-dataset), checked 2026-10-25) | Import UK undergraduate facts if adopted | Yes — see §6 |
| **Office for Students register** | Site terms; register is for checking provider status | Check whether an English provider is registered | No bulk copying; link to the register entry |
| **GOV.UK higher education course guidance** | Crown copyright, Open Government Licence where stated | Quote short guidance with attribution | Yes (OGL) |
| **FindAPhD** | Site terms; discovery-oriented | Find candidates; open the official page | No — but never bulk copy listings |
| **University websites** | Each institution's own terms | Store minimal facts + short original summary + link | Not usually required, but never copy prose, images or PDFs |
| **Partner APIs** | Contract | Whatever the contract allows | Per contract |

**Not adopted in this phase:** Discover Uni dataset, any partner feed, any
aggregator database. The table records what *would* be required, not what is loaded.

## 4. Hard rules

1. **No guessed URLs.** A URL must be copied from an official page or captured from a
   real crawl. Constructing `https://<domain>/courses/<slug>` is forbidden — the
   current `02_ALO_COURSE_MASTER.csv` violates this (e.g. Oxford row
   `…/courses/foundation-`), which is why those rows are quarantined.
2. **No invented courses.** A programme exists in ALO only if an official page shows
   it. "Oxford has law degrees" does not create "Foundation Certificate in Medicine".
3. **No bulk scraping.** Before any crawl: check `robots.txt`, the site's terms, the
   published rate limits, and identify ALO with a contactable user agent. One
   institution at a time, low concurrency, stop on 429/403.
4. **No login walls, paywalls or anti-bot circumvention.** Ever.
5. **No copying** of prospectus PDFs, course prose, photographs, logos or ranking
   tables. Store the official title (needed for identification), a short factual
   summary written by ALO, and the source link.
6. **Numbers stay unknown.** `null` is not `0`, not "not required", not "TBC".
   A missing fee is a missing fee, not "free".
7. **Home and international fees are never merged**, and every fee carries an
   academic year, currency and student category.
8. **Deadlines carry a date and a status.** An expired deadline is never shown as open.
9. **A record is never deleted because a page 404s.** It is flagged, retained with
   provenance, and reviewed against linked applications first.
10. **No student data enters the catalogue pipeline.** Imports read public pages and
    CSV files only; they never read `Student`, `Application` or document tables.

## 5. Discovery-source registration

Every discovery source must exist as a `CrmDiscoverySource` row before use:

| Field | Meaning |
|---|---|
| `name`, `baseUrl` | The source |
| `allowedUse` | `discovery_only` (default) — never `publishable` without review |
| `robotsUrl`, `robotsStatus` | `not_checked` until someone records the result |
| `termsStatus` | `not_reviewed` until the terms are read |
| `lastCheckedAt` | Date of the last human check |

**Gap (open):** the crawler adapters
(`src/lib/official-crawlers/aston-adapter.ts`) send an identifying User-Agent but
do **not** yet fetch `robots.txt` or enforce a minimum request interval. Until they
do, automated crawling is limited to sources whose robots/terms have been checked
by hand and recorded on the `CrmDiscoverySource` row.

## 6. CC BY 4.0 attribution (required if Discover Uni data is adopted)

Every page, export or API response that contains Discover Uni data must carry:

> Contains data from the Discover Uni dataset, © Higher Education Statistics Agency
> (HESA), https://www.hesa.ac.uk, licensed under CC BY 4.0
> (https://creativecommons.org/licenses/by/4.0/). ALO Education has reformatted and
> filtered this data; ALO did not modify the underlying values.

Plus, on any transformed field: "changed from source format". Attribution must
travel with the data (API response metadata as well as the page), or the dataset may
not be used.

## 7. Enforcement in the codebase

| Control | Where |
|---|---|
| Public visibility requires published + VERIFIED + a source link + a public university | `src/lib/public-catalog.ts` (`publicCourseWhere`, `publicUniversityWhere`) |
| Public detail pages refuse unverified records | `src/app/api/courses/[slug]/route.ts` (404 with an explicit message) |
| Sitemap excludes unverified/conflicting records | `src/app/sitemap.ts` |
| Import batches require preview → approval → execute | `src/app/api/admin/import/batches/[id]/*` |
| Source checks are recorded with status, URL, soft-404 flag, content hash | `CrmOfficialSourceCheck`, `CrmSourceVerificationEvent` |
| Discovery sources carry robots/terms status | `CrmDiscoverySource` |

## 8. Review

* Re-check this policy whenever a new source tier is added or a licence changes.
* Re-check every `CrmDiscoverySource.termsStatus` at least annually.
* Any exception must be recorded in this file with a date, owner and justification
  before the import runs — not afterwards.
