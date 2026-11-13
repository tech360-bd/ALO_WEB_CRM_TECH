# Section F — Staging/production controls and per-change approval record

Status: **TEMPLATE — nothing is approved by this document.** The Phase 0E gate stands.

---

## 1. The gate remains mandatory

Phase 0E is the owner-attestation gate in
`../phase0d/06-STAGING-PREFLIGHT-CHECKLIST.md` Part A. All eight attestations must be
answered in writing before any staging access, and no migration, seed, import or write is
approved by any instruction, ticket or conversation in this phase — including by the brief
that requested this proposal. Approval is granted only by a signed record below.

| # | Attestation (verbatim scope) | Answer | Recorded |
|---|---|---|---|
| A1 | Is this database **non-production**? (explicit YES) | | ☐ |
| A2 | Exact environment name (a name, not "the other one") | | ☐ |
| A3 | Hosting ownership — who operates the server and the owning account | | ☐ |
| A4 | Separate from the live CRM — different host, different credentials, no replication from production | | ☐ |
| A5 | Permitted operations for this phase (default: read-only SELECT) | | ☐ |
| A6 | Backup arrangement — last successful backup, restore tested? | | ☐ |
| A7 | Who is authorised to run the preflight, and when | | ☐ |
| A8 | Confirmation that **no** migration, seed, import, update or delete is approved yet | | ☐ |

Any missing or negative answer ⇒ STOP.

## 2. Per-change approval record (one record per change, no bundling)

Copy this block for every proposed change. A record that omits a field is not an approval.

```md
### Approval record — <change id>

**Change id:**            <e.g. A-9002-prisma-model>
**What it does:**         <one sentence, in business terms>
**Proposed by / date:**
**Reviewed by / date:**

#### Target (exact, not inferred)
- Database host:          <exact hostname>
- Database name:          <exact database>
- Environment:            <staging | uat | dev-2 …>   (never "production" in this phase)
- Connection identity:    <account used, and its grants>
- Server timestamp/timezone:

#### Blast radius
- Tables read:            <exact list>
- Tables written:         <exact list, or "none">
- Columns added/dropped:  <exact list, or "none">
- Expected rows written **to existing tables**: <number, or 0>
- Expected rows created in new tables:          <number>
- Expected rows modified:                        <number>
- Rows expected to change status:                <number>
- Idempotent?             <yes/no + how>

#### Sources (immutable inputs)
| File | SHA-256 | Bytes |
|---|---|---|
| <path> | <hash> | <size> |

#### Pre-state evidence
- Backup taken:           <date/time, method, location, size>
- Restore tested:         <yes/no + date>
- Pre-state row counts captured: <yes/no + where stored>
- Rollback rehearsed on a copy:  <yes/no>

#### Rollback
- Statement(s):           <exact SQL or revert instructions>
- Data loss on rollback:  <what is lost, explicitly>
- Time to roll back:      <minutes>
- Decision point:         <who decides, at what signal>

#### Authorisation
- Approved by (name):     ______________________
- Role:                   ______________________
- Date/time:              ______________________
- Scope approved:         <exactly what — reproduce, do not reference>
- Expiry of this approval: <date/time>
```

## 3. Schema facts that must be restated in every record

These were established statically in Phase 0D and change how each change must be written.

| Fact | Consequence for a change |
|---|---|
| Catalogue lives in `CrmUniversity` / `CrmCourse`, not `University` / `Course` | any statement using the unprefixed names fails or, worse, targets a different table |
| `CrmCourse` has **no** `@@map`, so table name = model name | write `` `CrmCourse` `` in backticks |
| `CrmCourse.verificationStatus` is a `String` default `NEEDS_REVIEW`; no enum | a typo creates a new status nothing understands; a change must state the exact allowed values |
| `CrmCourse.publicationStatus` (not `approvalStatus`) drives the public gate | the 23 other models carrying `approvalStatus` are unrelated; do not copy that column name |
| Four overlapping coverage models exist (`CourseMonthCoverage`, `CourseMonthCoverageVersion`, `CrmCourseMonthlyCoverage`, `CrmCoverageRevision`) | which is authoritative is **unknown**; no coverage import can be approved until that is answered |
| `CrmOfficialEvidence` keys on `universitySlug`/`courseSlug`; the CSVs use `institution_key`/`course_key` | the mapping must be specified and slug collisions checked before any evidence write |
| `CrmCourse.slug` is indexed but **not unique** | any statement keyed on slug must state how duplicates are resolved |
| `UserSession` and `StudentProfile` do not exist | use `User` and `PortalStudentProfile` |

## 4. Changes proposed in this phase that would each need their own record

| Id | Change | Writes? | Status |
|---|---|---|---|
| A-9002 | `CREATE TABLE CrmCourseLimitedPublication` (+ FK, 3 indexes) | creates 1 empty table; 0 rows in existing tables | proposed, not approved |
| A-9002-down | `DROP TABLE CrmCourseLimitedPublication` | drops 1 table (approvals lost by design) | rollback, not approved |
| D-3002 | `toBdDisplayPhone` slice fix | no DB access | proposed, not approved |
| D-countryCode | write `WhatsAppContact.countryCode` on inbound | yes: 1 row per inbound message | **not proposed for this phase** — needs its own record + backfill approval |
| E-step1 | add rate limiting to `/api/course-finder/eligibility` | no DB access | proposed (interim), not approved |
| — | publication of any of the 8 recovered courses | yes | **explicitly forbidden in this phase** |

## 5. Standing prohibitions during this phase

* No database connection is opened by the audit or by these proposals.
* No migration, seed, import, backfill, update or delete.
* No production deployment, no commit/push/merge of the proposed diffs.
* No publication of the 8 recovered courses, Monash (HOLD), Aston (unpublished), synthetic
  or unapproved records.
* No change to the meaning of `VERIFIED`, and no new status equal to it.
* No weakening of RBAC, of test assertions, or of any security control to make a check pass.
