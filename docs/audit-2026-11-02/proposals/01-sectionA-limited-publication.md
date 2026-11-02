# Section A — Limited-information publication pathway

Status: **PROPOSED — not applied, not migrated, nothing published.**
Decision record: Phase 0D approval of 2026-11-02.

---

## 1. What is and is not changing

| Thing | Before | After (proposed) |
|---|---|---|
| `CrmCourse.verificationStatus` semantics | `VERIFIED` = every rendered field is backed by course-specific official evidence | **Unchanged.** No new status equals `VERIFIED`. |
| Catalogue gate for fully verified courses | `src/lib/public-catalog.ts` + `src/lib/course-finder/public-content-page-policy.ts` | **Unchanged.** Not edited by any patch in this proposal. |
| `PARTIALLY_VERIFIED` automatic publication | Never publishes | **Still never publishes.** A partially verified record becomes visible only when a Super Admin approval row exists *and* the field-level rules below pass. |
| Partially verified records | Invisible | Visible through a **separate** pathway, only after explicit approval, with unevidenced fields labelled **"Not confirmed"**. |

Two propositions this design rejects:

* *"Add a `published_partial` value to `publicationStatus`."* Rejected: it makes the existing gate's meaning ambiguous and any future reader of `publicationStatus` inherits a second interpretation.
* *"Relax the gate for `PARTIALLY_VERIFIED` when most fields pass."* Rejected: "most" is not a rule, and the failure mode is a public fee or deadline that nobody can source.

## 2. Eligibility rules (all must hold)

Implemented in `files/limited-publication-policy.ts`, function
`limitedPublicationBlockers()`. The policy is pure — no Prisma import, no I/O —
so every rule below is unit-tested without a database (20 tests, all passing; see
`07-VERIFICATION-LOG.md`).

1. `verificationStatus === 'PARTIALLY_VERIFIED'`. A `VERIFIED` record is refused with
   `FULLY_VERIFIED_USE_EXISTING_GATE` — it belongs on the existing gate.
   `UNVERIFIED_SYNTHETIC` and `NEEDS_REVIEW` can never pass.
2. `publicationStatus` is not already `published`/`PUBLISHED` (`ALREADY_PUBLISHED`).
3. An approval row exists for **this** course, in state `APPROVED`, with a timestamp,
   recorded as granted by a role containing `super_admin`, not revoked
   (`NO_APPROVAL_RECORD`, `APPROVAL_STATE_*`, `APPROVER_WAS_NOT_SUPER_ADMIN`,
   `APPROVAL_REVOKED`, `APPROVAL_NOT_TIMESTAMPED`, `APPROVAL_BELONGS_TO_ANOTHER_COURSE`).
4. At least one **course-specific** evidence row exists. Course-specific means all of:
   `entityType = 'COURSE'`, `courseSlug` equals this course's slug, `universitySlug`
   equals this course's institution (**this is the Phase 0D relink defect fixed at the
   policy layer**), `verificationStatus = 'VERIFIED'`, `sourceUrl` is `https://`, and
   `contentHash` is a 64-hex sha256. Otherwise `NO_COURSE_SPECIFIC_EVIDENCE`.
5. The approval's `evidenceSnapshotKeys` equals the current set of usable evidence keys.
   A re-link after approval invalidates the approval (`APPROVAL_EVIDENCE_SNAPSHOT_STALE`)
   instead of silently widening what may be shown.
6. The record is not on `LIMITED_PUBLICATION_DENY_LIST`. Deny-listed records are refused
   even with a valid approval row and real evidence — defence in depth against operator
   error in the approval UI.

### The deny list (verbatim from the recovery audit)

| University slug | Course slug | Reason |
|---|---|---|
| `AU-monash-university` | `VC-monash-master-of-business` | HOLD: fee, deadline, intake, entry and English requirements are unevidenced. |
| `aston university` | `AS-foundation-programmes` | No course-specific official evidence; institution-level source only. |
| `aston university` | `AS-3d-printing-of-ocular-films-for-treatment-of-ocula` | Same. |
| `aston university` | `AS-advancing-episignature-analysis-for-chromatin-diso` | Same. |

## 3. Field-level evidence and the words on the page

The public payload is an **allow-list**, not a projection of the row:

* `course_title`, `institution`, `study_level`, `study_mode`, `campus`,
  `academic_year`, `duration` — rendered only when the course-specific evidence's
  `fieldScope` includes that field **and** the stored value is non-empty.
* Every other field renders the literal string `Not confirmed` (never `—`, never `0`,
  never blank).
* A `0` in `durationMonths`, `tuitionFee` or an empty `deadline` is treated as *unset*,
  not as a fact. `renderClaim(0)` returns `Not confirmed`; there is a test for it.
