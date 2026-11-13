# Course catalogue — schema and provenance

Describes the entities that already exist in `prisma/schema.prisma` (599 models),
how provenance is attached to a catalogue fact, and what is missing. Nothing here
proposes a migration that has not been reviewed; no schema change was made in this
phase.

## 1. What exists today (verified by reading the schema)

### Institution and course core

| Model | Purpose | Key fields |
|---|---|---|
| `CrmUniversity` | Institution record used by the Course Finder | `universityId` (unique), `name`, `slug`, `countryId`, `city`, `website`, `officialUrl`, `ranking*`, `verificationStatus`, `publicationStatus`, `status` |
| `CrmCourse` | Course record | `courseId`, `courseTitle`, `universityId`, `country`, `city`, `studyLevel`, `subjectArea`, `duration`, `studyMode`, `verificationStatus`, `publicationStatus`, `status`, `internationalEligibility`, `sourceUrl`/`officialUrl` |
| `CourseIntake` | Intake + fee per course | intake year/month, fee, currency, fee category |
| `CourseComparison`, `CourseComparisonList`, `CourseShortlist` | Student shortlists and side-by-side comparison | owner, items |
| `CoursePage`, `CourseView`, `UniversityPage` | Public page content and view tracking | slug, sections |
| `Campus`, `UniversityFaculty` | Location and faculty records | institution link |
| `UniversityResearchEvidence`, `UniversityResearchActivity` | Research-degree evidence | source link, verification |

### Provenance and verification

| Model | Purpose |
|---|---|
| `CrmDiscoverySource` | Registered discovery source with `allowedUse`, `robotsStatus`, `termsStatus`, `lastCheckedAt` |
| `CrmDiscoveryRecord` | A candidate found at a discovery source, linked to its official URL once found |
| `CrmSourceVerificationEvent` | Immutable log of a verification attempt: `sourceUrl`, `sourcePriority`, `httpStatus`, `finalUrl`, `soft404`, `entityMatchStatus`, `verificationStatus`, `checkedAt`, `checkedBy` |
| `CrmOfficialSourceCheck` | Per-URL check: requested/final URL, HTTP status, redirect status, page title, expected entity, match status, soft-404 flag, `contentHash`, parser version, failure reason |
| `CrmImportBatch`, `CrmImportError`, `CrmSourceLog`, `ImportBatch`, `ImportError` | Batch audit, per-row errors, source logs |
| `SourceSnapshot`, `VerificationRun`, `SourceChangeEvent`, `OfficialSource` | Snapshot/change tracking used by monitoring |
| `UniversityHistory`, `CourseHistory` | Field change history |

### Research-catalogue entities (PhD module)

`PhdUniversity`, `PhdProgramme`, `PhdSupervisor`, `PhdFundingOpportunity`,
`PhdSourceEvidence` (47 `Phd*` models total, see
`prisma/migrations/20261025120000_phd_proposal_builder/migration.sql`).

## 2. Provenance model — how a fact is justified

A catalogue fact is publishable only when **all** of the following hold:

1. `verificationStatus = 'VERIFIED'`;
2. `publicationStatus ∈ {published, PUBLISHED}`;
3. `status = 'active'`;
4. the record has a source link (`sourceUrl` or `officialUrl` non-empty);
5. the parent university is itself public (`publicUniversityWhere()`);
6. the course is not marked ineligible for international students.

This is implemented once in `src/lib/public-catalog.ts` and reused by every public
route, the sitemap and the detail pages, so the search results and the detail page
cannot disagree.

Evidence is stored at **record** granularity plus an append-only event log:

```
CrmUniversity / CrmCourse
   └── verificationStatus, sourceUrl, lastVerifiedAt, publicationStatus
CrmOfficialSourceCheck  (one row per URL check, with contentHash + soft404)
CrmSourceVerificationEvent (one row per attempt, with actor + status)
CrmImportBatch → CrmImportError (one row per rejected/flagged input row)
```

A `contentHash` lets a later run detect that the page changed since it was verified,
without storing the page text.

## 3. Qualification taxonomy

**Current state:** `CrmCourse.studyLevel` is a short string and `award`/`courseTitle`
carry the official name. The bulk master file classifies every row into one of four
values only — Foundation (4 509), Undergraduate (4 450), Postgraduate (4 469), PhD
(4 225) — which cannot express MRes vs MSc-by-research vs MPhil vs EngD vs
professional doctorate.

**Required and not yet built:** a normalized taxonomy table, e.g.

| Concept | Rule |
|---|---|
| `qualification_category` | ALO-controlled enum (foundation, UG certificate, bachelor, integrated master's, PG certificate, PG diploma, taught master's, research master's, MPhil, PhD/DPhil, professional doctorate, EngD, professional/conversion, short course) |
| `official_award_name` | Stored verbatim from the institution |
| `national_framework` | e.g. RQF level, with the framework named |
| Mapping rule | Never treat two national frameworks as automatically equivalent; store the framework and level as published |

Until that table exists, Research degrees must not be counted by reading
`studyLevel = 'PhD'`: 4 225 rows carry that value from a seeded template and have
not been verified as doctoral programmes.

## 4. Research-specific fields required by the PhD catalogue

For MRes / research master's / MPhil / PhD / DPhil / EngD records the following must
be stored **separately** (not concatenated into one description):

* advertised project vs applicant-developed proposal (a discriminator, not prose);
* funding status (`fully_funded` / `partially_funded` / `fees_only` / `unknown`);
* general admission deadline, funding deadline and project deadline as three fields;
* supervisor links with the supervisor's own verification status;
* research proposal requirement (word limit, required headings) when published.

Today these live only in the `Phd*` research module, not in the public catalogue.
Bringing public research-degree pages online requires that link to be made first.

## 5. Field-level provenance

The prompt asks for provenance per important field. The current implementation is
record-level plus an event log; it does **not** record "this fee came from URL A on
date B while this IELTS score came from URL C".

**Gap.** The minimal add (not applied) is a `CatalogueFieldProvenance` table:

```
id, entityType, entityId, field, sourceUrl, sourceType,
evidenceExcerpt, retrievedAt, verifiedBy, verificationStatus, contentHash
```

with a unique index on `(entityType, entityId, field, sourceUrl)`. Until it exists,
any UI claim of field-level provenance would be untrue — so the public pages must
say "record-level source", not "every field verified".

## 6. Migration policy

* Additive only, reviewed, with a rollback note; no `migrate reset`, no
  `--accept-data-loss`, no dropping catalogue tables.
* Existing student applications, shortlists, notes, commissions and audit rows are
  never rewritten by a catalogue import.
* Historical values stay in `CourseHistory` / `UniversityHistory`.
* A conflicting newer value is staged for review, not written over a verified one.
