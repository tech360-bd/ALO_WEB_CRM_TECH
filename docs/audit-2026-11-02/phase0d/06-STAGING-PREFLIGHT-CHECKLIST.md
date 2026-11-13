# Phase 0D · 06 — Staging Preflight Checklist (gate for Phase 0E)

**Status: NOT STARTED. No connection has been opened. No credentials were requested or stored.**
This document is the gate that must be satisfied, in order, before any database work begins.

A production connection string is **never** an acceptable substitute for a staging one. If the only
connection string available is the production one, the answer is "not connected", not "probably fine".

---

## Part A — Owner attestation (blocking; cannot be automated)

Each line must be answered **in writing** by the database owner. "Probably", "should be" and "I think"
are not confirmations.

| # | Question | Required answer | Recorded answer |
|---|---|---|---|
| A1 | Is this database **non-production**? | explicit **YES** | ☐ |
| A2 | Exact environment name (e.g. `staging`, `uat`, `dev-2`) | a name, not "the other one" | ☐ |
| A3 | Hosting ownership — who operates the server and the account that owns it | named team/person + provider | ☐ |
| A4 | Is it **separate** from the live CRM database — different host, different credentials, no replication from production | explicit **YES** + how separation is achieved | ☐ |
| A5 | Permitted operations for this phase (default: **read-only SELECT only**) | explicit scope | ☐ |
| A6 | Backup arrangement — last successful backup, restore tested? | date + restore-tested yes/no | ☐ |
| A7 | Who is authorised to run the preflight, and when | named operator + window | ☐ |
| A8 | Confirmation that **no** migration, seed, import, update or delete is approved yet | explicit **YES** | ☐ |

**If any answer is missing or negative, STOP. Do not proceed to Part B.**

## Part B — Technical preflight (read-only)

Run `phase0c/staging-db/00-preflight-identity.sql`. It is `SELECT`-only and begins with an existence
check so a missing table cannot abort the run. Capture the output verbatim.

| # | Check | Pass condition | Result |
|---|---|---|---|
| B1 | `@@hostname`, `DATABASE()`, `CURRENT_USER()` | matches A2/A3; no `prod`/`live`/`primary`/`main` token | ☐ |
| B2 | Replication peers (`performance_schema.replication_connection_configuration`) | empty, or only staging peers | ☐ |
| B3 | Table existence | `CrmUniversity`, `CrmCourse`, `CourseIntake`, `CrmOfficialEvidence`, `CourseMonthCoverage`, `CrmCourseMonthlyCoverage`, `PortalStudentProfile`, `User`, `Lead`, `Application`, `AuditLog`, `SystemSetting` | ☐ |
| B4 | Row counts | plausible for staging; **recorded**, not judged against a guess | ☐ |
| B5 | Real-customer markers (`@example.`, `@alo.test` vs other domains) | zero non-test addresses, or every hit explained and reported — **never deleted** | ☐ |
| B6 | Environment marker in `SystemSetting` | read; absence recorded as `UNKNOWN`, not as "safe" | ☐ |
| B7 | Grants (`information_schema.SCHEMA_PRIVILEGES`) | read-only for the audit user | ☐ |
| B8 | `@@read_only` / `super_read_only` | recorded; a read-only server is preferred | ☐ |

## Part C — Schema compatibility (already established statically)

These are known before connecting, and they change the meaning of every query:

| Fact | Consequence |
|---|---|
| Catalogue lives in `CrmUniversity` / `CrmCourse`, **not** `University` / `Course` | every query must use the `Crm*` names (the preflight file already does) |
| `CrmCourse.verificationStatus` is a `String`, default `NEEDS_REVIEW` | a typo silently creates a new status; no DB-level constraint protects the policy |
| **Four** coverage models exist: `CourseMonthCoverage`, `CourseMonthCoverageVersion`, `CrmCourseMonthlyCoverage`, `CrmCoverageRevision` | importing 104 course-months into the wrong one produces data no UI reads. Which is authoritative is **unknown** and must be answered before any import |
| `UserSession` and `StudentProfile` do not exist | use `User` and `PortalStudentProfile` |
| `CrmOfficialEvidence` keys on `universitySlug`/`courseSlug` while the CSVs use `institution_key`/`course_key` | mapping required; slug collisions would silently merge evidence |
| Public gate requires `verificationStatus = 'VERIFIED'` **and** `approvalStatus = 'PUBLISHED'` | any import that writes `PARTIALLY_VERIFIED` publishes nothing (which is the approved safe outcome) |

## Part D — Reconciliation plan (read-only)

Run `phase0c/staging-db/01-recovery-verification.sql`, then compare with the Phase 0D canonical set:

| Compare | Against | Decision if DB is larger | Decision if DB is smaller |
|---|---|---|---|
| `CrmUniversity` count and verification distribution | `canonical/canonical-institutions.csv` (593; 79 identity-verified) | DB holds unexported data → recovery win, export via SELECT | files are ahead → nothing lost |
| `CrmCourse` count and status distribution | `canonical/canonical-courses.csv` (8,746; 8 `PARTIALLY_VERIFIED`) | as above | as above |
| `CourseIntake` count and status | 927 (104 verified + 823 synthetic) | as above | as above |
| `CrmOfficialEvidence` by `sourceType` | 30 catalogue · 32 universe-source · 14 URL-check | new evidence exists in DB only | evidence was never imported |
| Orphaned evidence | the 7 unlinked ids in Phase 0C report 02 §3 | more orphans → more relinks to validate | relinks already applied in files |
| Duplicate institutions | 12 confirmed aliases + 21 suspects | duplicates exist in DB too | files are ahead |
| Coverage models | all four row counts | identifies which model is live | identifies which are vestigial |

Every divergence is recorded with the row ids. **Nothing is corrected during reconciliation.**

## Part E — Stop conditions (any one halts the phase)

1. Any A-answer missing, hedged, or negative.
2. Host/database name contains `prod`, `live`, `primary`, `main`.
3. A replication channel points at a production primary.
4. Real-customer personal data detected in quantity (report, do not touch).
5. The audit user has write grants.
6. The connection string supplied is the production one.
7. Two people disagree about which environment it is — unresolved disagreement is a stop, not a vote.

## Part F — Separate approval for any write

Even after A–E pass, the following remain **unapproved** and need a fresh, explicit decision with a
named rollback plan: migrations, seeds, imports, `UPDATE`, `DELETE`, `SELECT … INTO OUTFILE`, any DDL,
and any change to the four coverage models.

That approval must state: which tables, how many rows, from which file, the rollback, and who verifies
the result.

## Part G — What Phase 0E may then do

Read-only, in this order:
1. Run B and capture output.
2. Run D and capture divergences with ids.
3. Produce a dry-run import manifest — **manifest only**, no execution.
4. Return findings for approval.

No write of any kind is part of Phase 0E unless separately approved under Part F.

---

### Sign-off block

| Role | Name | Date | Answer |
|---|---|---|---|
| Database owner (A1–A8) | | | |
| Audit operator (B, D) | | | |
| Approval for any write (F) | | | |