* Money, timing and eligibility claims (`fee`, `tuition_fee`, `entry_requirement`,
  `english_requirement`, `start_months`, `intake_dates`, `application_deadline`,
  `scholarship`, `eligibility`) are **suppressed entirely** while
  `LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED === false`. They are named on the page in
  words ("We do not have course-specific official evidence for the following, so we do
  not state them anywhere on this page") so that omission cannot read as "no fee".
* Flipping that flag requires its own approval: it changes what a prospective student
  can rely on. Even then it only *permits* an evidenced value; it never invents one.

Public page (`files/LimitedCourseDetail.tsx`, wired by patch `9003`):
amber "Partially verified record" badge, the policy's banner sentence, the field grid
with `Not confirmed` labels, the suppressed-claims block, and source hostnames.
`CourseDetailHub` is **not** given a "partial" mode — a shared component that already
assumes fees and intakes exist would be the easiest place to leak one.

SEO: a limited page emits **breadcrumb JSON-LD only**, no `Course` schema, and
`robots: { index: false, follow: true }`. Indexing a partially evidenced course is a
separate decision that has not been made. Changing it is a one-line change in the
patch, deliberately isolated.

## 4. Data model (additive)

Applied by `patches/9002-prisma-limited-publication-model.patch`:

* new model `CrmCourseLimitedPublication` (approval row, one per course);
* one new relation field `limitedPublication CrmCourseLimitedPublication?` on `CrmCourse`
  — schema-only, **no column** on `CrmCourse`, so no change to the 8,746 existing rows.

`state` is a plain string with documented values (`NOT_REQUESTED | PENDING_APPROVAL |
APPROVED | REJECTED | REVOKED`), not a Prisma enum, because the schema has no enum
anywhere and a MySQL `ENUM` alteration is a locked-table operation we do not need.

Why a table rather than columns on `CrmCourse`:

* an approval is attributable to one Super Admin at one time — history survives;
* revoking publication never touches the verification record;
* rollback is `DROP TABLE` and nothing else;
* `verificationStatus`/`publicationStatus` keep their existing, single meanings.

SQL: `sql/9002-limited-publication.up.sql` / `.down.sql`. Apply writes **0 rows to
existing tables** and creates an empty table.

## 5. API

`files/limited-publication-approval-route.ts` →
`src/app/api/admin/courses/[id]/limited-publication/route.ts`

* `POST` actions: `request`, `approve`, `revoke` (a reason is mandatory; it lands in
  `CrmAuditLog`, never on the public page).
* Order: `requireSuperAdmin(auth)` → `isSameOrigin` → parse body → resolve course →
  policy pre-flight → single transaction (approval row + audit row). An unauthorised
  caller learns nothing about body validity or course ids — the same rule section C
  applies to the WhatsApp route.
* `requireSuperAdmin` rejects an Acting-As session, so impersonating an employee is not
  a route to publishing.
* `approve` returns `409` with the blocker list when the policy refuses, so the operator
  sees *why* rather than a silent no-op.

## 6. Rollback

| Step | Command | Effect |
|---|---|---|
| 1 | revert `9003` (page branch) | limited records stop resolving; 404 as before |
| 2 | revert API route + component removal | no approval surface remains |
| 3 | run `9002-limited-publication.down.sql` | `DROP TABLE`; approvals lost, which is the intent |
| 4 | revert `9002` (schema) + `npx prisma generate` | client matches schema |
| 5 | `LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED` stays `false` | money/timing can never have been exposed |

No `CrmCourse` row is modified at any point in apply or rollback, so there is no data
repair step. Verification queries are in the `.up.sql` header.

## 7. Approval required before anything runs (section F record)

* Migration `9002` on staging: DB name, expected 0 rows, checksum of the `.up.sql`,
  `mysqldump` of `CrmCourse`/`CrmOfficialEvidence`/`CrmAuditLog`.
* No seed, no import, no backfill: **nothing is approved for the 8 recovered courses in
  this phase.** The approval table starts empty; `state` defaults to `NOT_REQUESTED`.
* Separate approval for `LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED = true` (not requested
  here).

## 8. Explicit non-goals in this phase

* Publishing any of the 8 recovered courses — including the 7 that will later be the
  natural first candidates.
* Changing `VERIFIED`, `PUBLISHED_STATUSES`, or `SOURCE_VERIFIED_STATUSES`.
* Any write to `CrmCourse.verificationStatus` or `publicationStatus`.
* Deriving evidence scope from client input. The API reads `fieldScope` from
  `CrmOfficialEvidence` only; a request may not assert what is evidenced.
